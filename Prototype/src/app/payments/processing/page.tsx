import { notFound, redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUGX } from "@/lib/booking";
import { processingMessageFor, simulatedFailureReasonFor } from "@/lib/payments";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export default async function PaymentProcessingPage({ searchParams }: { searchParams: { paymentId?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in");

  const paymentId = searchParams.paymentId;
  if (!paymentId) notFound();

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { listing: true } }, order: { include: { bookings: true } } }
  });
  const ownerId = payment?.booking?.customerId ?? payment?.order?.customerId;
  if (!payment || !ownerId || ownerId !== session.user.id) notFound();

  const redirectTarget = payment.booking ? `bookingId=${payment.booking.id}` : `orderId=${payment.order!.id}`;
  if (payment.status === "SUCCESSFUL") redirect(`/payments/receipt?${redirectTarget}`);
  if (payment.status !== "PROCESSING") redirect(payment.booking ? `/bookings/${payment.booking.id}` : "/bookings");

  const description = payment.booking
    ? payment.booking.listing.title
    : `${payment.order!.bookings.length} item${payment.order!.bookings.length === 1 ? "" : "s"} in your trip`;
  const processingMessage = processingMessageFor(payment.provider, payment.providerReference);

  async function simulateOutcome(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in");

    const submittedPaymentId = String(formData.get("paymentId"));
    const outcome = String(formData.get("outcome"));

    const targetPayment = await db.payment.findUnique({
      where: { id: submittedPaymentId },
      include: { booking: { include: { listing: true } }, order: { include: { bookings: true } } }
    });
    const targetOwnerId = targetPayment?.booking?.customerId ?? targetPayment?.order?.customerId;
    if (!targetPayment || !targetOwnerId || targetOwnerId !== activeSession.user.id) {
      throw new Error("Payment not found.");
    }
    const bookingId = targetPayment.booking?.id;
    const orderId = targetPayment.order?.id;
    const description = targetPayment.booking
      ? targetPayment.booking.listing.title
      : `your trip (${targetPayment.order?.bookings.length ?? 0} item${targetPayment.order?.bookings.length === 1 ? "" : "s"})`;

    if (outcome === "success") {
      await db.payment.update({
        where: { id: targetPayment.id },
        data: { status: "SUCCESSFUL", completedAt: new Date() }
      });
      await db.notification.create({
        data: {
          userId: targetOwnerId,
          type: "PAYMENT_UPDATE",
          title: "Payment successful",
          body: `${formatUGX(targetPayment.amountMinor)} paid for ${description}.`,
          relatedBookingId: bookingId
        }
      });
      if (bookingId) {
        await db.booking.update({ where: { id: bookingId }, data: { status: "AWAITING_BUSINESS_CONFIRMATION" } });
        redirect(`/payments/receipt?bookingId=${bookingId}`);
      } else if (orderId) {
        await db.order.update({ where: { id: orderId }, data: { status: "AWAITING_BUSINESS_CONFIRMATION" } });
        await db.booking.updateMany({ where: { orderId }, data: { status: "AWAITING_BUSINESS_CONFIRMATION" } });
        redirect(`/payments/receipt?orderId=${orderId}`);
      }
    } else {
      const failureReason = simulatedFailureReasonFor(targetPayment.provider);
      await db.payment.update({
        where: { id: targetPayment.id },
        data: { status: "FAILED", failureReason }
      });
      await db.notification.create({
        data: {
          userId: targetOwnerId,
          type: "PAYMENT_UPDATE",
          title: "Payment failed",
          body: `Payment for ${description} failed — ${failureReason}`,
          relatedBookingId: bookingId
        }
      });
      if (bookingId) {
        await db.booking.update({ where: { id: bookingId }, data: { status: "PAYMENT_FAILED" } });
        redirect(`/payments?bookingId=${bookingId}&error=${encodeURIComponent(failureReason)}`);
      } else if (orderId) {
        await db.order.update({ where: { id: orderId }, data: { status: "PAYMENT_FAILED" } });
        await db.booking.updateMany({ where: { orderId }, data: { status: "PAYMENT_FAILED" } });
        redirect(`/payments?orderId=${orderId}&error=${encodeURIComponent(failureReason)}`);
      }
    }
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[70vh] items-center justify-center py-14">
          <Card className="w-full max-w-md">
            <CardHeader className="items-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <CardTitle className="mt-3">Processing payment</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatUGX(payment.amountMinor)} for {description}
              </p>
              <p className="mt-1 text-sm font-medium">{processingMessage}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-center text-xs text-warning-foreground">
                No live payment provider is connected in this environment — simulate the outcome below to continue
                testing the flow.
              </p>
              <form action={simulateOutcome}>
                <input type="hidden" name="paymentId" value={payment.id} />
                <input type="hidden" name="outcome" value="success" />
                <Button type="submit" size="lg" className="w-full">
                  Simulate successful payment
                </Button>
              </form>
              <form action={simulateOutcome}>
                <input type="hidden" name="paymentId" value={payment.id} />
                <input type="hidden" name="outcome" value="failure" />
                <Button type="submit" variant="secondary" size="lg" className="w-full">
                  Simulate failed payment
                </Button>
              </form>
            </CardContent>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
