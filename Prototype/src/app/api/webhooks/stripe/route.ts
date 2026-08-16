import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { orderId, bookingId } = session.metadata || {};

    if (!orderId && !bookingId) {
      return new NextResponse("Webhook Error: Missing metadata", { status: 400 });
    }

    try {
      await db.$transaction(async (tx) => {
        // 1. Mark Payment as completed
        const payment = await tx.payment.findFirst({
          where: { providerReference: session.id }
        });
        
        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: { 
              status: "SUCCESSFUL", 
              completedAt: new Date(),
              providerReference: typeof session.payment_intent === 'string' ? session.payment_intent : session.id 
            }
          });
        }

        // 2. Mark Order/Bookings as confirmed
        if (orderId) {
          await tx.order.update({
            where: { id: orderId },
            data: { status: "CONFIRMED" }
          });
          await tx.booking.updateMany({
            where: { orderId },
            data: { status: "CONFIRMED", confirmedAt: new Date() }
          });
          const bookings = await tx.booking.findMany({ where: { orderId } });
          for (const b of bookings) {
            await tx.notification.create({
              data: {
                userId: b.businessId,
                type: "BOOKING_UPDATE",
                title: "New Booking Confirmed",
                body: `Booking ${b.bookingRef} has been paid and confirmed.`,
                relatedBookingId: b.id
              }
            });
          }
        } else if (bookingId) {
          await tx.booking.update({
            where: { id: bookingId },
            data: { status: "CONFIRMED", confirmedAt: new Date() }
          });
          const b = await tx.booking.findUnique({ where: { id: bookingId } });
          if (b) {
            await tx.notification.create({
              data: {
                userId: b.businessId,
                type: "BOOKING_UPDATE",
                title: "New Booking Confirmed",
                body: `Booking ${b.bookingRef} has been paid and confirmed.`,
                relatedBookingId: b.id
              }
            });
          }
        }
      });
    } catch (err: any) {
      console.error("Failed to update database from webhook:", err);
      return new NextResponse(`Database Error: ${err.message}`, { status: 500 });
    }
  }

  return new NextResponse(null, { status: 200 });
}
