import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { PortalSearch } from "@/components/portal-search";
import { PaymentStatusBadge } from "@/components/ui/status-badge";
import { toPaymentStatus } from "@/lib/status";
import { TableColumnLabel } from "@/components/ui/table-column-label";
import { TableActionLink } from "@/components/ui/table-action-link";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { PLATFORM_COMMISSION_RATE, summarizePayments } from "@/lib/revenue";
import { Button } from "@/components/ui/button";
import { Banknote, Percent, Undo2, Calendar, Download, Info, MoreVertical, Search, Filter, CreditCard, Smartphone } from "lucide-react";
import { RevenueOverviewChart, PayoutBreakdownChart } from "@/components/business/revenue-charts";
import { cn } from "@/lib/utils";

import Link from "next/link";
import { RemoteImage } from "@/components/remote-image";
import { ExportVisibleRows, PortalFilter } from "@/components/portal-tools";
export default async function RevenuePage({searchParams}:{searchParams:{q?:string;page?:string}}) {
 const {businessId}=await requireBusinessSession();
 if(!businessId)return <p>No business linked.</p>;
 const q=searchParams.q?.trim(),page=parsePage(searchParams.page);
 const bookings=await db.booking.findMany({where:{businessId,...(q?{OR:[{bookingRef:{contains:q,mode:"insensitive" as const}},{listing:{title:{contains:q,mode:"insensitive" as const}}}]}:{})},include:{listing:true,payments:{include:{refunds:true},orderBy:{createdAt:"desc"}},order:{include:{payments:{include:{refunds:true},orderBy:{createdAt:"desc"}}}}},orderBy:{createdAt:"desc"}});
 const rows=bookings.map(booking=>{
   const payments=booking.payments.length?booking.payments:booking.order?.payments??[];
   const payment=payments.find(p=>["SUCCESSFUL","REFUNDED","PARTIALLY_REFUNDED"].includes(p.status))??payments[0];
   const refunds=payment?.refunds.filter(r=>r.bookingId===booking.id&&r.status==="COMPLETED")??[];
   const refundTotal=refunds.reduce((sum,r)=>sum+r.amountMinor,0);
   // An order's partial refund does not imply every child booking was refunded.
   const status=payment?.status==="PARTIALLY_REFUNDED"||payment?.status==="REFUNDED"?(refundTotal>=booking.totalMinor?"REFUNDED":refundTotal>0?"PARTIALLY_REFUNDED":"SUCCESSFUL"):payment?.status??"NOT_STARTED";
   return {booking,payment,status,refunds};
 });
 const totals=summarizePayments(rows.map(r=>({status:r.status,amountMinor:r.booking.totalMinor,refunds:r.refunds,payoutId:r.payment?.payoutId})));
 const daily=new Map<string,{date:string;gross:number;net:number}>();
 for(const row of rows.filter(r=>["SUCCESSFUL","PARTIALLY_REFUNDED","REFUNDED"].includes(r.status))){
   const date=(row.payment?.completedAt??row.payment?.createdAt??row.booking.createdAt).toISOString().slice(0,10);
   const refund=row.refunds.reduce((s,r)=>s+r.amountMinor,0);
   const entry=daily.get(date)??{date,gross:0,net:0};entry.gross+=row.booking.totalMinor;entry.net+=Math.round((row.booking.totalMinor-refund)*(1-PLATFORM_COMMISSION_RATE));daily.set(date,entry);
 }
 const {grossMinor,commissionMinor,netMinor,refundedMinor}=totals;
 const totalCount=rows.length,pageBookings=rows.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).map(r=>r.booking);
 const resolveLatestPayment=(booking:typeof pageBookings[number])=>{const row=rows.find(r=>r.booking.id===booking.id);return row?.payment ? {...row.payment,status:row.status}:null;};
 const payouts=await db.payout.findMany({where:{businessId},select:{status:true,amountMinor:true}});
 const paidMinor=payouts.filter(p=>p.status === "COMPLETED").reduce((s,p)=>s+p.amountMinor,0);
 const processingMinor=payouts.filter(p=>p.status === "PROCESSING").reduce((s,p)=>s+p.amountMinor,0);
 const heldMinor=Math.max(0,netMinor-paidMinor-processingMinor);
  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <PageHero
          variant="portal"
          eyebrow="Business portal"
          title="Revenue & payouts"
          description="Track paid bookings, commission, and net payout."
        />

        <div className="flex flex-wrap items-center gap-3">
          <span className="h-10 inline-flex items-center rounded-full border border-border px-4 text-sm font-medium text-slate-700"><Calendar className="mr-2 h-4 w-4 text-slate-400"/>All dates</span>
          <ExportVisibleRows />
        </div>
      </div>

      {/* Stat Cards */}
      <StatGrid>
        <StatCard label="Gross payments" value={formatUGX(grossMinor)} description="Successful payments before refunds" icon={Banknote} help="Recorded successful payments for these bookings, including amounts later refunded. Follows the current search and covers all dates." />
        <StatCard label={"Platform commission ("+Math.round(PLATFORM_COMMISSION_RATE*100)+"%)"} value={formatUGX(commissionMinor)} description="Calculated after completed refunds" icon={Percent} help="Commission on retained payment value after completed refunds. Follows the current search." />
        <StatCard label="Net business earnings" value={formatUGX(netMinor)} description="After completed refunds and commission" icon={CreditCard} help="Calculated business share of successful payments. This is not the amount already paid out. Payout status is shown in the breakdown below." />
        <StatCard label="Completed refunds" value={formatUGX(refundedMinor)} description="Refund amounts recorded as completed" icon={Undo2} help="Completed refunds allocated to these bookings. Pending and rejected requests are excluded." />
      </StatGrid>

      {/* Middle Section: Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Overview */}
        <Card className="lg:col-span-2 rounded-2xl border-border shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Revenue overview</h2>
              <select className="form-control font-medium text-slate-700 outline-none">
                <option>Daily</option>
              </select>
            </div>

            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#16a34a]"></div>
                <span className="text-xs font-medium text-slate-500">Gross revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-[2px] w-3 border-t-[2px] border-dashed border-[#22c55e]"></div>
                <span className="text-xs font-medium text-slate-500">Net payout</span>
              </div>
            </div>

            <RevenueOverviewChart data={[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date))} />
          </CardContent>
        </Card>

        {/* Payout Breakdown */}
        <Card className="rounded-2xl border-border shadow-card">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-semibold text-slate-900">Payout breakdown</h2>
              <Info className="h-3.5 w-3.5 text-slate-300" />
            </div>

            <PayoutBreakdownChart netMinor={netMinor} paidMinor={paidMinor} processingMinor={processingMinor} heldMinor={heldMinor} />

            <div className="mt-auto space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#16a34a]"></div>
                  <span className="text-xs font-medium text-slate-700">Paid to you</span>
                </div>
                <span className="text-xs font-medium text-slate-900">{formatUGX(paidMinor)} <span className="text-slate-500 font-medium"></span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ade80]"></div>
                  <span className="text-xs font-medium text-slate-700">Processing</span>
                </div>
                <span className="text-xs font-medium text-slate-900">{formatUGX(processingMinor)} <span className="text-slate-500 font-medium"></span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#fde047]"></div>
                  <span className="text-xs font-medium text-slate-700">On hold</span>
                </div>
                <span className="text-xs font-medium text-slate-900">{formatUGX(heldMinor)} <span className="text-slate-500 font-medium"></span></span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-900">Total</span>
                <span className="text-sm font-semibold text-slate-900">{formatUGX(netMinor)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <FilterTabs
          activeValue="ALL"
          tabs={[{ value: "ALL", label: "All transactions", count: totalCount, href: "/business/revenue" }]}
        />

        <div className="flex items-center gap-3">
          <PortalFilter />
          <PortalSearch label="Search transactions" placeholder="Search transactions…" />
        </div>
      </div>

      {/* Data Table */}
      {pageBookings.length === 0 ? (
        <EmptyState title="No transactions yet" description="Paid bookings will show up here." />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right"><TableColumnLabel help="The booking amount before platform commission.">Gross amount</TableColumnLabel></TableHead>
                <TableHead className="text-right"><TableColumnLabel help="The platform commission calculated from the booking amount.">Commission (12%)</TableColumnLabel></TableHead>
                <TableHead className="text-right"><TableColumnLabel help="The amount payable to your business after platform commission.">Net payout</TableColumnLabel></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageBookings.map((booking) => {
                const payment = resolveLatestPayment(booking);
                const isSuccessful = !!payment && ["SUCCESSFUL","PARTIALLY_REFUNDED","REFUNDED"].includes(payment.status);
                const refunded = rows.find(r=>r.booking.id === booking.id)?.refunds.reduce((s,r)=>s+r.amountMinor,0) ?? 0;
                const commission = Math.round((booking.totalMinor-refunded) * PLATFORM_COMMISSION_RATE);
                const net = isSuccessful ? booking.totalMinor - refunded - commission : 0;

                // Display the recorded payment provider.
                let ProviderIcon = CreditCard;
                let providerName = "Card";
                if (payment?.provider === "MTN_MOBILE_MONEY") {
                  ProviderIcon = Smartphone;
                  providerName = "MTN Mobile Money";
                } else if (payment?.provider === "AIRTEL_MONEY") {
                  ProviderIcon = Smartphone;
                  providerName = "Airtel Money";
                }


                return (
                  <TableRow key={booking.id} className="group">
                    <TableCell className="font-normal whitespace-nowrap">
                      {booking.createdAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-border">
                          {booking.listing.coverImageUrl ? (
                            <RemoteImage alt={booking.listing.title} src={booking.listing.coverImageUrl} className="h-full w-full object-cover" />
                          ) : <div className="h-full w-full bg-slate-100" />}
                        </div>
                        <div className="flex flex-col max-w-[200px]">
                          <span className="text-sm font-normal text-slate-700 truncate">{booking.listing.title}</span>
                          <span className="text-xs font-normal text-slate-500 truncate">{booking.bookingRef}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {payment ? (
                        <div className="flex items-center gap-2">
                          <ProviderIcon className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-normal text-slate-700">{providerName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <PaymentStatusBadge status={toPaymentStatus(payment?.status ?? "NOT_STARTED")} />
                    </TableCell>

                    <TableCell className="text-right font-normal whitespace-nowrap">
                      {formatUGX(booking.totalMinor)}
                    </TableCell>

                    <TableCell className="text-right font-normal whitespace-nowrap">
                      {isSuccessful ? formatUGX(commission) : "—"}
                    </TableCell>

                    <TableCell className="text-right font-normal whitespace-nowrap">
                      {isSuccessful ? formatUGX(net) : "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      <TableActionLink href={`/business/bookings/${booking.id}`} description={`View booking ${booking.bookingRef}`} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} transactions
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-slate-500">{PAGE_SIZE} per page</span>
              <Pagination currentPage={page} totalPages={totalPagesFor(totalCount)} buildHref={(p) => `/business/revenue?${new URLSearchParams({page:String(p),...(q?{q}:{})})}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
