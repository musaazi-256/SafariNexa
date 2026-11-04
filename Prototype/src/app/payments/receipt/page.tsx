import { PageHeader } from "@/components/page-header";
import { bookingPaymentSummary } from "@/lib/booking-payment-summary";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { toBookingStatus } from "@/lib/status";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUGX } from "@/lib/booking";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { receiptState } from "@/lib/payment-state";

export default async function PaymentReceiptPage({ searchParams }: { searchParams: { bookingId?: string; orderId?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in");
  const { bookingId, orderId } = searchParams;
  if (Boolean(bookingId) === Boolean(orderId)) notFound();
  const order = orderId ? await db.order.findUnique({
    where: { id: orderId }, include: { bookings: { include: { listing: true } }, payments: { include:{refunds:true}, orderBy: { createdAt: "desc" } } }
  }) : null;
  const booking = bookingId ? await db.booking.findUnique({
    where: { id: bookingId }, include: { listing: true, payments: { include:{refunds:true}, orderBy: { createdAt: "desc" } }, order: { include: { payments: { include:{refunds:true}, orderBy: { createdAt: "desc" } } } } }
  }) : null;
  const target = order || booking;
  if (!target || target.customerId !== session.user.id) notFound();
  const payments = order?.payments ?? (booking?.payments.length ? booking.payments : booking?.order?.payments) ?? [];
  const payment = payments.find(p => ["SUCCESSFUL", "PARTIALLY_REFUNDED", "REFUNDED"].includes(p.status)) ?? payments[0];
  const allocation = booking ? bookingPaymentSummary(booking) : null;
  const state = receiptState(allocation?.status ?? payment?.status);
  const query = orderId ? `orderId=${encodeURIComponent(orderId)}` : `bookingId=${encodeURIComponent(bookingId!)}`;
  return <>
    <SiteHeader />
    <main><Container className="flex min-h-[70vh] items-center justify-center py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="items-center text-center"><span className={`flex h-12 w-12 items-center justify-center rounded-full ${state.paid ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{state.paid ? <CheckCircle2 className="h-6 w-6"/> : state.pending ? <Clock className="h-6 w-6"/> : <XCircle className="h-6 w-6"/>}</span><PageHeader descriptionRole="status" title={<>{state.title}</>} description={<>{payment?.providerReference?.startsWith("DEMO-") ? "Your payment status and booking details are shown below." : state.description}</>} /></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {(order?.bookings ?? (booking ? [booking] : [])).map(b => <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
            <div className="min-w-0"><p className="font-semibold break-words">{b.listing.title}</p><p className="text-sm leading-relaxed">{b.bookingRef}</p></div>
            <BookingStatusBadge status={toBookingStatus(b.status)} />
          </div>)}
          <Separator />
          <div className="flex items-center justify-between text-base font-semibold"><span>{state.amountLabel}</span><span>{formatUGX(target.totalMinor)}</span></div>
          {allocation && allocation.refundedMinor > 0 && <p className="text-sm">Refunded for this booking: {formatUGX(allocation.refundedMinor)}</p>}
          {allocation && allocation.heldMinor > 0 && <p className="text-sm">Refund awaiting completion: {formatUGX(allocation.heldMinor)}</p>}
          {booking?.orderId && <p className="text-sm text-muted-foreground leading-relaxed">Payment was collected for the combined order. The amount above is this booking’s share.</p>}
          {payment && <p className="break-all text-sm text-muted-foreground leading-relaxed">Provider status: {payment.status.replaceAll("_", " ").toLowerCase()}{payment.providerReference ? ` · ${payment.providerReference}` : ""}</p>}
          {state.pending && <Button asChild className="w-full" variant="secondary"><Link href={`/payments/receipt?${query}`}>Refresh payment status</Link></Button>}
          {!state.paid && !state.pending && ["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(target.status) && <Button asChild className="w-full"><Link href={`/payments?${query}`}>Review payment options</Link></Button>}
          <Separator />
          <Button asChild size="lg" className="w-full"><Link href={booking ? `/bookings/${booking.id}` : "/bookings"}>View bookings</Link></Button>
          <Button asChild variant="secondary" className="w-full"><Link href="/explore">Continue browsing</Link></Button>
        </CardContent>
      </Card>
    </Container></main>
    <SiteFooter />
  </>;
}
