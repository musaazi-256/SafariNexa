import { timingSafeEqual } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { releaseAvailabilityForBooking } from "@/lib/booking-service";
import { syncOrderStatus } from "@/lib/booking-lifecycle";
export const dynamic="force-dynamic";
export async function POST(req:Request) {
 const secret=process.env.CRON_SECRET;
 if(!secret)return new Response("Job not configured",{status:503});
 const expected=Buffer.from(`Bearer ${secret}`),received=Buffer.from(req.headers.get("authorization")??"");
 if(received.length!==expected.length||!timingSafeEqual(received,expected))return new Response("Unauthorized",{status:401});
 const cutoff=new Date(Date.now()-60*60*1000);
 const attempts=await db.payment.findMany({where:{status:{in:["PROCESSING","PENDING_PROVIDER_CONFIRMATION"]},createdAt:{lt:cutoff}},take:20});
 for(const attempt of attempts){
   if(attempt.provider!=="STRIPE"||!attempt.providerReference?.startsWith("cs_")||!process.env.STRIPE_SECRET_KEY)continue;
   const checkout=await stripe.checkout.sessions.retrieve(attempt.providerReference);
   if(checkout.payment_status==="paid")continue; // Reconcile through the signed webhook, never infer failure.
   if(checkout.status==="open")await stripe.checkout.sessions.expire(checkout.id,{},{idempotencyKey:`expire:${attempt.id}`});
   if(checkout.status==="expired"||checkout.status==="open")await db.payment.updateMany({where:{id:attempt.id,status:{in:["PROCESSING","PENDING_PROVIDER_CONFIRMATION"]}},data:{status:"CANCELLED"}});
 }
 const candidates=await db.booking.findMany({where:{OR:[{status:{in:["PENDING_PAYMENT","PAYMENT_FAILED"]},OR:[{paymentDueAt:{lt:new Date()}},{paymentDueAt:null,createdAt:{lt:cutoff}}]},{status:"AWAITING_BUSINESS_CONFIRMATION",bookingMode:{in:["REQUEST","RESERVATION"]},responseDueAt:{lt:new Date()}}]},take:50});
 let expired=0;
 for(const candidate of candidates)await db.$transaction(async tx=>{
   const payment=await tx.payment.findFirst({where:{OR:[{bookingId:candidate.id},...(candidate.orderId?[{orderId:candidate.orderId}]:[])],status:{in:["PROCESSING","PENDING_PROVIDER_CONFIRMATION","SUCCESSFUL","PARTIALLY_REFUNDED"]}}});
   if(payment)return;
   const updated=await tx.booking.updateMany({where:{id:candidate.id,status:candidate.status,responseDueAt:candidate.responseDueAt,paymentDueAt:candidate.paymentDueAt},data:{status:"CANCELLED_BY_ADMIN",cancelledAt:new Date(),cancelReason:candidate.status === "AWAITING_BUSINESS_CONFIRMATION" ? "Business response deadline expired" : "Payment window expired"}});
   if(!updated.count)return;
   await releaseAvailabilityForBooking(tx,candidate.id);await syncOrderStatus(tx,candidate.orderId);
   await tx.notification.create({data:{userId:candidate.customerId,type:"BOOKING_UPDATE",title:"Unpaid reservation expired",body:`Booking ${candidate.bookingRef} expired. No payment was confirmed. You can check availability and book again.`,relatedBookingId:candidate.id}});
   expired++;
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 return Response.json({expired});
}
