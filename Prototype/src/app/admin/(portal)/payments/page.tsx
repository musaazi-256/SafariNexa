import { RecordDateFilter } from "@/components/record-date-filter";
import { recordDateFilter } from "@/lib/record-date-filter";
import { PortalToolbar } from "@/components/portal-toolbar";
import { approveBookingRefund } from "@/lib/payment-management";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { PortalSearch } from "@/components/portal-search";
import { TableColumnLabel } from "@/components/ui/table-column-label";
import { demoPayoutCandidates, settleDemoPayouts } from "@/lib/demo-payouts";
import { isDemoMode } from "@/lib/dev-mode";
import { Banknote, Percent, Landmark, Undo2, Search, Filter, Download } from "lucide-react";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/page-pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RecordFilter } from "@/components/record-filter";
import { PageHero } from "@/components/page-hero";
import { PaymentStatusBadge, RefundStatusBadge } from "@/components/ui/status-badge";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { PLATFORM_COMMISSION_RATE, summarizePayments } from "@/lib/revenue";
import { toPaymentStatus, toRefundStatus } from "@/lib/status";
import { logAuditEvent } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { paymentStatusFilter, stripeAmount } from "@/lib/payment-state";
import { completeRefund } from "@/lib/refund-service";
import { FailedPayoutsNotice } from "@/components/failed-payouts-notice";
import { Prisma } from "@prisma/client";

const TABS = [
  { value: "ALL", label: "All" },
  { value: "SUCCESSFUL", label: "Successful" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" }
];

export default async function AdminPaymentsPage({ searchParams }: { searchParams: { page?: string; q?: string; status?: string; payout?: string; period?: string } }) {
  await requireAdminSession();

  const page = parsePage(searchParams.page);

  const activeTab = searchParams.status?.toUpperCase();
  const q = searchParams.q?.trim();

  const statuses = paymentStatusFilter(activeTab);
  const where: any = { ...recordDateFilter(searchParams.period), ...(statuses ? { status: { in: statuses } } : {}) };
  if (q) {
    where.OR = [
      { booking: { listing: { title: { contains: q, mode: "insensitive" } } } },
      { booking: { business: { name: { contains: q, mode: "insensitive" } } } }
    ];
  }

  const [allPayments, pagePayments, totalCount, refunds, demoCandidates] = await Promise.all([
    db.payment.findMany({ select: { status: true, amountMinor: true, payoutId: true, refunds: { where: { status: "COMPLETED" }, select: { amountMinor: true } } } }),
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
    }),
    isDemoMode() ? demoPayoutCandidates(db) : Promise.resolve([])
  ]);

  const { grossMinor, commissionMinor, netMinor, refundedMinor, unsettledNetMinor } = summarizePayments(allPayments);

  const demoPayoutTotal = demoCandidates.reduce((sum, candidate) => sum + candidate.allocations.reduce((total, allocation) => total + allocation.amountMinor, 0), 0);
  async function simulatePayouts() {
    "use server";
    if (!isDemoMode()) throw new Error("Demo payouts are unavailable in live mode.");
    const actor = await requireAdminSession("payments.manage");
    await db.$transaction(async tx => {
      const payoutIds = await settleDemoPayouts(tx);
      await tx.auditLog.create({ data: { actorUserId: actor.user.id, actorEmail: actor.user.email, surface: "ADMIN", action: "demo_payouts_completed", outcome: "SUCCESS", metadata: { payoutIds } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    redirect("/admin/payments?payout=simulated");
  }

  async function approveRefund(formData: FormData) {
    "use server";
    const adminSession = await requireAdminSession("payments.manage");
    const refundId = String(formData.get("refundId"));

    await approveBookingRefund({surface:"ADMIN",userId:adminSession.user.id,email:adminSession.user.email??undefined},refundId);
    redirect("/admin/payments");
  }



  const failedPayouts = await db.payout.findMany({ where: { status: "FAILED" }, orderBy: { updatedAt: "desc" }, take: 10, select: { id: true, amountMinor: true, notes: true, providerReference: true, updatedAt: true, business: { select: { id: true, name: true } } } });
  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20 font-sans">
      <PageHero
        variant="portal"
        eyebrow="Admin portal"
        title="Payments, refunds & payouts"
        description="Support businesses with payment issues, refunds, reconciliation, and platform payouts."
      />

      {isDemoMode() && <p role="status" className="text-sm text-muted-foreground leading-relaxed">{searchParams.payout === "simulated" ? "Payouts completed." : "Settle eligible payments to verified businesses. Payments with pending refunds remain on hold."}</p>}

      <FailedPayoutsNotice payouts={failedPayouts} surface="ADMIN" />

      {/* Stat Cards */}
      <StatGrid>
        <StatCard label="Gross payments" value={formatUGX(grossMinor)} description="Successful payments before refunds · all time" icon={Banknote} />
        <StatCard label={"Platform commission ("+Math.round(PLATFORM_COMMISSION_RATE*100)+"%)"} value={formatUGX(commissionMinor)} description="After completed refunds · all time" icon={Percent} />
        <StatCard label="Net business earnings" value={formatUGX(netMinor)} description="After completed refunds and commission" icon={Landmark} help="Calculated business share of successful payments, including amounts already settled. This is not a payout-status total." />
        <StatCard label="Completed refunds" value={formatUGX(refundedMinor)} description="Recorded completed refunds · all time" icon={Undo2} />
      </StatGrid>

      {/* Pill Filters */}
      <PortalToolbar tableId="admin-payments" search={<PortalSearch label="Search payments" placeholder="Search payments…" />} filters={<><RecordFilter label="Payment status" name="status" defaultValue="ALL"
        value={!activeTab || activeTab === "ALL" ? "ALL" : activeTab}
        options={TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
        }))}
      />
<RecordDateFilter label="Payment date" /></>} actions={<>{isDemoMode() ? <form action={simulatePayouts}>
            <Button type="submit" disabled={demoPayoutTotal === 0} size="sm">Settle payouts ({formatUGX(demoPayoutTotal)})</Button>
          </form> : unsettledNetMinor > 0 && <p className="text-xs text-muted-foreground">Live payouts require a configured provider.</p>}</>} />


      {/* Transactions Table Container */}
      {pagePayments.length === 0 ? (
        <EmptyState title="No payments yet" description="Payments across the platform will show up here." />
      ) : (
        <div>
          <Table externalTools tableId="admin-payments" aria-label="Payments" density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Business</TableHead>
                <TableHead><TableColumnLabel help="The payment method recorded for the transaction.">Method</TableColumnLabel></TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right"><TableColumnLabel help="The amount recorded for this payment or refund, in Ugandan shillings.">Amount</TableColumnLabel></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagePayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-normal whitespace-nowrap">
                    {payment.createdAt.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell className="font-normal">
                    {payment.booking?.listing.title ?? (payment.order ? `Trip order · ${payment.order.id.slice(-8)}` : "—")}
                  </TableCell>
                  <TableCell className="font-normal">{payment.booking?.business.name ?? "—"}</TableCell>
                  <TableCell className="font-normal capitalize">{payment.provider.replaceAll("_", " ").toLowerCase()}</TableCell>
                  <TableCell><PaymentStatusBadge status={toPaymentStatus(payment.status)} /></TableCell>
                  <TableCell className="text-right font-normal whitespace-nowrap">{formatUGX(payment.amountMinor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="border-t border-border bg-slate-50/30 px-6 py-4 flex flex-wrap gap-3 items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">
              Showing {pagePayments.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} transactions
            </span>
            <Pagination currentPage={page} totalPages={totalPagesFor(totalCount)} buildHref={(p) => `/admin/payments?${new URLSearchParams({ ...(activeTab ? { status: activeTab.toLowerCase() } : {}), ...(q ? { q } : {}), ...(searchParams.period ? {period:searchParams.period} : {}), page: String(p) }).toString()}`} />
          </div>
        </div>
      )}

      {/* Refunds Table Container */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent refunds</h2>
        {refunds.length === 0 ? (
          <EmptyState title="No refunds yet" description="Refund requests will show up here." />
        ) : (
          <div>
            <Table tableId="admin-refunds" aria-label="Refunds" density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"><TableColumnLabel help="The amount recorded for this payment or refund, in Ugandan shillings.">Amount</TableColumnLabel></TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((refund) => (
                  <TableRow key={refund.id}>
                    <TableCell className="font-normal whitespace-nowrap">
                      {refund.createdAt.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="font-normal">{refund.booking.listing.title}</TableCell>
                    <TableCell className="font-normal">{refund.reason}</TableCell>
                    <TableCell><RefundStatusBadge status={toRefundStatus(refund.status)} /></TableCell>
                    <TableCell className="text-right font-normal whitespace-nowrap">{formatUGX(refund.amountMinor)}</TableCell>
                    <TableCell className="text-right">
                      {refund.status === "REQUESTED" ? (
                        <form action={approveRefund}>
                          <input type="hidden" name="refundId" value={refund.id} />
                          <ConfirmSubmit
                            title="Approve this refund?"
                            description={<>{formatUGX(refund.amountMinor)} for <strong>{refund.booking.listing.title}</strong> will be sent back to the traveller through the payment provider. This can&apos;t be undone.</>}
                            confirmLabel="Approve refund"
                            trigger={
                              <Button size="sm" variant="outline" className="text-xs font-normal h-8 border-primary text-primary hover:bg-primary/10">
                                Approve refund
                              </Button>
                            }
                          />
                        </form>
                      ) : (
                        <span className="text-xs font-normal text-slate-500">{refund.status === "COMPLETED" ? "Completed" : refund.status === "PROCESSING" ? "Awaiting provider" : refund.status.replaceAll("_", " ").toLowerCase()}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

    </div>
  );
}
