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
    where: { id: orderId }, include: { bookings: { include: { listing: true } }, payments: { orderBy: { createdAt: "desc" } } }
  }) : null;
  const booking = bookingId ? await db.booking.findUnique({
    where: { id: bookingId }, include: { listing: true, payments: { orderBy: { createdAt: "desc" } }, order: { include: { payments: { orderBy: { createdAt: "desc" } } } } }
  }) : null;
  const target = order || booking;
  if (!target || target.customerId !== session.user.id) notFound();
  const payments = order?.payments ?? (booking?.payments.length ? booking.payments : booking?.order?.payments) ?? [];
  const payment = payments.find(p => ["SUCCESSFUL", "PARTIALLY_REFUNDED", "REFUNDED"].includes(p.status)) ?? payments[0];
  const state = receiptState(payment?.status);
  const query = orderId ? `orderId=${encodeURIComponent(orderId)}` : `bookingId=${encodeURIComponent(bookingId!)}`;
  return <>
    <SiteHeader />
    <main><Container className="flex min-h-[70vh] items-center justify-center py-10">
      <Card className="w-full max-w-xl">
        <CardHeader><CardTitle>{state.title}</CardTitle><p role="status" className="text-sm text-muted-foreground">{state.description}</p></CardHeader>
        <CardContent className="space-y-4">
          {(order?.bookings ?? (booking ? [booking] : [])).map(b => <div key={b.id} className="flex flex-wrap justify-between gap-2 border-b pb-3">
            <div className="min-w-0"><p className="font-semibold break-words">{b.listing.title}</p><p className="text-sm">{b.bookingRef}</p></div>
            <p className="text-sm">{b.status.replaceAll("_", " ").toLowerCase()}</p>
          </div>)}
          <div className="flex flex-wrap justify-between gap-2 font-bold"><span>{state.amountLabel}</span><span>{formatUGX(target.totalMinor)}</span></div>
          {booking?.orderId && <p className="text-sm text-muted-foreground">Payment was collected for the combined order. The amount above is this booking’s share.</p>}
          {payment && <p className="break-all text-sm text-muted-foreground">Provider status: {payment.status.replaceAll("_", " ").toLowerCase()}{payment.providerReference ? ` · ${payment.providerReference}` : ""}</p>}
          {state.pending && <Button asChild className="w-full" variant="secondary"><Link href={`/payments/receipt?${query}`}>Refresh payment status</Link></Button>}
          {!state.paid && !state.pending && ["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(target.status) && <Button asChild className="w-full"><Link href={`/payments?${query}`}>Review payment options</Link></Button>}
          <Button asChild className="w-full" variant="secondary"><Link href={booking ? `/bookings/${booking.id}` : "/bookings"}>View bookings</Link></Button>
        </CardContent>
      </Card>
    </Container></main>
    <SiteFooter />
  </>;
}
