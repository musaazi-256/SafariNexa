import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUGX } from "@/lib/booking";
import { toBookingStatus } from "@/lib/status";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { BookingStatusBadge } from "@/components/ui/status-badge";

const CANCELLABLE = ["AUTH_REQUIRED", "PENDING_TRAVELLER_DETAILS", "PENDING_PAYMENT", "AWAITING_BUSINESS_CONFIRMATION", "CONFIRMED"];

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/bookings/${params.id}`)}`);

  const booking = await db.booking.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      business: true,
      participants: true,
      payments: { orderBy: { createdAt: "desc" } },
      review: true,
      roomType: true,
      addOns: true
    }
  });
  if (!booking || booking.customerId !== session.user.id) notFound();

  const canCancel = CANCELLABLE.includes(booking.status);
  const canReview = ["COMPLETED", "REVIEW_PENDING"].includes(booking.status) && !booking.review;
  const primaryParticipant = booking.participants.find((participant) => participant.isPrimary) ?? booking.participants[0];

  async function cancelBooking() {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in");

    const target = await db.booking.findUnique({ where: { id: params.id } });
    if (!target || target.customerId !== activeSession.user.id) throw new Error("Booking not found.");
    if (!CANCELLABLE.includes(target.status)) return;

    await db.booking.update({
      where: { id: target.id },
      data: { status: "CANCELLED_BY_CUSTOMER", cancelledAt: new Date(), cancelReason: "Cancelled by customer" }
    });

    redirect(`/bookings/${target.id}`);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20 pt-6">
          <Breadcrumbs items={[{ label: "My bookings", href: "/bookings" }, { label: booking.bookingRef }]} />

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <BookingStatusBadge status={toBookingStatus(booking.status)} />
              <h1 className="mt-2 text-3xl font-extrabold">{booking.listing.title}</h1>
              <p className="mt-1 text-muted-foreground">Booked with {booking.business.name}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Reference</p>
                  <p className="font-semibold">{booking.bookingRef}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Participants</p>
                  <p className="font-semibold">{booking.participantsCount}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Start</p>
                  <p className="font-semibold">
                    {booking.startDate ? new Date(booking.startDate).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">End</p>
                  <p className="font-semibold">
                    {booking.endDate ? new Date(booking.endDate).toLocaleDateString("en-UG", { dateStyle: "medium" }) : "—"}
                  </p>
                </div>
              </div>

              {booking.roomType || booking.addOns.length > 0 ? (
                <>
                  <h2 className="mb-2 mt-8 text-lg font-bold">Room &amp; add-ons</h2>
                  <Card>
                    <CardContent className="grid gap-2 pt-6 text-sm">
                      {booking.roomType ? (
                        <p>
                          <span className="text-muted-foreground">Room: </span>
                          {booking.roomType.name}
                        </p>
                      ) : null}
                      {booking.addOns.map((addOn) => (
                        <p key={addOn.id}>
                          <span className="text-muted-foreground">Add-on: </span>
                          {addOn.name} — {formatUGX(addOn.priceMinor)}
                        </p>
                      ))}
                    </CardContent>
                  </Card>
                </>
              ) : null}

              {primaryParticipant ? (
                <>
                  <h2 className="mb-2 mt-8 text-lg font-bold">Traveller details</h2>
                  <Card>
                    <CardContent className="grid gap-2 pt-6 text-sm">
                      <p>
                        <span className="text-muted-foreground">Name: </span>
                        {primaryParticipant.fullName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Email: </span>
                        {primaryParticipant.email}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Phone: </span>
                        {primaryParticipant.phone}
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : null}

              {booking.payments.length > 0 ? (
                <>
                  <h2 className="mb-2 mt-8 text-lg font-bold">Payment history</h2>
                  <div className="flex flex-col gap-2">
                    {booking.payments.map((payment) => (
                      <Card key={payment.id}>
                        <CardContent className="flex items-center justify-between pt-6 text-sm">
                          <span>
                            {payment.provider.replaceAll("_", " ")} · {payment.status.replaceAll("_", " ").toLowerCase()}
                          </span>
                          <strong>{formatUGX(payment.amountMinor)}</strong>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <Card className="sticky top-24 h-fit">
              <CardHeader>
                <CardTitle>Booking summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <strong className="text-lg">{formatUGX(booking.totalMinor)}</strong>
                </div>
                <Separator />
                {booking.status === "PENDING_PAYMENT" || booking.status === "PAYMENT_FAILED" ? (
                  <Button asChild size="lg" className="w-full">
                    <Link href={`/payments?bookingId=${booking.id}`}>Complete payment</Link>
                  </Button>
                ) : null}
                {canReview ? (
                  <Button asChild size="lg" variant="secondary" className="w-full">
                    <Link href={`/reviews/new?bookingId=${booking.id}`}>Write a review</Link>
                  </Button>
                ) : null}
                {canCancel ? (
                  <form action={cancelBooking}>
                    <Button type="submit" variant="destructive" className="w-full">
                      Cancel booking
                    </Button>
                  </form>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">This booking can no longer be cancelled here.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
