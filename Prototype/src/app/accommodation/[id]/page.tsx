import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, CalendarX, CheckCircle2, MapPin, ShieldCheck, Users } from "lucide-react";

import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RelatedListings } from "@/components/related-listings";
import { PhotoGallery } from "@/components/rooms/photo-gallery";
import { AccommodationReservationFields } from "@/components/rooms/reservation-fields";
import { RoomPreviewCard } from "@/components/rooms/room-preview-card";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewSummary } from "@/components/reviews/review-summary";
import { ReviewForm } from "@/components/reviews/review-form";
import { SaveButton } from "@/components/save-button";
import { revalidatePath } from "next/cache";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ListingTabs } from "@/components/listing-tabs";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { ScoreBadge } from "@/components/ui/rating";
import { db } from "@/lib/db";
import { findEligibleReviewBooking, findRelatedListings, getRoomTypeAvailability, ratingBreakdown, ratingSummary } from "@/lib/listings";

export default async function AccommodationDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();

  const listing = await db.listing.findUnique({
    where: { id: params.id },
    include: {
      accommodation: { include: { roomTypes: true, addOns: true } },
      destination: true,
      business: { select: { verificationStatus: true } },
      reviews: { where: { status: "PUBLISHED" }, include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } }
    }
  });
  if (
    !listing ||
    listing.type !== "ACCOMMODATION" ||
    !listing.accommodation ||
    listing.status !== "PUBLISHED" ||
    listing.business.verificationStatus !== "APPROVED"
  ) {
    notFound();
  }
  const accommodation = listing.accommodation;

  const { average, count } = ratingSummary(listing.reviews);
  const breakdown = ratingBreakdown(listing.reviews);
  const related = await findRelatedListings("ACCOMMODATION", listing.id);
  const eligibleBooking = session?.user ? await findEligibleReviewBooking(listing.id, session.user.id) : null;
  const availabilityByRoom = await getRoomTypeAvailability(
    accommodation.roomTypes.map((room) => ({ id: room.id, totalRooms: room.totalRooms }))
  );
  
  const savedItem = session?.user
    ? await db.savedItem.findUnique({
        where: { userId_listingId: { userId: session.user.id, listingId: listing.id } }
      })
    : null;

  const mapQuery = listing.latitude && listing.longitude 
    ? `${listing.latitude},${listing.longitude}` 
    : listing.address || listing.city || "Uganda";
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  async function submitDirectReview(formData: FormData) {
    "use server";
    if (!listing) return;
    const activeSession = await auth();
    if (!activeSession?.user) return; // Silent fail if not authed

    const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 0));
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    if (!rating || !body) return;

    const booking = eligibleBooking;
    if (!booking) return;

    await db.review.create({
      data: {
        bookingId: booking.id,
        authorUserId: activeSession.user.id,
        listingId: listing.id,
        businessId: listing.businessId,
        rating,
        title: title || null,
        body
      }
    });

    await db.booking.update({ where: { id: booking.id }, data: { status: "REVIEWED" } });
    revalidatePath(`/accommodation/${listing.id}`);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20 pt-6">
          <Breadcrumbs
            items={[
              { label: "Accommodation", href: "/accommodation" },
              ...(listing.destination ? [{ label: listing.destination.name, href: `/destinations/${listing.destination.slug}` }] : []),
              { label: listing.title }
            ]}
          />

          <PhotoGallery
            images={listing.images.length > 0 ? listing.images : listing.coverImageUrl ? [listing.coverImageUrl] : []}
            title={listing.title}
          />

          <ListingTabs 
            tabs={[
              { id: "overview", label: "Overview" },
              { id: "rooms", label: "Rooms" },
              { id: "amenities", label: "Amenities" },
              { id: "policies", label: "Policies" },
              { id: "reviews", label: "Reviews" }
            ]}
            actionLabel="Select a room"
            actionTargetId="rooms"
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* Left Column: Main Content */}
            <div className="flex min-w-0 flex-col">
              <section id="overview" className="scroll-mt-32">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {accommodation.propertyType}
                    </Badge>
                    <h1 className="text-3xl font-extrabold sm:text-4xl">{listing.title}</h1>
                  </div>
                  <SaveButton
                    listingId={listing.id}
                    initialSaved={Boolean(savedItem)}
                    isSignedIn={Boolean(session?.user)}
                    showLabel
                  />
                </div>
                <p className="mt-1 text-muted-foreground">{listing.city}</p>
                <div className="mt-3">
                  {average ? <ScoreBadge value={average} count={count} /> : <p className="text-sm text-muted-foreground">No reviews yet</p>}
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                    Check-in from {accommodation.checkInTime}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarX className="h-4 w-4 text-muted-foreground" />
                    Check-out by {accommodation.checkOutTime}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Up to {accommodation.maxGuests} guests
                  </div>
                </div>

                <h2 className="mt-10 text-xl font-bold">About this property</h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{listing.description}</p>
                
                <div className="mt-4 flex max-w-fit items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-primary">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Business verified by SafariNexa — publishing and payouts are gated on approved verification.</span>
                </div>
              </section>

              <section id="rooms" className="mt-12 scroll-mt-32 border-t border-border pt-10">
                <h2 className="mb-6 text-2xl font-bold">Rooms</h2>
                <div className="flex flex-col gap-6">
                  {(() => {
                    const minPrice = accommodation.roomTypes.length > 0
                      ? Math.min(...accommodation.roomTypes.map((r) => r.priceMinor))
                      : 0;
                    return accommodation.roomTypes.map((room) => (
                      <RoomPreviewCard
                        key={room.id}
                        room={room}
                        accommodationAmenities={accommodation.amenities}
                        cancellationPolicy={accommodation.cancellationPolicy}
                        isLowestPrice={room.priceMinor === minPrice}
                      />
                    ));
                  })()}
                </div>
              </section>

              <section id="amenities" className="mt-12 scroll-mt-32 border-t border-border pt-10">
                <h2 className="mb-6 text-2xl font-bold">Amenities</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {accommodation.amenities.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <section id="policies" className="mt-12 scroll-mt-32 border-t border-border pt-10">
                <h2 className="mb-6 text-2xl font-bold">Policies</h2>
                <div className="rounded-2xl border border-border p-6 bg-card shadow-sm">
                  <h3 className="font-bold">Cancellation & Payment</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {accommodation.cancellationPolicy || "No special cancellation policies provided. Standard non-refundable terms apply."}
                  </p>
                </div>
              </section>

              <section id="reviews" className="mt-12 scroll-mt-32 border-t border-border pt-10">
                <h2 className="mb-6 text-2xl font-bold">Guest reviews</h2>
                <ReviewSummary average={average} count={count} breakdown={breakdown} />
                
                <div className="mt-10">
                  {session?.user ? (
                    eligibleBooking ? (
                      <div className="rounded-2xl bg-secondary p-6">
                        <h3 className="font-bold mb-4">Add your review</h3>
                        <ReviewForm bookingId={eligibleBooking.id} listingTitle={listing.title} action={submitDirectReview} />
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
                        You can only review places you have booked.
                      </div>
                    )
                  ) : (
                    <div className="rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
                      Please <Link href={`/auth/sign-in?returnTo=/accommodation/${listing.id}`} className="font-semibold text-blue-600 hover:underline">sign in</Link> to leave a review.
                    </div>
                  )}
                </div>

                <div className="mt-10">
                  <ReviewList
                    reviews={listing.reviews.map((review) => ({
                      id: review.id,
                      rating: review.rating,
                      title: review.title,
                      body: review.body,
                      createdAt: review.createdAt,
                      authorName: review.author.name,
                      businessReplyBody: review.businessReplyBody
                    }))}
                  />
                </div>
              </section>
            </div>

            {/* Right Column: Sticky Sidebar with Map & Checkout */}
            <div className="relative">
              <div className="sticky top-[140px] flex flex-col gap-6">
                
                {/* Map Section */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="h-48 w-full bg-muted">
                    <iframe 
                      src={mapSrc} 
                      width="100%" 
                      height="100%" 
                      style={{ border: 0 }} 
                      allowFullScreen 
                      loading="lazy" 
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Accommodation Map Location"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{listing.address || listing.city}</p>
                        <a href={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-xs font-semibold text-blue-600 hover:underline">
                          View in map
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Reservation Fields */}
                <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
                  <AccommodationReservationFields
                    mode="link"
                    listingId={listing.id}
                    listingTitle={listing.title}
                    listingImage={listing.images[0]}
                    basePriceMinor={listing.basePriceMinor}
                    maxGuests={accommodation.maxGuests}
                    roomTypes={accommodation.roomTypes.map((room) => ({
                      id: room.id,
                      name: room.name,
                      description: room.description,
                      images: room.images,
                      priceMinor: room.priceMinor,
                      maxOccupancy: room.maxOccupancy,
                      breakfastIncluded: room.breakfastIncluded,
                      bookedDates: availabilityByRoom[room.id] ?? []
                    }))}
                    addOns={accommodation.addOns}
                    isSignedIn={Boolean(session?.user)}
                    isSaved={session?.user ? Boolean(savedItem) : undefined}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20">
            <RelatedListings heading={`More stays near ${listing.destination?.name ?? listing.city ?? "Uganda"}`} items={related} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
