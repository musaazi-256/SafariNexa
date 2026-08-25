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
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { processPaymentAction } from "@/app/payments/actions";

export default async function PaymentsPage({ searchParams }: { searchParams: { orderId?: string; bookingId?: string } }) {
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

          <h1 className="mb-8 text-3xl font-extrabold sm:text-4xl text-[#0d5932] tracking-tight">
            Complete Payment
          </h1>

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left Column: Payment Method Selection */}
            <div className="flex flex-col gap-6">
              <Card className="border border-slate-200/90 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Select Payment Method</CardTitle>
                  <p className="text-sm text-slate-500 font-medium">
                    Choose your preferred mobile money provider or credit/debit card to complete payment.
                  </p>
                </CardHeader>
                <CardContent>
                  <PaymentMethodForm
                    orderId={orderId}
                    bookingId={bookingId}
                    payLabel={payLabel}
                    cardholderDefault={customerName}
                    action={processPaymentAction}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Order Summary */}
            <div>
              <Card className="sticky top-28 border border-slate-200/90 shadow-sm rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 text-sm">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-slate-900 truncate">{item.title}</p>
                          <p className="text-xs text-slate-400 font-medium">{item.subtitle}</p>
                        </div>
                        <span className="font-semibold text-slate-900 shrink-0">
                          {formatUGX(item.amountMinor)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between text-slate-900">
                    <span className="font-bold text-base">Total Due</span>
                    <span className="text-2xl font-extrabold text-[#0d5932]">{formatUGX(totalMinor)}</span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 flex items-start gap-2.5 border border-slate-100 text-xs text-slate-500 font-medium mt-2">
                    <ShieldCheck className="h-4 w-4 text-[#0d5932] shrink-0 mt-0.5" />
                    <span>Payments processed safely via verified East African mobile money and bank gateways.</span>
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
