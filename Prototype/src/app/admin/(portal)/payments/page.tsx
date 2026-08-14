import Link from "next/link";
import { Banknote, Percent, Landmark, Undo2, ArrowRight } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PaymentStatusBadge, RefundStatusBadge } from "@/components/ui/status-badge";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { PLATFORM_COMMISSION_RATE, summarizePayments } from "@/lib/revenue";
import { toPaymentStatus, toRefundStatus } from "@/lib/status";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: { page?: string } }) {
  await requireAdminSession();

  const page = parsePage(searchParams.page);

  const [allPayments, pagePayments, totalCount, refunds] = await Promise.all([
    db.payment.findMany({ select: { status: true, amountMinor: true } }),
    db.payment.findMany({
      include: { booking: { include: { listing: true, business: true } }, order: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.payment.count(),
    db.refund.findMany({
      include: { booking: { include: { listing: true } } },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  const { grossMinor, commissionMinor, netMinor, refundedMinor } = summarizePayments(allPayments);

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

      {/* Tabs / Content Area */}
      <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
        <div className="pb-3 border-b-2 border-[#1e613c] text-[14px] font-bold text-[#1e613c]">
          Transactions
        </div>
        <div className="pb-3 text-[14px] font-bold text-slate-400">
          Refunds
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
            <Pagination currentPage={page} totalPages={totalPagesFor(totalCount)} buildHref={(p) => `/admin/payments?page=${p}`} />
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
              <div className="col-span-4 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Reason</div>
              <div className="col-span-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
              <div className="col-span-2 text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">Amount</div>
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
                  <div className="col-span-4 text-[13px] font-semibold text-slate-600 truncate pr-4">
                    {refund.reason}
                  </div>
                  <div className="col-span-1">
                    <RefundStatusBadge status={toRefundStatus(refund.status)} />
                  </div>
                  <div className="col-span-2 text-[13px] font-bold text-slate-900 text-right whitespace-nowrap">
                    {formatUGX(refund.amountMinor)}
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
