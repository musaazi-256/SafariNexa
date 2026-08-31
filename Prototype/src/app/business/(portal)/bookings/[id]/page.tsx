import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { toBookingStatus } from "@/lib/status";
import { BookingChat } from "@/components/booking-chat";

export default async function BusinessBookingDetailPage({ params }: { params: { id: string } }) {
  const { business, businessId } = await requireBusinessSession();
  if (!business || !businessId) redirect("/business/auth/sign-in");

  const booking = await db.booking.findUnique({
    where: { id: params.id },
    include: {
      listing: true,
      customer: true,
      participants: true,
      payments: { orderBy: { createdAt: "desc" } },
      roomType: true,
      addOns: true
    }
  });
  if (!booking || booking.businessId !== businessId) notFound();

  const session = await auth();

  const thread = await db.messageThread.findFirst({
    where: { bookingId: params.id },
    include: {
      messages: {
        include: { sender: { select: { name: true } } },
        orderBy: { createdAt: "asc" }
      }
    }
  });

  const chatMessages = thread?.messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt,
    senderId: m.senderId,
    senderName: m.sender.name
  })) ?? [];

  const primaryParticipant = booking.participants.find((participant) => participant.isPrimary) ?? booking.participants[0];
  const canRespond = booking.status === "AWAITING_BUSINESS_CONFIRMATION";

  async function respond(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/business/auth/sign-in");

    const bookingId = String(formData.get("bookingId"));
    const decision = String(formData.get("decision"));

    const target = await db.booking.findUnique({ where: { id: bookingId }, include: { listing: true } });
    if (!target || !activeSession.user.businessIds.includes(target.businessId)) throw new Error("Booking not found.");
    if (target.status !== "AWAITING_BUSINESS_CONFIRMATION") return;

    const isConfirm = decision === "confirm";
    await db.booking.update({
      where: { id: target.id },
      data: isConfirm
        ? { status: "CONFIRMED", confirmedAt: new Date() }
        : { status: "CANCELLED_BY_BUSINESS", cancelledAt: new Date(), cancelReason: "Declined by business" }
    });

    await db.notification.create({
      data: {
        userId: target.customerId,
        type: "BOOKING_UPDATE",
        title: isConfirm ? "Booking confirmed" : "Booking declined",
        body: isConfirm
          ? `${target.listing.title} confirmed your booking ${target.bookingRef}.`
          : `${target.listing.title} declined your booking ${target.bookingRef}.`,
        relatedBookingId: target.id
      }
    });

    redirect(`/business/bookings/${target.id}`);
  }

  return (
    <>
      <Breadcrumbs items={[{ label: "Bookings", href: "/business/bookings" }, { label: booking.bookingRef }]} />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <BookingStatusBadge status={toBookingStatus(booking.status)} />
              <h1 className="mt-2 text-3xl font-extrabold">{booking.listing.title}</h1>
              <p className="mt-1 text-muted-foreground">Booking {booking.bookingRef}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
                  <p className="font-semibold">{booking.endDate ? new Date(booking.endDate).toLocaleDateString("en-UG", { dateStyle: "medium" }) : "—"}</p>
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

              <h2 className="mb-2 mt-8 text-lg font-bold">Customer</h2>
              <Card>
                <CardContent className="grid gap-2 pt-6 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name: </span>
                    {primaryParticipant?.fullName ?? booking.customer.name ?? "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email: </span>
                    {primaryParticipant?.email ?? booking.customer.email}
                  </p>
                  {primaryParticipant?.phone ? (
                    <p>
                      <span className="text-muted-foreground">Phone: </span>
                      {primaryParticipant.phone}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

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

              {/* Customer Messages & Inquiries attached to this booking */}
              <BookingChat
                bookingId={booking.id}
                initialMessages={chatMessages}
                currentUserId={session?.user?.id ?? ""}
                businessName={business.name}
                isBusinessPortal={true}
              />
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
                {canRespond ? (
                  <>
                    <form action={respond}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="decision" value="confirm" />
                      <Button type="submit" size="lg" className="w-full">
                        Confirm booking
                      </Button>
                    </form>
                    <form action={respond}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="decision" value="decline" />
                      <Button type="submit" variant="destructive" className="w-full">
                        Decline booking
                      </Button>
                    </form>
                  </>
                ) : (
                  <p className="text-center text-xs text-muted-foreground">No action needed on this booking right now.</p>
                )}
              </CardContent>
            </Card>
      </div>
    </>
  );
}
