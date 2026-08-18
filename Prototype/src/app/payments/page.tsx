import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export default async function PaymentsPage({ searchParams }: { searchParams: { orderId?: string; bookingId?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in");

  const { orderId, bookingId } = searchParams;
  if (!orderId && !bookingId) notFound();

  let totalMinor = 0;
  let title = "";
  let metadata: Record<string, string> = {};

  if (orderId) {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.customerId !== session.user.id) notFound();
    if (!["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(order.status)) {
      redirect(`/bookings`);
    }
    totalMinor = order.totalMinor;
    title = `SafariNexa Order ${order.id.slice(-8)}`;
    metadata = { orderId: order.id };
  } else if (bookingId) {
    const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { listing: true } });
    if (!booking || booking.customerId !== session.user.id) notFound();
    if (!["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(booking.status)) {
      redirect(`/bookings/${booking.id}`);
    }
    totalMinor = booking.totalMinor;
    title = booking.listing.title;
    metadata = { bookingId: booking.id };
  }

  // Bypass Stripe checkout if we're using a dummy key in development
  const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
  if (stripeKey.includes("ummy")) {
    await db.payment.create({
      data: {
        orderId: orderId || undefined,
        bookingId: bookingId || undefined,
        provider: "STRIPE",
        status: "PROCESSING",
        amountMinor: totalMinor,
        currency: "UGX",
        providerReference: "mock_session_" + Date.now()
      }
    });
    redirect(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payments/success?session_id=mock_session`);
  }

  // Create Stripe Checkout Session
  const stripeSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: session.user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: "ugx",
          product_data: {
            name: title,
          },
          unit_amount: totalMinor,
        },
        quantity: 1,
      },
    ],
    metadata,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payments/cancelled`,
  });

  if (stripeSession.url) {
    // Record the payment intent in our DB before redirecting
    await db.payment.create({
      data: {
        orderId: orderId || undefined,
        bookingId: bookingId || undefined,
        provider: "STRIPE",
        status: "PROCESSING",
        amountMinor: totalMinor,
        currency: "UGX",
        providerReference: stripeSession.id
      }
    });
    
    redirect(stripeSession.url);
  }

  throw new Error("Failed to create Stripe session.");
}
