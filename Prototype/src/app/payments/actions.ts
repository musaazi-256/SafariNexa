"use server";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { stripeAmount } from "@/lib/payment-state";
import { paymentDeadline } from "@/lib/booking-operations";

export async function processPaymentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const orderId = String(formData.get("orderId") ?? "").trim() || undefined;
  const bookingId = String(formData.get("bookingId") ?? "").trim() || undefined;
  if (Boolean(orderId) === Boolean(bookingId)) throw new Error("Choose one booking or order.");
  const query = orderId ? `orderId=${encodeURIComponent(orderId)}` : `bookingId=${encodeURIComponent(bookingId!)}`;
  if (formData.get("method") !== "stripe" || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) redirect(`/payments?${query}&error=unavailable`);
  const attempt = await db.$transaction(async tx => {
    const target = orderId
      ? await tx.order.findUnique({ where: { id: orderId }, include: { bookings: true } })
      : await tx.booking.findUnique({ where: { id: bookingId } });
    if (!target || target.customerId !== session.user.id) throw new Error("Booking not found.");
    if ("orderId" in target && target.orderId) throw new Error("Pay for this booking through its combined order.");
    if (!["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(target.status)) return null;
    if ("bookings" in target && target.bookings.some(b => b.totalMinor > 0 && !["PENDING_PAYMENT", "PAYMENT_FAILED","CANCELLED_BY_CUSTOMER","CANCELLED_BY_BUSINESS","CANCELLED_BY_ADMIN"].includes(b.status))) throw new Error("This order changed. All payable requests must be accepted before payment.");
    const payable = "bookings" in target ? target.bookings.filter(b=>["PENDING_PAYMENT","PAYMENT_FAILED"].includes(b.status) && b.totalMinor>0) : [target];
    if (!payable.length || payable.some(b=>paymentDeadline(b)<new Date())) throw new Error("This unpaid reservation has expired. Please review availability and create a new booking.");
    if (target.totalMinor <= 0) throw new Error("A valid quote is required.");
    const existing = await tx.payment.findFirst({
      where: { ...(orderId ? { orderId } : { bookingId }), status: { in: ["PROCESSING", "PENDING_PROVIDER_CONFIRMATION"] } },
      orderBy: { createdAt: "desc" }
    });
    return existing ?? tx.payment.create({ data: { orderId, bookingId, provider: "STRIPE", status: "PROCESSING", amountMinor: target.totalMinor, currency: target.currency } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (!attempt) redirect(`/payments/receipt?${query}`);
  const configured = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (!configured && process.env.NODE_ENV === "production") throw new Error("Payment return URL is not configured.");
  const origin = configured ? new URL(configured).origin : `http://${headers().get("host") || "localhost:3000"}`;
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment", customer_email: session.user.email || undefined, client_reference_id: attempt.id,
    metadata: { paymentId: attempt.id, ...(orderId ? { orderId } : { bookingId: bookingId! }) },
    line_items: [{ price_data: { currency: attempt.currency.toLowerCase(), unit_amount: stripeAmount(attempt.amountMinor, attempt.currency), product_data: { name: "SafariNexa booking" } }, quantity: 1 }],
    success_url: `${origin}/payments/receipt?${query}`,
    cancel_url: `${origin}/payments/cancelled?${query}`
  }, { idempotencyKey: `checkout:${attempt.id}` });
  if (!checkout.url) throw new Error("Checkout unavailable. Please try again.");
  await db.payment.updateMany({ where: { id: attempt.id, status: { in: ["PROCESSING", "PENDING_PROVIDER_CONFIRMATION"] } }, data: { providerReference: checkout.id, status: "PENDING_PROVIDER_CONFIRMATION" } });
  redirect(checkout.url);
}
