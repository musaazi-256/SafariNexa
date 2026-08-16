import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateBookingRef, nightsBetween, parseFirstUgxAmount } from "@/lib/booking";
import { validateAndReserveBookings } from "@/lib/booking-service";
import { AccommodationReservationFields } from "@/components/rooms/reservation-fields";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const TYPE_LABELS: Record<string, { detailPath: string; noun: string; participantLabel: string }> = {
  accommodation: { detailPath: "accommodation", noun: "stay", participantLabel: "Guests" },
  tour: { detailPath: "tours", noun: "tour", participantLabel: "Travellers" },
  restaurant: { detailPath: "restaurants", noun: "reservation", participantLabel: "Party size" },
  transport: { detailPath: "transport", noun: "transport request", participantLabel: "Passengers" }
};

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: {
    listingId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    date?: string;
    time?: string;
    participants?: string;
    roomTypeId?: string;
    addOnIds?: string | string[];
  };
}) {
  const session = await auth();
  const listingId = searchParams.listingId;
  const type = searchParams.type ?? "";
  const meta = TYPE_LABELS[type];

  if (!listingId || !meta) notFound();

  if (!session?.user) {
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/checkout?listingId=${listingId}&type=${type}`)}`);
  }

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: {
      accommodation: { include: { roomTypes: true, addOns: true } },
      tour: true,
      restaurant: true,
      transport: true,
      destination: true,
      business: true
    }
  });
  if (!listing) notFound();

  const unitPriceMinor =
    listing.basePriceMinor > 0 ? listing.basePriceMinor : parseFirstUgxAmount(listing.restaurant?.priceRange ?? "0");

  const initialAddOnIds = Array.isArray(searchParams.addOnIds)
    ? searchParams.addOnIds
    : searchParams.addOnIds
      ? [searchParams.addOnIds]
      : [];
  const tourParticipants = Math.max(1, Number(searchParams.participants) || 2);

  async function createBooking(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in");

    const submittedListingId = formData.get("listingId") as string;
    const submittedType = String(formData.get("type")).toUpperCase();
    
    const participantsCount = Math.max(1, Number(formData.get("participants")) || 1);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    const { bookings } = await validateAndReserveBookings(
      activeSession.user.id,
      [{
        id: "single-item",
        listingId: submittedListingId,
        type: submittedType.toLowerCase(),
        title: "", // Ignored on backend
        startDate: formData.get("startDate") ? String(formData.get("startDate")) : formData.get("date") ? String(formData.get("date")) : undefined,
        endDate: formData.get("endDate") ? String(formData.get("endDate")) : undefined,
        time: formData.get("time") ? String(formData.get("time")) : undefined,
        participants: participantsCount,
        roomTypeId: formData.get("roomTypeId") ? String(formData.get("roomTypeId")) : undefined,
        addOnIds: formData.getAll("addOnIds").map(String),
        totalMinor: 0 // Ignored on backend
      }],
      { fullName, email, phone },
      false // No order
    );

    redirect(`/payments?bookingId=${bookings[0].id}`);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20 pt-6">
          <Breadcrumbs
            items={[
              { label: meta.detailPath[0].toUpperCase() + meta.detailPath.slice(1), href: `/${meta.detailPath}` },
              { label: listing.title, href: `/${meta.detailPath}/${listing.id}` },
              { label: "Checkout" }
            ]}
          />

          <h1 className="mb-6 text-3xl font-extrabold">Checkout</h1>

          <form action={createBooking} className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <input type="hidden" name="listingId" value={listing.id} />
            <input type="hidden" name="type" value={type} />

            <div className="flex flex-col gap-6">
              {type === "accommodation" && listing.accommodation ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Room &amp; dates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AccommodationReservationFields
                      mode="form"
                      listingId={listing.id}
                      listingTitle={listing.title}
                      listingImage={listing.coverImageUrl ?? undefined}
                      basePriceMinor={listing.basePriceMinor}
                      maxGuests={listing.accommodation.maxGuests}
                      roomTypes={listing.accommodation.roomTypes.map((room) => ({
                        id: room.id,
                        name: room.name,
                        description: room.description,
                        images: room.images,
                        priceMinor: room.priceMinor,
                        maxOccupancy: room.maxOccupancy,
                        breakfastIncluded: room.breakfastIncluded,
                        bookedDates: []
                      }))}
                      addOns={listing.accommodation.addOns}
                      initial={{
                        startDate: searchParams.startDate,
                        endDate: searchParams.endDate,
                        participants: searchParams.participants ?? "2",
                        roomTypeId: searchParams.roomTypeId,
                        addOnIds: initialAddOnIds
                      }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{type === "tour" ? "Tour date" : "Date & time"}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    {type === "tour" ? (
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <Label htmlFor="date">Tour date</Label>
                        <Input id="date" name="date" type="date" defaultValue={searchParams.date} required />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="date">Date</Label>
                          <Input id="date" name="date" type="date" defaultValue={searchParams.date} required />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor="time">Time</Label>
                          <Input id="time" name="time" type="time" defaultValue={searchParams.time} required />
                        </div>
                      </>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="participants">{meta.participantLabel}</Label>
                      <Input
                        id="participants"
                        name="participants"
                        type="number"
                        min={1}
                        max={20}
                        defaultValue={searchParams.participants ?? "2"}
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Traveller details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" name="fullName" defaultValue={session.user.name ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={session.user.email ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+256 7XX XXX XXX" required />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="sticky top-24 h-fit">
              <CardHeader>
                <CardTitle>Booking summary</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <p className="font-bold">{listing.title}</p>
                  <p className="text-sm text-muted-foreground">{listing.city}</p>
                </div>
                <Separator />
                {type === "accommodation" ? (
                  <p className="text-xs text-muted-foreground">See the room, add-on and total breakdown to the left.</p>
                ) : type === "tour" ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      UGX {unitPriceMinor.toLocaleString("en-UG")} × {tourParticipants}
                    </span>
                    <span className="font-semibold">UGX {(unitPriceMinor * tourParticipants).toLocaleString("en-UG")}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-semibold">UGX {unitPriceMinor.toLocaleString("en-UG")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Final total is calculated from your {meta.participantLabel.toLowerCase()} on the next step.
                    </p>
                  </>
                )}
                <Separator />
                <Button type="submit" size="lg" className="w-full">
                  Continue to payment
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Booked by {session.user.name ?? session.user.email}
                </p>
              </CardContent>
            </Card>
          </form>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
