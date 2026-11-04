import { RecordDateFilter } from "@/components/record-date-filter";
import { recordDateFilter } from "@/lib/record-date-filter";
import { PortalToolbar } from "@/components/portal-toolbar";
import Link from "next/link";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { bookingPaymentSummary } from "@/lib/booking-payment-summary";
import { formatUGX } from "@/lib/booking";
import { toPaymentStatus } from "@/lib/status";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { PageHero } from "@/components/page-hero";
import { PortalSearch } from "@/components/portal-search";
import { RecordFilter } from "@/components/record-filter";
import { PaymentStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Pagination } from "@/components/page-pagination";

import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";

const filters=[{value:"ALL",label:"All bookings"},{value:"PAID",label:"Paid"},{value:"UNPAID",label:"Unpaid / no payment"},{value:"PROCESSING",label:"Processing"},{value:"FAILED",label:"Payment failed"},{value:"REFUNDS",label:"Refund activity"},{value:"NOT_REQUIRED",label:"No payment required"}];
export default async function BusinessPaymentsPage({searchParams}:{searchParams:{status?:string;q?:string;page?:string;period?:string}}) {
  const {businessId}=await requireBusinessSession();if(!businessId)return <EmptyState title="No business linked"/>;
  const q=searchParams.q?.trim();const requested=searchParams.status?.toUpperCase();const active=filters.some(f=>f.value===requested)?requested!:"ALL";const page=parsePage(searchParams.page);
  const bookings=await db.booking.findMany({where:{businessId,...recordDateFilter(searchParams.period),...(q?{OR:[{bookingRef:{contains:q,mode:"insensitive" as const}},{listing:{title:{contains:q,mode:"insensitive" as const}}},{customer:{name:{contains:q,mode:"insensitive" as const}}},{customer:{email:{contains:q,mode:"insensitive" as const}}}]}:{})},include:{listing:{select:{title:true}},customer:{select:{name:true,email:true}},payments:{include:{refunds:true}},order:{include:{payments:{include:{refunds:true}}}}},orderBy:{createdAt:"desc"}});
  const rows=bookings.map(booking=>({booking,summary:bookingPaymentSummary(booking)}));const visible=rows.filter(row=>active==="ALL"||row.summary.category===active);
  const totals=rows.reduce((sum,row)=>({paid:sum.paid+row.summary.paidMinor,outstanding:sum.outstanding+row.summary.outstandingMinor,refunded:sum.refunded+row.summary.refundedMinor,held:sum.held+row.summary.heldMinor}),{paid:0,outstanding:0,refunded:0,held:0});
  return <div className="mx-auto max-w-[1400px] space-y-6"><div className="flex flex-wrap items-end justify-between gap-3"><PageHero variant="portal" title="Payments & refunds" description="Review who has paid, follow up on unpaid bookings, and manage refunds."/><Link className="text-sm underline" href="/business/revenue">Earnings & payouts</Link></div>
    <StatGrid><StatCard label="Payments received" value={formatUGX(totals.paid)} description="Before completed refunds · current search"/><StatCard label="Outstanding" value={formatUGX(totals.outstanding)} description="Payment due on accepted or confirmed bookings"/><StatCard label="Refunds completed" value={formatUGX(totals.refunded)} description="Confirmed refunds for these bookings"/><StatCard label="Refunds pending" value={formatUGX(totals.held)} description="Requested or awaiting provider confirmation"/></StatGrid>
    <PortalToolbar tableId="business-payments" search={<PortalSearch label="Search payments" placeholder="Reference, listing or customer…"/>} filters={<><RecordFilter label="Payment status" name="status" value={active} options={filters.map(f=>({...f,count:rows.filter(row=>f.value==="ALL"||row.summary.category===f.value).length}))}/>
<RecordDateFilter label="Booking created" /></>} />

    {!visible.length?<EmptyState title="No matching payments" description="Try another status or clear your search."/>:<><Table externalTools tableId="business-payments" aria-label="Booking payments" density="compact"><TableHeader><TableRow>
            <TableHead>Booking reference</TableHead>
            <TableHead>Listing</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Customer email</TableHead>
            <TableHead>Payment status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
            <TableHead className="text-right">Refunded</TableHead>
            <TableHead className="text-right">Refund pending</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow></TableHeader><TableBody>{visible.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).map(({booking,summary})=><TableRow key={booking.id}>
              <TableCell><Link href={`/business/bookings/${booking.id}`}>{booking.bookingRef}</Link></TableCell>
              <TableCell>{booking.listing.title}</TableCell>
              <TableCell>{booking.customer.name ?? "Guest"}</TableCell>
              <TableCell>{booking.customer.email}</TableCell>
              <TableCell>{booking.totalMinor === 0 ? <span className="text-xs text-muted-foreground">No payment required</span> : <PaymentStatusBadge status={toPaymentStatus(summary.status)} />}</TableCell>
              <TableCell>{summary.payment?.provider.replaceAll("_", " ") ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{formatUGX(summary.paidMinor)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatUGX(summary.outstandingMinor)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatUGX(summary.refundedMinor)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatUGX(summary.heldMinor)}</TableCell>
              <TableCell><Link href={`/business/bookings/${booking.id}#payments`}>Manage payment</Link></TableCell>
            </TableRow>)}</TableBody></Table><p className="text-xs text-muted-foreground">{visible.length} matching bookings. Combined payments are allocated to this business’s bookings.</p><Pagination currentPage={page} totalPages={totalPagesFor(visible.length)} buildHref={p=>`/business/payments?${new URLSearchParams({...(active!=="ALL"?{status:active.toLowerCase()}:{}),...(q?{q}:{}),...(searchParams.period?{period:searchParams.period}:{}),page:String(p)})}`}/></>}
  </div>;
}
