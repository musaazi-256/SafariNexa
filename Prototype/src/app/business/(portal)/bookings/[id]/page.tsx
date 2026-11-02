import { notFound, redirect } from "next/navigation";
import { BookingTravellerSummary } from "@/components/booking-traveller-summary";
import { BookingOperationsSummary } from "@/components/booking-operations-summary";
import { assignTransfer } from "@/lib/actions/fulfilment";

import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { formatUGX, formatBookingDate } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { cancelReservedBooking, syncOrderStatus, acceptBookingRequest } from "@/lib/booking-lifecycle";
import { Prisma } from "@prisma/client";
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
      order: { include: { payments: { orderBy: { createdAt: "desc" } } } },
      payments: { orderBy: { createdAt: "desc" } },
      roomType: true,
      addOns: true
    }
  });
  if (!booking || booking.businessId !== businessId) notFound();

  const session = await auth();

  const paymentHistory = booking.payments.length ? booking.payments : (booking.order?.payments ?? []).map(payment => ({...payment, amountMinor: booking.totalMinor}));

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
    if (!["AWAITING_BUSINESS_CONFIRMATION", "CONFIRMED", "PENDING_PAYMENT"].includes(target.status)) return;

    if (!["confirm", "decline", "complete"].includes(decision)) throw new Error("Invalid decision.");
    await db.$transaction(async tx => {
      const member = await tx.businessUser.findFirst({ where: { businessId: target.businessId, userId: activeSession.user.id, role: { in: ["OWNER", "MANAGER"] } } });
      if (!member) throw new Error("Only owners and managers can manage bookings.");
      if (decision === "decline") {
        await cancelReservedBooking(tx, target.id, activeSession.user.id, "business");
        return;
      }
      if (decision === "confirm") { await acceptBookingRequest(tx,target.id,activeSession.user.id); return; }
      const expected = decision === "complete" ? "CONFIRMED" : "AWAITING_BUSINESS_CONFIRMATION";
      if (decision === "complete" && (!target.startDate || (target.endDate ?? target.startDate) > new Date())) throw new Error("Bookings can only be completed after the service date.");
      const updated = await tx.booking.updateMany({ where: { id: target.id, status: expected }, data: decision === "complete" ? { status: "COMPLETED", completedAt: new Date() } : { status: "CONFIRMED", confirmedAt: new Date() } });
      if (!updated.count) return;
      await syncOrderStatus(tx, target.orderId);
      await tx.notification.create({ data: { userId: target.customerId, type: decision === "complete" ? "REVIEW_PROMPT" : "BOOKING_UPDATE", title: decision === "complete" ? "How was your experience?" : "Booking confirmed", body: `Booking ${target.bookingRef} has been ${decision === "complete" ? "completed. You can now leave a review" : "confirmed by the business"}.`, relatedBookingId: target.id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    redirect(`/business/bookings/${target.id}`);
  }

  return (
    <>
      {booking.status === "CONFIRMED" && booking.startDate && (booking.endDate ?? booking.startDate) <= new Date() && (
        <form action={respond} className="mb-4"><input type="hidden" name="bookingId" value={booking.id} /><Button name="decision" value="complete" type="submit">Mark service completed</Button></form>
      )}
      <Breadcrumbs items={[{ label: "Bookings", href: "/business/bookings" }, { label: booking.bookingRef }]} />
      {booking.listing.type === "TRANSPORT" && booking.status === "CONFIRMED" && <form action={assignTransfer} className="mb-6 grid gap-3 rounded border p-4 sm:grid-cols-3"><h2 className="font-bold sm:col-span-3">Assign / update transfer driver and vehicle</h2><input type="hidden" name="bookingId" value={booking.id}/>{["driverName","driverPhone","vehicleRegistration"].map(key=><label key={key}>{key.replace(/([a-z])([A-Z])/g,"$1 $2")}<input name={key} required maxLength={key==="driverName"?120:40} defaultValue={String((booking.fulfilment as Record<string,unknown>|null)?.[key]||"")} className="mt-1 w-full rounded border p-2"/></label>)}<p className="text-sm sm:col-span-3">These details are shared with this booking’s customer.</p><Button>Save assignment and notify customer</Button></form>}

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
                    {booking.startDate ? formatBookingDate(booking.startDate, booking.listing.type) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">End</p>
                  <p className="font-semibold">{booking.endDate ? formatBookingDate(booking.endDate, booking.listing.type) : "—"}</p>
                </div>
              </div>

              {booking.roomTypeName || booking.roomType || booking.addOns.length > 0 ? (
                <>
                  <h2 className="mb-2 mt-8 text-lg font-bold">Room &amp; add-ons</h2>
                  <Card>
                    <CardContent className="grid gap-2 pt-6 text-sm">
                      {booking.roomTypeName || booking.roomType ? (
                        <p>
                          <span className="text-muted-foreground">Room: </span>
                          {booking.roomTypeName ?? booking.roomType?.name}
                          {booking.roomType?.bedType ? ` · ${booking.roomType.bedType}` : ""}
                          {booking.roomType?.breakfastIncluded ? " · Breakfast included" : ""}
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

              <BookingTravellerSummary participants={booking.participants}/>
              <BookingOperationsSummary booking={booking} business/>
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

              {paymentHistory.length > 0 ? (
                <>
                  <h2 className="mb-2 mt-8 text-lg font-bold">Payment history</h2>
                  <div className="flex flex-col gap-2">
                    {paymentHistory.map((payment) => (
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
                {booking.status === "PENDING_PAYMENT" && booking.bookingMode === "REQUEST" && <form action={respond}><input type="hidden" name="bookingId" value={booking.id}/><input type="hidden" name="decision" value="decline"/><Button type="submit" variant="outline" className="w-full">Withdraw accepted request</Button></form>}
                {canRespond ? (
                  <>
                    <form action={respond}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="decision" value="confirm" />
                      <Button type="submit" size="lg" className="w-full">
                        {booking.bookingMode === "REQUEST" ? "Accept request — ask customer to pay" : "Confirm booking"}
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
