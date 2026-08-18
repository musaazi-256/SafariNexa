import Link from "next/link";
import { Banknote, Percent, Landmark, Undo2, ArrowRight, Search, Filter, Download } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PaymentStatusBadge, RefundStatusBadge } from "@/components/ui/status-badge";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { PLATFORM_COMMISSION_RATE, summarizePayments } from "@/lib/revenue";
import { toPaymentStatus, toRefundStatus } from "@/lib/status";
import { logAuditEvent } from "@/lib/audit";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

const TABS = [
  { value: "ALL", label: "All" },
  { value: "SUCCESSFUL", label: "Successful" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" }
];

export default async function AdminPaymentsPage({ searchParams }: { searchParams: { page?: string; q?: string; status?: string } }) {
  await requireAdminSession();

  const page = parsePage(searchParams.page);

  const activeTab = searchParams.status?.toUpperCase();
  const q = searchParams.q?.trim();

  const where: any = activeTab && activeTab !== "ALL" ? { status: activeTab } : {};
  if (q) {
    where.OR = [
      { booking: { listing: { title: { contains: q, mode: "insensitive" } } } },
      { booking: { business: { name: { contains: q, mode: "insensitive" } } } }
    ];
  }

  const [allPayments, pagePayments, totalCount, refunds] = await Promise.all([
    db.payment.findMany({ select: { status: true, amountMinor: true, payoutId: true } }),
    db.payment.findMany({
      where,
      include: { booking: { include: { listing: true, business: true } }, order: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.payment.count({ where }),
    db.refund.findMany({
      include: { booking: { include: { listing: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  const { grossMinor, commissionMinor, netMinor, refundedMinor, unsettledNetMinor } = summarizePayments(allPayments);

  async function approveRefund(formData: FormData) {
    "use server";
    const adminSession = await requireAdminSession();
    const refundId = String(formData.get("refundId"));

    const targetRefund = await db.refund.findUnique({
      where: { id: refundId },
      include: { payment: true }
    });

    if (!targetRefund || targetRefund.status !== "REQUESTED") {
      throw new Error("Invalid refund request.");
    }

    if (targetRefund.payment.provider === "STRIPE" && targetRefund.payment.providerReference) {
      try {
        await stripe.refunds.create({
          payment_intent: targetRefund.payment.providerReference,
          amount: targetRefund.amountMinor,
        });
      } catch (err: any) {
        throw new Error(`Stripe Refund Failed: ${err.message}`);
      }
    }

    await db.$transaction([
      db.refund.update({
        where: { id: refundId },
        data: { status: "COMPLETED", reviewedByAdminId: adminSession.user.id }
      }),
      db.payment.update({
        where: { id: targetRefund.paymentId },
        data: { status: "REFUNDED" }
      }),
      db.booking.update({
        where: { id: targetRefund.bookingId },
        data: { status: "REFUNDED" }
      })
    ]);

    await logAuditEvent({
      actorUserId: adminSession.user.id,
      actorEmail: adminSession.user.email ?? undefined,
      surface: "ADMIN",
      action: "admin_approved_refund",
      outcome: "SUCCESS",
      metadata: { refundId, amount: targetRefund.amountMinor }
    });

    redirect("/admin/payments");
  }

  async function processAllPayouts() {
    "use server";
    const adminSession = await requireAdminSession();
    
    const unsettled = await db.payment.findMany({
      where: { status: "SUCCESSFUL", payoutId: null, bookingId: { not: null } },
      include: { booking: true }
    });
    
    if (unsettled.length === 0) return;
    
    const byBusiness = unsettled.reduce((acc, p) => {
      const bId = p.booking!.businessId;
      if (!acc[bId]) acc[bId] = [];
      acc[bId].push(p);
      return acc;
    }, {} as Record<string, typeof unsettled>);
    
    await db.$transaction(async (tx) => {
      for (const [businessId, payments] of Object.entries(byBusiness)) {
        const gross = payments.reduce((sum, p) => sum + p.amountMinor, 0);
        const net = gross - Math.round(gross * PLATFORM_COMMISSION_RATE);
        
        const payout = await tx.payout.create({
          data: {
            businessId,
            amountMinor: net,
            status: "COMPLETED",
            notes: "Batch platform settlement",
          }
        });
        
        await tx.payment.updateMany({
          where: { id: { in: payments.map(p => p.id) } },
          data: { payoutId: payout.id }
        });
      }
    });
    
    await logAuditEvent({
      actorUserId: adminSession.user.id,
      actorEmail: adminSession.user.email ?? undefined,
      surface: "ADMIN",
      action: "admin_processed_payouts",
      outcome: "SUCCESS",
      metadata: { batchCount: Object.keys(byBusiness).length }
    });
    
    redirect("/admin/payments");
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20 font-sans">
      
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e613c] mb-1">ADMIN PORTAL</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Payments, refunds & payouts</h1>
        <p className="text-[13px] text-slate-500 font-semibold max-w-2xl">Track customer payments, provider references, refunds, and platform commission — platform-wide.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Gross Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-full bg-[#E4F2E8] flex items-center justify-center shrink-0">
                <Banknote className="h-5 w-5 text-[#1e613c]" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 leading-tight whitespace-nowrap">{formatUGX(grossMinor)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900">Gross revenue</span>
              <span className="text-[11px] font-semibold text-slate-500">All time</span>
            </div>
          </div>
        </div>

        {/* Platform Commission */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                <Percent className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 leading-tight whitespace-nowrap">{formatUGX(commissionMinor)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900">Platform commission ({Math.round(PLATFORM_COMMISSION_RATE * 100)}%)</span>
              <span className="text-[11px] font-semibold text-slate-500">All time</span>
            </div>
          </div>
        </div>

        {/* Net to Businesses */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                <Landmark className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 leading-tight whitespace-nowrap">{formatUGX(netMinor)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900">Net to businesses</span>
              <span className="text-[11px] font-semibold text-slate-500">All time</span>
            </div>
          </div>
        </div>

        {/* Refunded */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                <Undo2 className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 leading-tight whitespace-nowrap">{formatUGX(refundedMinor)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900">Refunded</span>
              <span className="text-[11px] font-semibold text-slate-500">All time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pill Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TABS.map((tab) => {
          const isActive = tab.value === "ALL" ? !activeTab || activeTab === "ALL" : activeTab === tab.value;
          const href = tab.value === "ALL" ? (q ? `/admin/payments?q=${q}` : "/admin/payments") : `/admin/payments?status=${tab.value.toLowerCase()}${q ? `&q=${q}` : ''}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[13px] font-bold transition-all",
                isActive 
                  ? "border-[#1e613c] bg-[#1e613c] text-white shadow-sm" 
                  : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <form className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            {activeTab && activeTab !== "ALL" && <input type="hidden" name="status" value={activeTab.toLowerCase()} />}
            <input 
              type="search" 
              name="q" 
              defaultValue={q} 
              placeholder="Search payments..." 
              className="w-full h-9 pl-9 pr-4 rounded-full border border-slate-200 text-[13px] outline-none focus:border-[#1e613c] focus:ring-1 focus:ring-[#1e613c] transition-all bg-white"
            />
          </form>
          <Button variant="outline" className="h-9 px-4 text-[13px] font-bold border-slate-200 text-slate-700 bg-white shadow-sm rounded-full shrink-0">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            Filter
          </Button>
          <Button variant="outline" className="h-9 px-4 text-[13px] font-bold border-slate-200 text-slate-700 bg-white shadow-sm rounded-full shrink-0 hidden lg:inline-flex">
            <Download className="h-4 w-4 mr-2 text-slate-400" />
            Export
          </Button>
          {unsettledNetMinor > 0 && (
            <form action={processAllPayouts}>
              <Button type="submit" className="h-9 px-4 text-[13px] font-bold bg-[#1e613c] hover:bg-[#1e613c]/90 text-white rounded-full shrink-0 shadow-sm transition-all">
                Settle Payouts ({formatUGX(unsettledNetMinor)})
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Transactions Table Container */}
      {pagePayments.length === 0 ? (
        <EmptyState title="No payments yet" description="Payments across the platform will show up here." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-12">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-6 py-3 items-center">
            <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Date</div>
            <div className="col-span-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Item</div>
            <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Business</div>
            <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Method</div>
            <div className="col-span-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
            <div className="col-span-2 text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">Amount</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {pagePayments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="col-span-2 text-[13px] font-semibold text-slate-600 truncate pr-4">
                  {payment.createdAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="col-span-3 text-[13px] font-semibold text-slate-900 truncate pr-4">
                  {payment.booking?.listing.title ?? (payment.order ? `Trip order · ${payment.order.id.slice(-8)}` : "—")}
                </div>
                <div className="col-span-2 text-[13px] font-semibold text-slate-600 truncate pr-4">
                  {payment.booking?.business.name ?? "—"}
                </div>
                <div className="col-span-2 text-[13px] font-semibold text-slate-600 capitalize">
                  {payment.provider.replaceAll("_", " ").toLowerCase()}
                </div>
                <div className="col-span-1">
                  <PaymentStatusBadge status={toPaymentStatus(payment.status)} />
                </div>
                <div className="col-span-2 text-[13px] font-bold text-slate-900 text-right whitespace-nowrap">
                  {formatUGX(payment.amountMinor)}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-slate-200 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">
              Showing {pagePayments.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} transactions
            </span>
            <Pagination currentPage={page} totalPages={totalPagesFor(totalCount)} buildHref={(p) => `/admin/payments?${new URLSearchParams({ ...(activeTab ? { status: activeTab.toLowerCase() } : {}), ...(q ? { q } : {}), page: String(p) }).toString()}`} />
          </div>
        </div>
      )}

      {/* Refunds section just visually separated below */}
      <div className="mt-16">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Refunds</h2>
        {refunds.length === 0 ? (
          <EmptyState title="No refunds yet" description="Refund requests will show up here." />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-6 py-3 items-center">
              <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Date</div>
              <div className="col-span-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Booking</div>
              <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Reason</div>
              <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
              <div className="col-span-1 text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">Amount</div>
              <div className="col-span-2 text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">Action</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-100">
              {refunds.map((refund) => (
                <div key={refund.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="col-span-2 text-[13px] font-semibold text-slate-600 truncate pr-4">
                    {refund.createdAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="col-span-3 text-[13px] font-semibold text-slate-900 truncate pr-4">
                    {refund.booking.listing.title}
                  </div>
                  <div className="col-span-2 text-[13px] font-semibold text-slate-600 truncate pr-4">
                    {refund.reason}
                  </div>
                  <div className="col-span-2">
                    <RefundStatusBadge status={toRefundStatus(refund.status)} />
                  </div>
                  <div className="col-span-1 text-[13px] font-bold text-slate-900 text-right whitespace-nowrap pr-4">
                    {formatUGX(refund.amountMinor)}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    {refund.status === "REQUESTED" ? (
                      <form action={approveRefund}>
                        <input type="hidden" name="refundId" value={refund.id} />
                        <Button type="submit" size="sm" variant="outline" className="text-xs font-semibold h-8 border-[#1e613c] text-[#1e613c] hover:bg-[#E4F2E8]">
                          Approve Refund
                        </Button>
                      </form>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">Processed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
