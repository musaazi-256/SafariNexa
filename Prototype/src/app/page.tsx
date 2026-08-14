import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Lock, MapPin, Wallet } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SearchBar } from "@/components/search-bar";
import { ListingCard } from "@/components/listing-card";
import { CompactListingCard } from "@/components/compact-listing-card";
import { GuideCard } from "@/components/guide-card";
import { HomeSection, ScrollRow } from "@/components/home-section";
import { TripPlannerBanner } from "@/components/trip-planner-banner";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { formatListingPrice, guideRatingSummary, ratingSummary } from "@/lib/listings";
import { protectedActions } from "@/lib/data";

const TRUST_POINTS = [
  { icon: ShieldCheck, title: "Verified businesses only", description: "Every listing belongs to a business that passed SafariNexa's verification review." },
  { icon: Lock, title: "Browse before you sign in", description: "Explore accommodation, safaris, restaurants, and transport freely — accounts are only for booking and paying." },
  { icon: Wallet, title: "Mobile money & card", description: "Pay with MTN Mobile Money, Airtel Money, or card through secure, trusted rails." }
];

const CARD_WIDTH = "w-72 shrink-0 snap-start sm:w-80";

const HERO_IMAGE = "https://images.unsplash.com/photo-1761078206756-68d3023f3021?w=1920&q=80&auto=format&fit=crop";

export default async function HomePage() {
  const [accommodationListings, oneDayTours, guides, restaurantListings, transportListings, destinations, listingCounts] = await Promise.all([
    db.listing.findMany({
      where: { type: "ACCOMMODATION", status: "PUBLISHED", business: { verificationStatus: "APPROVED" } },
      include: {
        reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
        accommodation: { include: { roomTypes: { select: { breakfastIncluded: true } } } }
      },
      take: 6
    }),
    db.listing.findMany({
      where: { type: "TOUR", status: "PUBLISHED", business: { verificationStatus: "APPROVED" }, tour: { durationDays: 1 } },
      include: { reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } },
      take: 6
    }),
    db.guide.findMany({
      include: {
        destination: true,
        business: { select: { verificationStatus: true } },
        tours: { include: { listing: { include: { reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } } } } }
      },
      take: 6
    }),
    db.listing.findMany({
      where: { type: "RESTAURANT", status: "PUBLISHED", business: { verificationStatus: "APPROVED" } },
      include: { restaurant: true, reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } },
      take: 6
    }),
    db.listing.findMany({
      where: { type: "TRANSPORT", status: "PUBLISHED", business: { verificationStatus: "APPROVED" } },
      include: { reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } },
      take: 6
    }),
    db.destination.findMany({ orderBy: { name: "asc" }, take: 5 }),
    db.listing.groupBy({ by: ["destinationId"], where: { status: "PUBLISHED", business: { verificationStatus: "APPROVED" } }, _count: true })
  ]);

  const countByDestinationId = new Map(listingCounts.map((row) => [row.destinationId, row._count]));

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden pb-24 pt-14 text-white sm:pb-28 sm:pt-20">
          <Image src={HERO_IMAGE} alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/70" />
          <Container className="relative">
            <Badge variant="accent" className="mb-4">
              See it all first
            </Badge>
            <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
              See it all first. Book only when <span className="text-accent">you&apos;re ready</span>.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
              Browse verified stays, restaurants, and rides across Uganda. Compare freely — you only need an account
              when you&apos;re ready to book.
            </p>
          </Container>
        </section>

        <Container className="relative z-10 -mt-16 sm:-mt-20">
          <SearchBar />
        </Container>

        <Container className="pt-14">
          <HomeSection title="Stay at our top accommodations" description="Well curated stays for you — all costs included." moreHref="/accommodation">
            <ScrollRow>
              {accommodationListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  type="Accommodation"
                  title={listing.title}
                  location={listing.city ?? ""}
                  price={`${formatListingPrice(listing)} / night`}
                  description={listing.description}
                  rating={ratingSummary(listing.reviews).average}
                  imageUrl={listing.coverImageUrl}
                  featureBadge={listing.accommodation?.roomTypes.some((room) => room.breakfastIncluded) ? "Breakfast included" : undefined}
                  showWishlist
                  className={CARD_WIDTH}
                />
              ))}
            </ScrollRow>
          </HomeSection>
        </Container>

        <section className="border-y border-border bg-card py-12">
          <Container>
            <div className="grid gap-8 sm:grid-cols-3">
              {TRUST_POINTS.map((point) => (
                <div key={point.title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <point.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-bold">{point.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <Container>
          <section className="py-10">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-secondary-foreground sm:text-3xl">Explore Popular Destinations</h2>
              <p className="mx-auto mt-1.5 max-w-xl text-sm text-muted-foreground sm:text-base">
                Uganda&apos;s top national parks, lakes, and cities — see what&apos;s nearby before you decide where to go.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <Link href="/destinations" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                More details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {destinations.map((destination, index) => (
                  <Link
                    key={destination.slug}
                    href={`/destinations/${destination.slug}`}
                    className={`group relative block h-40 overflow-hidden rounded-xl sm:h-44 ${index === 3 ? "col-span-2" : ""}`}
                  >
                    {destination.heroImageUrl ? (
                      <Image
                        src={destination.heroImageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-brand-green to-[#062617]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                      <p className="flex items-center gap-1 font-bold">
                        <MapPin className="h-3.5 w-3.5" />
                        {destination.name}
                      </p>
                      <p className="text-xs text-white/85">{countByDestinationId.get(destination.id) ?? 0} listings</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <HomeSection title="One Day Tours" description="Well curated trips for you — all costs included." moreHref="/tours">
            <ScrollRow>
              {oneDayTours.map((tour) => (
                <CompactListingCard
                  key={tour.id}
                  id={tour.id}
                  type="Tour"
                  title={tour.title}
                  price={formatListingPrice(tour)}
                  imageUrl={tour.coverImageUrl}
                />
              ))}
            </ScrollRow>
          </HomeSection>

          <HomeSection title="Meet your tour guides" description="Licensed, verified guides ready to lead your next trip." moreHref="/guides">
            <ScrollRow>
              {guides.map((guide) => {
                const { average, count } = guideRatingSummary(guide.tours);
                return (
                  <GuideCard
                    key={guide.id}
                    id={guide.id}
                    name={guide.name}
                    photoUrl={guide.photoUrl}
                    bio={guide.bio}
                    location={guide.destination?.name}
                    isTopGuide={guide.isTopGuide}
                    isVerified={guide.business.verificationStatus === "APPROVED"}
                    rating={average}
                    reviewCount={count}
                    availabilityNote={guide.availabilityNote}
                    hourlyRateMinor={guide.hourlyRateMinor}
                  />
                );
              })}
            </ScrollRow>
          </HomeSection>

          <HomeSection title="Where to eat" description="Reserve a table at a verified restaurant near you." moreHref="/restaurants">
            <ScrollRow>
              {restaurantListings.map((restaurant) => (
                <ListingCard
                  key={restaurant.id}
                  id={restaurant.id}
                  type="Restaurant"
                  title={restaurant.title}
                  location={restaurant.city ?? ""}
                  price={formatListingPrice(restaurant)}
                  description={restaurant.description}
                  rating={ratingSummary(restaurant.reviews).average}
                  imageUrl={restaurant.coverImageUrl}
                  className={CARD_WIDTH}
                />
              ))}
            </ScrollRow>
          </HomeSection>

          <HomeSection title="Get around" description="Airport transfers and special hire, ready when you land." moreHref="/transport">
            <ScrollRow>
              {transportListings.map((option) => (
                <ListingCard
                  key={option.id}
                  id={option.id}
                  type="Transport"
                  title={option.title}
                  location={option.city ?? ""}
                  price={formatListingPrice(option)}
                  description={option.description}
                  rating={ratingSummary(option.reviews).average}
                  imageUrl={option.coverImageUrl}
                  className={CARD_WIDTH}
                />
              ))}
            </ScrollRow>
          </HomeSection>

          <div className="py-4">
            <TripPlannerBanner />
          </div>

          <section className="py-14">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-7 sm:p-9">
              <h2 className="text-xl font-bold">Protected actions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These actions ask for an account and resume exactly where you left off:
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {protectedActions.map((action) => (
                  <Badge key={action} variant="outline">
                    {action}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
