import Link from "next/link";
import { BookingTravellerSummary } from "@/components/booking-traveller-summary";
import { BookingOperationsSummary } from "@/components/booking-operations-summary";
import {notFound} from "next/navigation";
import {db} from "@/lib/db";
import {requireAdminSession} from "@/lib/admin";
import {formatUGX} from "@/lib/booking";
export default async function BookingAdmin({params}:{params:{id:string}}){
 await requireAdminSession();
 const booking=await db.booking.findUnique({where:{id:params.id},include:{listing:true,business:true,customer:{select:{name:true,email:true}},participants:true,payments:true,order:{include:{payments:true}},refunds:true}});
 if(!booking)notFound();
 const payments=booking.payments.length?booking.payments:booking.order?.payments??[];
 return <div className="mx-auto max-w-4xl space-y-6"><Link href="/admin/bookings" className="underline">Back to bookings</Link><h1 className="text-2xl font-bold break-words">{booking.bookingRef} — {booking.listing.title}</h1><p>Status: {booking.status.replaceAll("_"," ")}</p><p>Customer: {booking.customer.name} · {booking.customer.email}</p><BookingTravellerSummary participants={booking.participants}/><Link className="block underline" href={`/admin/businesses/${booking.businessId}`}>Business: {booking.business.name}</Link><p>Booking amount: {formatUGX(booking.totalMinor)}</p><p>Start: {booking.startDate?.toLocaleString("en-UG")??"Not set"} · End: {booking.endDate?.toLocaleString("en-UG")??"Not applicable"}</p>
 <BookingOperationsSummary booking={booking} business/>
 <section className="space-y-3 rounded-xl border p-4"><h2 className="text-xl font-bold">Payment ledger</h2>{booking.orderId&&<p>Payments below cover combined order {booking.orderId}. This booking’s share is {formatUGX(booking.totalMinor)}.</p>}{payments.map(p=><p key={p.id} className="break-words">{p.status} · {formatUGX(p.amountMinor)} · {p.provider} · {p.providerReference??"No provider reference"}</p>)}{!payments.length&&<p>No recorded payment.</p>}</section>
 <section className="space-y-3 rounded-xl border p-4"><h2 className="text-xl font-bold">Refund requests</h2>{booking.refunds.map(r=><p key={r.id}>{r.status} · {formatUGX(r.amountMinor)} · {r.reason}</p>)}{!booking.refunds.length&&<p>No refund requests.</p>}<Link className="inline-block underline" href="/admin/payments">Manage authorized payment and refund actions</Link></section></div>;
}
