import { isDemoMode } from "@/lib/dev-mode";
import { notFound, redirect } from "next/navigation";
import { Lock, ShieldCheck, CheckCircle2 } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUGX } from "@/lib/booking";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PaymentMethodForm } from "@/components/payments/payment-method-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { toBookingStatus } from "@/lib/status";
import { processPaymentAction } from "@/app/payments/actions";
import Link from "next/link";
import { paymentDeadline } from "@/lib/booking-operations";
function ExpiredPayment({ bookingIds }: { bookingIds: string[] }) {
  return <><SiteHeader /><main className="flex min-h-[70vh] items-center justify-center px-4 py-10"><Card className="w-full max-w-xl"><CardHeader><CardTitle>Payment window expired</CardTitle><p className="text-sm leading-relaxed text-muted-foreground">This reservation can no longer be paid because its payment window has ended. Check availability and submit a new booking to continue.</p></CardHeader><CardContent className="flex flex-col gap-3">{bookingIds.map(id=><Button key={id} asChild variant="outline"><Link href={`/bookings/${id}`}>View booking details</Link></Button>)}<Button asChild><Link href="/explore">Find another stay or experience</Link></Button></CardContent></Card></main><SiteFooter /></>;
}
function WaitingForBusiness({bookings}: {bookings:{id:string;bookingRef:string;status:string;responseDueAt:Date|null;totalMinor:number}[]}) {
 const restaurantOnly = bookings.every(booking => booking.totalMinor === 0);
 return <><SiteHeader/><main className="container mx-auto max-w-3xl space-y-5 px-4 py-10"><h1 className="type-page ">{restaurantOnly ? "Table reservation requested" : "Booking status"}</h1><p>{restaurantOnly ? "Your request has been sent to the restaurant. No payment is required. You can check its status or send the restaurant a message below." : "Your requests are awaiting business acceptance. Once accepted, you can continue to payment. Table reservations do not require online payment."}</p>{bookings.map(booking=><Link key={booking.id} href={`/bookings/${booking.id}`} className="block rounded border p-4"><strong>{booking.bookingRef}</strong><div className="mt-2"><BookingStatusBadge status={toBookingStatus(booking.status)} /></div>{booking.responseDueAt && <p>Response due: {booking.responseDueAt.toLocaleString("en-GB",{timeZone:"Africa/Kampala"})} EAT</p>}<span className="underline">View booking and messages</span></Link>)}<Link className="block underline" href="/bookings">My bookings</Link></main><SiteFooter/></>;
}

export default async function PaymentsPage({ searchParams }: { searchParams: { orderId?: string; bookingId?: string; error?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fpayments");

  const { orderId, bookingId } = searchParams;
  if (!orderId && !bookingId) notFound();

  let totalMinor = 0;
  let orderItems: Array<{ id: string; title: string; subtitle?: string; amountMinor: number }> = [];
  let customerName = session.user.name ?? "";

  if (orderId) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { bookings: { include: { listing: true, roomType: true } } }
    });
    if (!order || order.customerId !== session.user.id) notFound();
    if (order.bookings.some(b=>b.totalMinor > 0 && b.status === "AWAITING_BUSINESS_CONFIRMATION" && b.bookingMode !== "LEGACY")) return <WaitingForBusiness bookings={order.bookings}/>;
    if (order.totalMinor === 0) return <WaitingForBusiness bookings={order.bookings}/>;
    const payable = order.bookings.filter(b=>b.totalMinor>0&&["PENDING_PAYMENT","PAYMENT_FAILED"].includes(b.status));
    if (payable.some(b=>paymentDeadline(b)<new Date())) return <ExpiredPayment bookingIds={payable.map(b=>b.id)} />;
    if (!["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(order.status)) {
      redirect(`/payments/receipt?orderId=${order.id}`);
    }
    totalMinor = order.totalMinor;
    orderItems = order.bookings.map((b) => ({
      id: b.id,
      title: b.listing.title,
      subtitle: b.roomType?.name || b.listing.city || "Booking",
      amountMinor: b.totalMinor
    }));
  } else if (bookingId) {
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { listing: true, roomType: true }
    });
    if (!booking || booking.customerId !== session.user.id) notFound();
    if (booking.status === "AWAITING_BUSINESS_CONFIRMATION" && booking.bookingMode !== "LEGACY") return <WaitingForBusiness bookings={[booking]}/>;
    if (booking.bookingMode === "RESERVATION") redirect(`/bookings/${booking.id}`);
    if (booking.orderId) redirect(`/payments?orderId=${encodeURIComponent(booking.orderId)}`);
    if (["PENDING_PAYMENT","PAYMENT_FAILED"].includes(booking.status)&&paymentDeadline(booking)<new Date()) return <ExpiredPayment bookingIds={[booking.id]} />;
    if (!["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(booking.status)) {
      redirect(`/payments/receipt?bookingId=${booking.id}`);
    }
    totalMinor = booking.totalMinor;
    orderItems = [
      {
        id: booking.id,
        title: booking.listing.title,
        subtitle: booking.roomType?.name || booking.listing.city || "Booking",
        amountMinor: booking.totalMinor
      }
    ];
  }

  const payLabel = `Pay ${formatUGX(totalMinor)}`;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-muted/20 pb-20 pt-6">
        <Container className="max-w-5xl">
          <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Payment" }]} />

          <h1 className="type-page mb-8 text-[#0d5932]">
            Complete Payment
          </h1>
          {searchParams.error && <p role="alert" className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{searchParams.error}</p>}

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left Column: Payment Method Selection */}
            <div className="flex flex-col gap-6">
              <Card className="border border-border shadow-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Select Payment Method</CardTitle>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {isDemoMode() ? "Choose how you would like to pay." : "Continue to the configured provider’s hosted checkout."}
                  </p>
                </CardHeader>
                <CardContent>
                  <PaymentMethodForm
                    orderId={orderId}
                    bookingId={bookingId}
                    payLabel={payLabel}
                    demo={isDemoMode()}
                    enabled={isDemoMode() || Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET)}
                    cardholderDefault={customerName}
                    action={processPaymentAction}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Order Summary */}
            <div>
              <Card className="sticky top-28 border border-border shadow-card rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 text-sm">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 font-medium">{item.subtitle}</p>
                        </div>
                        <span className="font-semibold text-slate-900 shrink-0">
                          {formatUGX(item.amountMinor)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-slate-900">
                    <span className="font-semibold text-base">Total Due</span>
                    <span className="text-2xl font-semibold text-[#0d5932]">{formatUGX(totalMinor)}</span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 flex items-start gap-2.5 border border-slate-100 text-xs text-slate-500 font-medium mt-2">
                    <ShieldCheck className="h-4 w-4 text-[#0d5932] shrink-0 mt-0.5" />
                    <span>{isDemoMode() ? "Your booking is confirmed once payment is successful." : "Payment status changes after provider confirmation."}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
