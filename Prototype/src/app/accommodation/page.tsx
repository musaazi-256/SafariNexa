import { ListingCard } from "@/components/listing-card";
import { PageHero } from "@/components/page-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { formatListingPrice, ratingSummary } from "@/lib/listings";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";

export default async function AccommodationPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parsePage(searchParams.page);
  const where = { type: "ACCOMMODATION" as const, status: "PUBLISHED" as const, business: { verificationStatus: "APPROVED" as const } };

  const [listings, totalCount] = await Promise.all([
    db.listing.findMany({
      where,
      include: {
        reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
        accommodation: { include: { roomTypes: { select: { breakfastIncluded: true } } } }
      },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.listing.count({ where })
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20">
          <PageHero
            eyebrow="Accommodation"
            title="Find verified stays"
            description="Browse lodges, boutique hotels, and tented camps as a guest. Booking starts the protected authentication flow — search and comparison stay open."
          />
          <p className="mb-4 text-sm text-muted-foreground">{totalCount} verified stays</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                type="Accommodation"
                title={listing.title}
                location={listing.city ?? ""}
                price={formatListingPrice(listing)}
                description={listing.description}
                rating={ratingSummary(listing.reviews).average}
                imageUrl={listing.coverImageUrl}
                featureBadge={listing.accommodation?.roomTypes.some((room) => room.breakfastIncluded) ? "Breakfast included" : undefined}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPagesFor(totalCount)} buildHref={(p) => `/accommodation?page=${p}`} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
