import { PageHeader } from "@/components/page-header";
import { BookingPaymentManagement } from "@/components/business/booking-payment-management";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
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
import { CancellationNote } from "@/components/cancellation-note";
import { formatUGX, formatBookingDate } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { cancelReservedBooking, syncOrderStatus, acceptBookingRequest } from "@/lib/booking-lifecycle";
import { Prisma } from "@prisma/client";
import { toBookingStatus } from "@/lib/status";
import { BookingChat } from "@/components/booking-chat";

export default async function BusinessBookingDetailPage({ params, searchParams }: { params: { id: string }; searchParams?: { error?: string } }) {
  const { business, businessId, session: businessSession } = await requireBusinessSession();
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
  const manager = await db.businessUser.findFirst({where:{businessId,userId:businessSession.user.id,role:{in:["OWNER","MANAGER"]}}});
  const canManage = !!manager;
  const canRespond = canManage && booking.status === "AWAITING_BUSINESS_CONFIRMATION";
  // A request past its response deadline can't be accepted (the expiry job cancels it); it can still be declined.
  const requestExpired = booking.status === "AWAITING_BUSINESS_CONFIRMATION" && !!booking.responseDueAt && booking.responseDueAt <= new Date();

  async function respond(formData: FormData) {
    "use server";
    const {session: activeSession,businessId: activeBusinessId} = await requireBusinessSession();
    if (!activeSession?.user) redirect("/business/auth/sign-in");

    const bookingId = String(formData.get("bookingId"));
    const decision = String(formData.get("decision"));

    const target = await db.booking.findUnique({ where: { id: bookingId }, include: { listing: true } });
    if (!target || target.businessId !== activeBusinessId) throw new Error("Booking not found.");
    if (!["AWAITING_BUSINESS_CONFIRMATION", "CONFIRMED", "PENDING_PAYMENT", "PAYMENT_FAILED"].includes(target.status)) return;

    if (!["confirm", "decline", "complete"].includes(decision)) throw new Error("Invalid decision.");
    let problem: string | undefined;
    try { await db.$transaction(async tx => {
      const member = await tx.businessUser.findFirst({ where: { businessId: target.businessId, userId: activeSession.user.id, role: { in: ["OWNER", "MANAGER"] } } });
      if (!member) throw new Error("Only owners and managers can manage bookings.");
      await tx.auditLog.create({data:{actorUserId:activeSession.user.id,surface:"BUSINESS",action:"business_booking_response",outcome:"SUCCESS",metadata:{bookingId:target.id,decision}}});
      if (decision === "decline") {
        await cancelReservedBooking(tx, target.id, activeSession.user.id, "business");
        return;
      }
      if (decision === "confirm") { await acceptBookingRequest(tx,target.id,activeSession.user.id); return; }
      if (decision === "complete" && target.totalMinor > 0 && !await tx.payment.findFirst({where:{OR:[{bookingId:target.id},...(target.orderId?[{orderId:target.orderId}]:[])],status:{in:["SUCCESSFUL","PARTIALLY_REFUNDED"]},amountMinor:{gte:target.totalMinor}}})) throw new Error("Cannot complete a booking without confirmed payment.");
      const expected = decision === "complete" ? "CONFIRMED" : "AWAITING_BUSINESS_CONFIRMATION";
      if (decision === "complete" && (!target.startDate || (target.endDate ?? target.startDate) > new Date())) throw new Error("Bookings can only be completed after the service date.");
      const updated = await tx.booking.updateMany({ where: { id: target.id, status: expected }, data: decision === "complete" ? { status: "COMPLETED", completedAt: new Date() } : { status: "CONFIRMED", confirmedAt: new Date() } });
      if (!updated.count) return;
      await syncOrderStatus(tx, target.orderId);
      await tx.notification.create({ data: { userId: target.customerId, type: decision === "complete" ? "REVIEW_PROMPT" : "BOOKING_UPDATE", title: decision === "complete" ? "How was your experience?" : "Booking confirmed", body: `Booking ${target.bookingRef} has been ${decision === "complete" ? "completed. You can now leave a review" : "confirmed by the business"}.`, relatedBookingId: target.id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); } catch (error) {
      // Show the reason on the booking (e.g. the request expired while the page was open) instead of an error page.
      problem = error instanceof Error ? error.message : "The booking could not be updated. Refresh and try again.";
    }

    redirect(`/business/bookings/${target.id}${problem ? `?error=${encodeURIComponent(problem.slice(0, 200))}` : ""}`);
  }

  return (
    <>
      {canManage && booking.status === "CONFIRMED" && booking.startDate && (booking.endDate ?? booking.startDate) <= new Date() && (
        <form action={respond} className="mb-4"><input type="hidden" name="bookingId" value={booking.id} /><Button name="decision" value="complete" type="submit">Mark service completed</Button></form>
      )}
      <Breadcrumbs items={[{ label: "Bookings", href: "/business/bookings" }, { label: booking.bookingRef }]} />
      {canManage && booking.listing.type === "TRANSPORT" && booking.status === "CONFIRMED" && <form action={assignTransfer} className="mb-6 grid gap-3 rounded border p-4 sm:grid-cols-3"><h2 className="font-semibold sm:col-span-3">Assign / update transfer driver and vehicle</h2><input type="hidden" name="bookingId" value={booking.id}/>{["driverName","driverPhone","vehicleRegistration"].map(key=><label key={key}>{key.replace(/([a-z])([A-Z])/g,"$1 $2")}<input name={key} required maxLength={key==="driverName"?120:40} defaultValue={String((booking.fulfilment as Record<string,unknown>|null)?.[key]||"")} className="form-control mt-1 w-full"/></label>)}<p className="text-sm sm:col-span-3 leading-relaxed">These details are shared with this booking’s customer.</p><Button>Save assignment and notify customer</Button></form>}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <BookingStatusBadge status={toBookingStatus(booking.status)} perspective="staff" />
              <CancellationNote booking={booking} />
              <PageHeader title={<>{booking.listing.title}</>} description={<>Booking {booking.bookingRef}</>} />

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Participants</p>
                  <p className="font-semibold">{booking.participantsCount}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Start</p>
                  <p className="font-semibold">
                    {booking.startDate ? formatBookingDate(booking.startDate, booking.listing.type) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">End</p>
                  <p className="font-semibold">{booking.endDate ? formatBookingDate(booking.endDate, booking.listing.type) : "—"}</p>
                </div>
              </div>

              {booking.roomTypeName || booking.roomType || booking.addOns.length > 0 ? (
                <>
                  <h2 className="mb-2 mt-8 text-lg font-semibold">Room &amp; add-ons</h2>
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
              <h2 className="mb-2 mt-8 text-lg font-semibold">Customer</h2>
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

              <div className="mt-6"><BookingPaymentManagement bookingId={booking.id} surface="BUSINESS" canManage={canManage}/></div>

              {/* Customer Messages & Inquiries attached to this booking */}
              <BookingChat
                bookingId={booking.id}
                initialMessages={chatMessages}
                currentUserId={session?.user?.id ?? ""}
                businessName={booking.customer.name ?? "Customer"}
                recipientId={booking.customerId}
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
                {canManage && ["PENDING_PAYMENT","PAYMENT_FAILED"].includes(booking.status) && <form action={respond}><input type="hidden" name="bookingId" value={booking.id}/><input type="hidden" name="decision" value="decline"/><Button type="submit" variant="outline" className="w-full">Cancel unpaid booking</Button></form>}
                {canManage && booking.status === "CONFIRMED" && <form action={respond}><input type="hidden" name="bookingId" value={booking.id}/><ConfirmSubmit name="decision" value="decline" title="Cancel this booking?" description="The customer will be notified. If paid, a refund request will be created for you to review." confirmLabel="Cancel booking" trigger={<Button variant="destructive" className="w-full">Cancel booking</Button>}/></form>}
                {searchParams?.error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{searchParams.error}</p>}
                {canRespond && requestExpired && <p className="rounded-lg border bg-secondary/40 p-3 text-sm text-muted-foreground">The response deadline passed on {booking.responseDueAt!.toLocaleString("en-GB", { timeZone: "Africa/Kampala", dateStyle: "medium", timeStyle: "short" })} EAT, so this request can no longer be accepted. It will be cancelled automatically; decline it to release the dates now.</p>}
                {canRespond ? (
                  <>
                    {!requestExpired && <form action={respond}>
                      <input type="hidden" name="bookingId" value={booking.id} />
                      <input type="hidden" name="decision" value="confirm" />
                      <Button type="submit" size="lg" className="w-full">
                        {booking.bookingMode === "REQUEST" ? "Accept request — ask customer to pay" : "Confirm booking"}
                      </Button>
                    </form>}
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
