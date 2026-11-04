import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";
import { stripeAmount } from "@/lib/payment-state";
import { reconcileCheckout } from "@/lib/payment-reconciliation";
import { completeRefund, finishCancelledRefund } from "@/lib/refund-service";

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
        else if (refund.status === "failed" || refund.status === "canceled") {await tx.refund.updateMany({where:{id:refundId,status:{in:["REQUESTED","PROCESSING"]}},data:{status:"REJECTED"}});await finishCancelledRefund(tx,record.bookingId);}
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
      await reconcileCheckout(tx, paymentId, checkout,
        event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed");
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch {
    console.error("Payment webhook reconciliation failed", { eventId: event.id, paymentId });
    return new NextResponse("Payment reconciliation failed; retry required", { status: 500 });
  }
  return new NextResponse(null, { status: 200 });
}
