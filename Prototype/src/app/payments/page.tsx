import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUGX } from "@/lib/booking";
import { maskLast4, PAYMENT_METHODS } from "@/lib/payments";
import { PaymentMethodForm } from "@/components/payments/payment-method-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export default async function PaymentsPage({ searchParams }: { searchParams: { orderId?: string; bookingId?: string; error?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in");

  const { orderId, bookingId, error } = searchParams;
  if (!orderId && !bookingId) notFound();

  let totalMinor = 0;
  let title = "";
  let refStr = "";

  if (orderId) {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.customerId !== session.user.id) notFound();
    if (!["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(order.status)) {
      redirect(`/bookings`);
    }
    totalMinor = order.totalMinor;
    title = "Trip Checkout";
    refStr = `Order ${order.id.slice(-8)}`;
  } else if (bookingId) {
    const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { listing: true } });
    if (!booking || booking.customerId !== session.user.id) notFound();
    if (!["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(booking.status)) {
      redirect(`/bookings/${booking.id}`);
    }
    totalMinor = booking.totalMinor;
    title = booking.listing.title;
    refStr = `Booking ${booking.bookingRef}`;
  }

  async function selectPaymentMethod(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in");

    const submittedOrderId = String(formData.get("orderId") || "");
    const submittedBookingId = String(formData.get("bookingId") || "");
    const methodValue = String(formData.get("method"));
    const method = PAYMENT_METHODS.find((item) => item.value === methodValue);
    if (!method) throw new Error("Select a payment method.");

    let amount = 0;
    if (submittedOrderId) {
      const targetOrder = await db.order.findUnique({ where: { id: submittedOrderId } });
      if (!targetOrder || targetOrder.customerId !== activeSession.user.id) throw new Error("Order not found.");
      amount = targetOrder.totalMinor;
    } else if (submittedBookingId) {
      const targetBooking = await db.booking.findUnique({ where: { id: submittedBookingId } });
      if (!targetBooking || targetBooking.customerId !== activeSession.user.id) throw new Error("Booking not found.");
      amount = targetBooking.totalMinor;
    } else {
      throw new Error("No order or booking provided.");
    }

    const maskedReference =
      method.kind === "mobile_money"
        ? maskLast4(String(formData.get("phone") ?? ""))
        : maskLast4(String(formData.get("cardNumber") ?? ""));

    const payment = await db.payment.create({
      data: {
        orderId: submittedOrderId || undefined,
        bookingId: submittedBookingId || undefined,
        provider: method.provider,
        status: "PROCESSING",
        amountMinor: amount,
        currency: "UGX",
        providerReference: maskedReference
      }
    });

    if (submittedOrderId) {
      await db.order.update({ where: { id: submittedOrderId }, data: { status: "PAYMENT_PROCESSING" } });
      await db.booking.updateMany({ where: { orderId: submittedOrderId }, data: { status: "PAYMENT_PROCESSING" } });
    } else if (submittedBookingId) {
      await db.booking.update({ where: { id: submittedBookingId }, data: { status: "PAYMENT_PROCESSING" } });
    }

    redirect(`/payments/processing?paymentId=${payment.id}`);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[70vh] items-center justify-center py-14">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Protected · Payment</p>
              <CardTitle className="text-2xl">Choose how to pay</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex items-center justify-between rounded-xl bg-secondary/60 p-3.5">
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="text-xs text-muted-foreground">{refStr}</p>
                </div>
                <strong className="text-lg">{formatUGX(totalMinor)}</strong>
              </div>

              {error ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                  {decodeURIComponent(error)} Try again or choose a different method.
                </p>
              ) : null}

              <PaymentMethodForm
                orderId={orderId}
                bookingId={bookingId}
                payLabel={`Pay ${formatUGX(totalMinor)}`}
                cardholderDefault={session.user.name ?? ""}
                action={selectPaymentMethod}
              />
            </CardContent>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
