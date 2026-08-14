import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUGX } from "@/lib/booking";
import { toBookingStatus } from "@/lib/status";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { BookingStatusBadge } from "@/components/ui/status-badge";

export default async function PaymentReceiptPage({ searchParams }: { searchParams: { bookingId?: string; orderId?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in");

  const { bookingId, orderId } = searchParams;
  if (!bookingId && !orderId) notFound();

  if (orderId) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        bookings: { include: { listing: true } },
        payments: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });
    if (!order || order.customerId !== session.user.id) notFound();

    const payment = order.payments[0];

    return (
      <>
        <SiteHeader />
        <main>
          <Container className="flex min-h-[70vh] items-center justify-center py-14">
            <Card className="w-full max-w-lg">
              <CardHeader className="items-center text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <CardTitle className="mt-3">Payment successful</CardTitle>
                <p className="text-sm text-muted-foreground">Your booking requests have been sent to each business.</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {order.bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold">{booking.listing.title}</p>
                      <p className="text-xs text-muted-foreground">{booking.bookingRef}</p>
                    </div>
                    <BookingStatusBadge status={toBookingStatus(booking.status)} />
                  </div>
                ))}
                {payment?.providerReference ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-semibold">{payment.providerReference}</span>
                  </div>
                ) : null}
                <Separator />
                <div className="flex items-center justify-between text-base">
                  <span className="font-bold">Total paid</span>
                  <strong>{formatUGX(order.totalMinor)}</strong>
                </div>
                <Separator />
                <Button asChild size="lg" className="w-full">
                  <Link href="/bookings">View my bookings</Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/explore">Continue browsing</Link>
                </Button>
              </CardContent>
            </Card>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true, payments: { orderBy: { createdAt: "desc" }, take: 1 }, business: true }
  });
  if (!booking || booking.customerId !== session.user.id) notFound();

  const payment = booking.payments[0];

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[70vh] items-center justify-center py-14">
          <Card className="w-full max-w-lg">
            <CardHeader className="items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <CardTitle className="mt-3">Payment successful</CardTitle>
              <p className="text-sm text-muted-foreground">Your booking request has been sent to {booking.business.name}.</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Booking reference</span>
                <span className="font-semibold">{booking.bookingRef}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Listing</span>
                <span className="font-semibold">{booking.listing.title}</span>
              </div>
              {payment ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Payment method</span>
                    <span className="font-semibold">{payment.provider.replaceAll("_", " ")}</span>
                  </div>
                  {payment.providerReference ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-semibold">{payment.providerReference}</span>
                    </div>
                  ) : null}
                </>
              ) : null}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <BookingStatusBadge status={toBookingStatus(booking.status)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base">
                <span className="font-bold">Total paid</span>
                <strong>{formatUGX(booking.totalMinor)}</strong>
              </div>
              <Separator />
              <Button asChild size="lg" className="w-full">
                <Link href={`/bookings/${booking.id}`}>View booking</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/explore">Continue browsing</Link>
              </Button>
            </CardContent>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
