import Link from "next/link";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { formatUGX } from "@/lib/booking";
import { PLATFORM_COMMISSION_RATE, summarizePayments } from "@/lib/revenue";
import { PageHero } from "@/components/page-hero";
import { ExportVisibleRows, PortalFilter } from "@/components/portal-tools";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RevenueOverviewChart } from "@/components/business/revenue-charts";
import { Pagination } from "@/components/ui/pagination";
import { parsePage, PAGE_SIZE, totalPagesFor } from "@/lib/pagination";

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
 const totals=summarizePayments(rows.map(r=>({status:r.status,amountMinor:r.booking.totalMinor,refunds:r.refunds})));
 const daily=new Map<string,{date:string;gross:number;net:number}>();
 for(const row of rows.filter(r=>["SUCCESSFUL","PARTIALLY_REFUNDED","REFUNDED"].includes(r.status))){
   const date=(row.payment?.completedAt??row.payment?.createdAt??row.booking.createdAt).toISOString().slice(0,10);
   const refund=row.refunds.reduce((s,r)=>s+r.amountMinor,0);
   const entry=daily.get(date)??{date,gross:0,net:0};entry.gross+=row.booking.totalMinor;entry.net+=Math.round((row.booking.totalMinor-refund)*(1-PLATFORM_COMMISSION_RATE));daily.set(date,entry);
 }
 return <div className="mx-auto max-w-7xl space-y-6"><PageHero variant="portal" title="Earnings" description="Booking-level payment allocations, including combined orders. These are ledger records, not proof of bank settlement."/>
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Collected",totals.grossMinor],["Refunded",totals.refundedMinor],["Estimated commission",totals.commissionMinor],["Estimated net earnings",totals.netMinor]].map(([label,value])=><div key={String(label)} className="min-w-0 rounded-2xl border bg-white p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 break-words text-2xl font-bold">{formatUGX(Number(value))}</p></div>)}</div>
 <section className="min-w-0 rounded-2xl border bg-white p-4"><h2 className="text-xl font-bold">Recorded payment history — all dates</h2><RevenueOverviewChart data={[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date))}/></section>
 <p className="text-sm text-muted-foreground">Net earnings assume a {PLATFORM_COMMISSION_RATE*100}% commission. Payout transfer integration is not configured; no amount here is labelled as transferred to your bank.</p>
 <div className="flex flex-wrap gap-3"><PortalFilter/><ExportVisibleRows/></div>
 <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Booking</TableHead><TableHead>Payment</TableHead><TableHead>Booking share</TableHead><TableHead>Refunded share</TableHead></TableRow></TableHeader><TableBody>{rows.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).map(r=><TableRow key={r.booking.id}><TableCell>{r.booking.createdAt.toLocaleDateString("en-UG")}</TableCell><TableCell><Link href={`/business/bookings/${r.booking.id}`} className="underline">{r.booking.listing.title} · {r.booking.bookingRef}</Link></TableCell><TableCell>{r.status.replaceAll("_"," ")}</TableCell><TableCell>{formatUGX(r.booking.totalMinor)}</TableCell><TableCell>{formatUGX(r.refunds.reduce((s,x)=>s+x.amountMinor,0))}</TableCell></TableRow>)}</TableBody></Table>
 {!rows.length&&<p>No matching booking payments.</p>}<Pagination currentPage={page} totalPages={totalPagesFor(rows.length)} buildHref={p=>`/business/revenue?${new URLSearchParams({page:String(p),...(q?{q}:{})})}`}/></div>;
}
