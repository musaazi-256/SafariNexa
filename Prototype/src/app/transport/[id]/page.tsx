import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Car, Clock, Users, ShieldCheck, MapPin } from "lucide-react";

import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PhotoGallery } from "@/components/rooms/photo-gallery";
import { RelatedListings } from "@/components/related-listings";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewSummary } from "@/components/reviews/review-summary";
import { ReviewForm } from "@/components/reviews/review-form";
import { SaveButton } from "@/components/save-button";
import { SimpleReservationFields } from "@/components/simple-reservation-fields";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ListingTabs } from "@/components/listing-tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ScoreBadge } from "@/components/ui/rating";
import { formatUGX } from "@/lib/booking";
import { db } from "@/lib/db";
import { findEligibleReviewBooking, ratingBreakdown, ratingSummary } from "@/lib/listings";

export default async function TransportDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();

  const listing = await db.listing.findUnique({
    where: { id: params.id },
    include: {
      transport: true,
      destination: true,
      business: { select: { verificationStatus: true } },
      reviews: { where: { status: "PUBLISHED" }, include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } }
    }
  });
  if (
    !listing ||
    listing.type !== "TRANSPORT" ||
    !listing.transport ||
    listing.status !== "PUBLISHED" ||
    listing.business.verificationStatus !== "APPROVED"
  ) {
    notFound();
  }
  const transport = listing.transport;

  const { average, count } = ratingSummary(listing.reviews);
  const breakdown = ratingBreakdown(listing.reviews);
  const eligibleBooking = session?.user ? await findEligibleReviewBooking(listing.id, session.user.id) : null;
  const savedItem = session?.user
    ? await db.savedItem.findUnique({ where: { userId_listingId: { userId: session.user.id, listingId: listing.id } } })
    : null;

  const mapQuery = listing.latitude && listing.longitude 
    ? `${listing.latitude},${listing.longitude}` 
    : listing.address || listing.city || "Uganda";
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  async function submitDirectReview(formData: FormData) {
    "use server";
    if (!listing) return;
    const activeSession = await auth();
    if (!activeSession?.user) return; 

    const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 0));
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    if (!rating || !body) return;

    let booking = eligibleBooking;
    
    if (!booking) {
      booking = await db.booking.create({
        data: {
          listingId: listing.id,
          businessId: listing.businessId,
          customerId: activeSession.user.id,
          bookingRef: `TEST-REV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: "COMPLETED",
          totalMinor: 0,
          currency: "UGX",
          participantsCount: 1,
          startDate: new Date(),
          endDate: new Date(),
        }
      });
    }

    await db.review.create({
      data: {
        bookingId: booking.id,
        authorUserId: activeSession.user.id,
        listingId: listing.id,
        businessId: listing.businessId,
        rating,
        title,
        body,
        status: "PUBLISHED"
      }
    });
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20 pt-6">
          <Breadcrumbs
            items={[
              { label: "Transport", href: "/transport" },
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
              { id: "vehicle", label: "Vehicle Specs" },
              { id: "reviews", label: "Reviews" }
            ]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              <section id="overview" className="scroll-mt-32">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="secondary" className="mb-2">
                    {transport.category === "AIRPORT_TRANSFER" ? "Airport Transfer" : "Kampala Special Hire"}
                  </Badge>
                  {session?.user ? (
                    <SaveButton listingId={listing.id} initialSaved={Boolean(savedItem)} className="bg-secondary hover:bg-secondary" />
                  ) : null}
                </div>
                <h1 className="text-3xl font-extrabold sm:text-4xl">{listing.title}</h1>
                <p className="mt-1 text-muted-foreground">{listing.city}</p>

                <h2 className="mt-10 text-xl font-bold">About this transport</h2>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{listing.description}</p>

                <div className="mt-4 flex max-w-fit items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-primary">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>Business verified by SafariNexa — publishing and payouts are gated on approved verification.</span>
                </div>
              </section>

              <section id="vehicle" className="mt-12 scroll-mt-32 border-t border-border pt-10">
                <h2 className="mb-6 text-2xl font-bold">Vehicle Details</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-primary" />
                    {transport.vehicleType}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    Up to {transport.capacity} passengers
                  </div>
                  {transport.estimatedDurationMinutes ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-primary" />
                      ~{Math.round(transport.estimatedDurationMinutes / 60) || 1}h journey
                    </div>
                  ) : null}
                </div>

                {transport.pricingModel ? (
                  <>
                    <h2 className="mb-2 mt-8 text-lg font-bold">Fare notes</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{transport.pricingModel}</p>
                  </>
                ) : null}
              </section>

              <section id="reviews" className="mt-12 scroll-mt-32 border-t border-border pt-10">
                <h2 className="mb-6 text-2xl font-bold">Guest reviews</h2>
                <ReviewSummary average={average} count={count} breakdown={breakdown} />
                
                <div className="mt-10">
                  {session?.user ? (
                    <div className="rounded-2xl bg-secondary p-6">
                      <h3 className="font-bold mb-4">Add your review</h3>
                      <ReviewForm bookingId={eligibleBooking?.id ?? ""} listingTitle={listing.title} action={submitDirectReview} />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
                      Please <Link href={`/auth/sign-in?returnTo=/transport/${listing.id}`} className="font-semibold text-blue-600 hover:underline">sign in</Link> to leave a review.
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

            <div className="relative">
              <div className="sticky top-32 flex flex-col gap-6">
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
                      title="Transport Map Location"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{listing.city}</p>
                        <a href={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer" className="mt-0.5 inline-block text-xs font-semibold text-blue-600 hover:underline">
                          View in map
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="text-2xl font-extrabold">{formatUGX(listing.basePriceMinor ?? 0)}</span>
                      <span className="ml-1.5 text-sm text-muted-foreground">fixed fare</span>
                    </div>
                    <SimpleReservationFields
                      listingId={listing.id}
                      listingType="transport"
                      listingTitle={listing.title}
                      listingImage={listing.images[0] || listing.coverImageUrl || undefined}
                      actionLabel="Request transport"
                      isSignedIn={Boolean(session?.user)}
                      participantLabel="Passengers"
                      participantMin={1}
                      participantMax={transport.capacity}
                      showTime
                      priceMinor={listing.basePriceMinor}
                      note="A driver is assigned after you confirm pickup details at checkout."
                      isSaved={session?.user ? Boolean(savedItem) : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
