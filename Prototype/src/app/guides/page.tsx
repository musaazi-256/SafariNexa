import { GuideCard } from "@/components/guide-card";
import { HomeSection, ScrollRow } from "@/components/home-section";
import { ListingCard } from "@/components/listing-card";
import { PageHero } from "@/components/page-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TripPlannerBanner } from "@/components/trip-planner-banner";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { formatListingPrice, guideRatingSummary, ratingSummary } from "@/lib/listings";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";

export default async function GuidesPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const query = searchParams.q?.trim();
  const page = parsePage(searchParams.page);
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { bio: { contains: query, mode: "insensitive" as const } },
          { destination: { name: { contains: query, mode: "insensitive" as const } } }
        ]
      }
    : undefined;

  const [guides, guideCount, transportListings] = await Promise.all([
    db.guide.findMany({
      where,
      include: {
        destination: true,
        business: { select: { verificationStatus: true } },
        tours: { include: { listing: { include: { reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } } } } }
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.guide.count({ where }),
    db.listing.findMany({
      where: { type: "TRANSPORT", status: "PUBLISHED" },
      include: { reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } },
      take: 4
    })
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20">
          <PageHero
            eyebrow="Tours & Safaris"
            title="Book verified experiences"
            description="Compare safari itineraries, chimp treks, and city tours — every listing includes a named, verified guide."
          />

          {query && guides.length === 0 ? (
            <EmptyState title="No guides found" description={`Nothing matches "${query}" — try a different destination.`} />
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPagesFor(guideCount)}
            buildHref={(p) => `/guides?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(p) }).toString()}`}
          />

          <HomeSection title="Get around" description="Airport transfers and special hire, ready when you land." moreHref="/transport">
            <ScrollRow>
              {transportListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  type="Transport"
                  title={listing.title}
                  location={listing.city ?? ""}
                  price={formatListingPrice(listing)}
                  description={listing.description}
                  rating={ratingSummary(listing.reviews).average}
                  imageUrl={listing.coverImageUrl}
                  className="w-72 shrink-0 snap-start sm:w-80"
                />
              ))}
            </ScrollRow>
          </HomeSection>

          <div className="py-4">
            <TripPlannerBanner />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
