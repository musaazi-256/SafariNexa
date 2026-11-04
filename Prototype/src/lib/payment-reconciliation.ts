import type { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { stripeAmount } from "@/lib/payment-state";
import { syncOrderStatus } from "@/lib/booking-lifecycle";

/** Called only after a signed webhook or a server-to-server provider lookup. */
export async function reconcileCheckout(tx: Prisma.TransactionClient, paymentId: string, checkout: Stripe.Checkout.Session, failed = false) {
  const payment = await tx.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.provider !== "STRIPE" || (payment.providerReference && payment.providerReference !== checkout.id)) throw new Error("Payment reference mismatch.");
  if (!["PROCESSING", "PENDING_PROVIDER_CONFIRMATION"].includes(payment.status)) return;
  if (checkout.amount_total !== stripeAmount(payment.amountMinor,payment.currency) || checkout.currency?.toUpperCase() !== payment.currency) throw new Error("Payment amount mismatch.");
  const target = payment.orderId ? { orderId: payment.orderId } : { id: payment.bookingId! };
  if (failed) {
    await tx.payment.update({ where: { id: payment.id }, data: { status: checkout.status === "expired" ? "CANCELLED" : "FAILED", providerReference: checkout.id, failureReason: checkout.status === "expired" ? "Payment session expired" : "Provider could not complete payment" } });
    const bookings = await tx.booking.findMany({ where: { ...target, status: { in: ["PENDING_PAYMENT","PAYMENT_FAILED"] } } });
    for (const booking of bookings) {
      await tx.booking.update({where:{id:booking.id},data:{status:"PAYMENT_FAILED"}});
      const members = await tx.businessUser.findMany({where:{businessId:booking.businessId},select:{userId:true}});
      await tx.notification.createMany({data:[...new Set([booking.customerId,...members.map(m=>m.userId)])].map(userId=>({userId,type:"PAYMENT_UPDATE" as const,title:"Payment not completed",body:`Payment for ${booking.bookingRef} did not complete. The customer can retry within the payment window.`,relatedBookingId:booking.id}))});
    }
    await syncOrderStatus(tx,payment.orderId);
    return;
  }
  if (checkout.payment_status !== "paid") return;
  const bookings = await tx.booking.findMany({where:{...target,totalMinor:{gt:0},status:{notIn:["CANCELLED_BY_CUSTOMER","CANCELLED_BY_BUSINESS","CANCELLED_BY_ADMIN"]}}});
  if (!bookings.length || bookings.reduce((sum,b)=>sum+b.totalMinor,0)!==payment.amountMinor || bookings.some(b=>!["PENDING_PAYMENT","PAYMENT_FAILED"].includes(b.status))) throw new Error("Booking requires payment reconciliation.");
  await tx.payment.update({where:{id:payment.id},data:{status:"SUCCESSFUL",completedAt:new Date(),providerReference:checkout.id}});
  for (const booking of bookings) {
    const status = !booking.bookingMode || booking.bookingMode === "LEGACY" ? "AWAITING_BUSINESS_CONFIRMATION" : "CONFIRMED";
    await tx.booking.update({where:{id:booking.id},data:{status,paymentDueAt:null,...(status==="CONFIRMED"?{confirmedAt:new Date()}: {})}});
    const members=await tx.businessUser.findMany({where:{businessId:booking.businessId},select:{userId:true}});
    await tx.notification.createMany({data:[...new Set([booking.customerId,...members.map(m=>m.userId)])].map(userId=>({userId,type:"PAYMENT_UPDATE" as const,title:status==="CONFIRMED"?"Payment received — booking confirmed":"Payment received — booking requested",body:`Booking ${booking.bookingRef}: ${status==="CONFIRMED"?"confirmed":"awaiting business confirmation"}.`,relatedBookingId:booking.id}))});
  }
  await syncOrderStatus(tx,payment.orderId);
}
