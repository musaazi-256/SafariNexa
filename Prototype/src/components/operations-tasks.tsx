import Link from "next/link";
import { db } from "@/lib/db";
export async function OperationsTasks({businessId}: {businessId?:string}) {
 const now=new Date(),prefix=businessId?"/business":"/admin";
 const bookings=await db.booking.findMany({where:{...(businessId?{businessId}:{}),OR:[{status:"AWAITING_BUSINESS_CONFIRMATION"},{status:"CONFIRMED",listing:{type:"TRANSPORT"},startDate:{gte:now}}]},include:{listing:{select:{title:true,type:true}}},orderBy:{createdAt:"asc"},take:30});
 const actionable=bookings.filter(b=>b.status==="AWAITING_BUSINESS_CONFIRMATION"||!(b.fulfilment as {driverName?:string}|null)?.driverName);
 const reviews=await db.listingSubmission.findMany({where:{status:{in:businessId?["NEEDS_CHANGES"]:["SUBMITTED","UNDER_REVIEW"]},...(businessId?{listing:{businessId}}:{})},include:{listing:{select:{title:true}}},orderBy:{submittedAt:"asc"},take:10});
 const total=actionable.length+reviews.length;
 return <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
   <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
     <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-warning" aria-hidden="true" /><h2 className="text-base font-semibold">Action centre</h2><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">{total}{bookings.length===30||reviews.length===10?"+":""}</span></div>
     <Link href={`${prefix}/bookings`} className="text-xs font-medium text-primary hover:underline">View bookings →</Link>
   </div>
   <p className="px-5 pb-2 pt-4 text-xs text-muted-foreground">Requests, upcoming transfers and listing reviews. Oldest work first.</p>
   {!total&&<div className="px-5 py-8"><p className="text-sm font-medium">You’re all caught up</p><p className="mt-1 text-sm text-muted-foreground">No pending requests, unassigned upcoming transfers or listing review tasks in this queue.</p></div>}
   <div className="divide-y px-5">{actionable.map(b=><Link href={`${prefix}/bookings/${b.id}`} key={b.id} className="group flex min-w-0 items-center justify-between gap-3 rounded-md py-3 transition-colors hover:bg-muted/50">
     <div className="min-w-0"><p className="break-words text-sm font-medium group-hover:text-primary">{b.listing.title}</p><p className="mt-1 text-xs text-muted-foreground">{b.bookingRef} · {b.status==="CONFIRMED"?"Assign driver and vehicle":b.responseDueAt&&b.responseDueAt<now?"Response window expired":"Booking request"}</p>{b.responseDueAt&&<p className="mt-1 text-xs text-muted-foreground">Due {b.responseDueAt.toLocaleString("en-GB",{timeZone:"Africa/Kampala"})} EAT</p>}</div>
     <span className="shrink-0 rounded-md border px-2 py-1 text-xs font-medium text-primary">{b.status==="CONFIRMED"?"Assign":"Review"}<span className="sr-only"> {b.bookingRef}</span></span>
   </Link>)}{reviews.map(review=><Link className="group flex min-w-0 items-center justify-between gap-3 rounded-md py-3 hover:bg-muted/50" key={review.id} href={businessId?`/business/listings/${review.listingId}/review`:`/admin/listings/${review.id}`}><div className="min-w-0"><p className="break-words text-sm font-medium group-hover:text-primary">{review.listing.title}</p><p className="mt-1 text-xs text-muted-foreground">{review.status.replaceAll("_"," ")} · Listing submission</p></div><span className="shrink-0 text-xs font-medium text-primary">Review</span></Link>)}</div>
   <p className="border-t bg-muted/20 px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">Response windows are demo defaults, not a contractual service guarantee. Queue checks up to 30 bookings and 10 submissions.</p>
 </section>;
}
