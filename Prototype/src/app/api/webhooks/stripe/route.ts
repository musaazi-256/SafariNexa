import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";
import { stripeAmount } from "@/lib/payment-state";
import { completeRefund } from "@/lib/refund-service";

export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) return new NextResponse("Payments unavailable", { status: 503 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("Stripe-Signature") || "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch { return new NextResponse("Invalid webhook signature", { status: 400 }); }
  if (event.type === "refund.updated" || event.type === "refund.created") {
    const refund = event.data.object as Stripe.Refund;
    const refundId = refund.metadata?.refundId;
    if (!refundId) return new NextResponse(null, { status: 200 });
    try {
      await db.$transaction(async tx => {
        const record = await tx.refund.findUnique({where:{id:refundId},include:{payment:true}});
        if (!record || refund.amount !== stripeAmount(record.amountMinor, record.payment.currency) || refund.currency.toUpperCase() !== record.payment.currency) throw new Error("Refund mismatch");
        if (refund.status === "succeeded") await completeRefund(tx, refundId);
        else if (refund.status === "failed" || refund.status === "canceled") await tx.refund.updateMany({where:{id:refundId,status:{in:["REQUESTED","PROCESSING"]}},data:{status:"REJECTED"}});
      }, {isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
      return new NextResponse(null,{status:200});
    } catch { return new NextResponse("Refund reconciliation failed",{status:500}); }
  }
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type)) return new NextResponse(null, { status: 200 });
  const checkout = event.data.object as Stripe.Checkout.Session;
  const paymentId = checkout.metadata?.paymentId;
  if (!paymentId) return new NextResponse("Missing payment reference", { status: 400 });
  try {
    await db.$transaction(async tx => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!payment || payment.provider !== "STRIPE" || (payment.providerReference && payment.providerReference !== checkout.id)) throw new Error("Payment reference mismatch");
      // Terminal state prevents replay from re-confirming a cancelled booking.
      if (!["PROCESSING", "PENDING_PROVIDER_CONFIRMATION"].includes(payment.status)) return;
      if (checkout.amount_total !== stripeAmount(payment.amountMinor, payment.currency) || checkout.currency?.toUpperCase() !== payment.currency) throw new Error("Payment amount mismatch");
      if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
        await tx.payment.update({ where: { id: payment.id }, data: { status: event.type === "checkout.session.expired" ? "CANCELLED" : "FAILED", providerReference: checkout.id } });
        return;
      }
      if (checkout.payment_status !== "paid") return;
      const bookings = await tx.booking.findMany({ where: payment.orderId ? { orderId: payment.orderId, totalMinor:{gt:0}, status: {notIn:["CANCELLED_BY_CUSTOMER","CANCELLED_BY_BUSINESS","CANCELLED_BY_ADMIN"]} } : { id: payment.bookingId! } });
      if (bookings.reduce((sum,b)=>sum+b.totalMinor,0)!==payment.amountMinor) throw new Error("Payment allocation mismatch");
      if (!bookings.length || bookings.some(b => !["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(b.status))) throw new Error("Booking requires payment reconciliation");
      await tx.payment.update({ where: { id: payment.id }, data: { status: "SUCCESSFUL", completedAt: new Date(), providerReference: checkout.id } });
      if (payment.orderId) await tx.order.update({ where: { id: payment.orderId }, data: { status: bookings.some(b=>!b.bookingMode || b.bookingMode === "LEGACY") ? "AWAITING_BUSINESS_CONFIRMATION" : "CONFIRMED" } });
      for (const booking of bookings) {
        const status = !booking.bookingMode || booking.bookingMode === "LEGACY" ? "AWAITING_BUSINESS_CONFIRMATION" : "CONFIRMED";
        await tx.booking.update({ where: { id: booking.id }, data: { status, paymentDueAt:null, ...(status==="CONFIRMED" ? {confirmedAt:new Date()}: {}) } });
        const members = await tx.businessUser.findMany({ where: { businessId: booking.businessId }, select: { userId: true } });
        await tx.notification.createMany({ data: [...new Set([booking.customerId, ...members.map(m => m.userId)])].map(userId => ({
          userId, type: "BOOKING_UPDATE" as const, title: status === "CONFIRMED" ? "Payment received — booking confirmed" : "Payment received — booking requested",
          body: `Booking ${booking.bookingRef}: ${status === "CONFIRMED" ? "confirmed" : "awaiting business confirmation"}.`, relatedBookingId: booking.id
        })) });
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch {
    console.error("Payment webhook reconciliation failed", { eventId: event.id, paymentId });
    return new NextResponse("Payment reconciliation failed; retry required", { status: 500 });
  }
  return new NextResponse(null, { status: 200 });
}
