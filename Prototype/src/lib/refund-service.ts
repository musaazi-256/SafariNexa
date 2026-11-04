import type { Prisma } from "@prisma/client";
import { releaseAvailabilityForBooking } from "@/lib/booking-service";
import { syncOrderStatus } from "@/lib/booking-lifecycle";
export async function completeRefund(tx: Prisma.TransactionClient, refundId:string) {
 const refund=await tx.refund.findUnique({where:{id:refundId},include:{payment:true}});
 if(!refund||!["REQUESTED","PROCESSING"].includes(refund.status))return;
 const claimed=await tx.refund.updateMany({where:{id:refundId,status:{in:["REQUESTED","PROCESSING"]}},data:{status:"COMPLETED"}});
 if(!claimed.count)return;
 const total=await tx.refund.aggregate({where:{paymentId:refund.paymentId,status:"COMPLETED"},_sum:{amountMinor:true}});
 const refunded=total._sum.amountMinor??0;
 if(refunded>refund.payment.amountMinor)throw new Error("Refund allocation exceeds payment.");
 await tx.payment.update({where:{id:refund.paymentId},data:{status:refunded>=refund.payment.amountMinor?"REFUNDED":"PARTIALLY_REFUNDED"}});
 const booking=await tx.booking.findUniqueOrThrow({where:{id:refund.bookingId}});
 const allocated=await tx.refund.aggregate({where:{bookingId:refund.bookingId,status:"COMPLETED"},_sum:{amountMinor:true}});
 if((allocated._sum.amountMinor??0)>=booking.totalMinor&&booking.status!=="REFUNDED"){
   await tx.booking.update({where:{id:booking.id},data:{status:"REFUNDED"}});
   await releaseAvailabilityForBooking(tx,booking.id);
   await syncOrderStatus(tx,booking.orderId);
 }
 if(booking.cancelledAt)await finishCancelledRefund(tx,booking.id);
 await tx.notification.create({data:{userId:booking.customerId,type:"PAYMENT_UPDATE",title:refund.payment.providerReference?.startsWith("DEMO-") ? "Refund completed" : "Refund confirmed by provider",body:refund.payment.providerReference?.startsWith("DEMO-") ? `Refund completed for ${booking.bookingRef}.` :`A refund of UGX ${refund.amountMinor.toLocaleString("en-UG")} for ${booking.bookingRef} has been confirmed by the payment provider.`,relatedBookingId:booking.id}});
 const members=await tx.businessUser.findMany({where:{businessId:booking.businessId},select:{userId:true}});
 const recipients=[...new Set(members.map(member=>member.userId))].filter(userId=>userId!==booking.customerId);
 if(recipients.length)await tx.notification.createMany({data:recipients.map(userId=>({userId,type:"PAYMENT_UPDATE" as const,title:"Booking refund completed",body:`A refund of ${refund.payment.currency} ${refund.amountMinor.toLocaleString("en-UG")} was recorded for booking ${booking.bookingRef}.`,relatedBookingId:booking.id}))});

}

/** A declined or partially completed refund must not leave a cancelled booking
 * labelled "refund requested" after its last pending request has been handled. */
export async function finishCancelledRefund(tx: Prisma.TransactionClient, bookingId: string) {
 const booking=await tx.booking.findUniqueOrThrow({where:{id:bookingId}});
 if(!booking.cancelledAt || !["REFUND_REQUESTED","REFUND_PROCESSING"].includes(booking.status))return;
 if(await tx.refund.count({where:{bookingId,status:{in:["REQUESTED","PROCESSING"]}}}))return;
 const reason=booking.cancelReason?.toLowerCase()??"";
 const status=reason.includes("customer")?"CANCELLED_BY_CUSTOMER":reason.includes("admin")?"CANCELLED_BY_ADMIN":"CANCELLED_BY_BUSINESS";
 await tx.booking.update({where:{id:bookingId},data:{status}});
 await releaseAvailabilityForBooking(tx,bookingId);
 await syncOrderStatus(tx,booking.orderId);
}
