import { ListingCard } from "@/components/listing-card";
import { PageHero } from "@/components/page-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { Pagination } from "@/components/ui/pagination";
import { db } from "@/lib/db";
import { formatListingPrice, ratingSummary } from "@/lib/listings";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";

export default async function RestaurantsPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = parsePage(searchParams.page);
  const where = { type: "RESTAURANT" as const, status: "PUBLISHED" as const, business: { verificationStatus: "APPROVED" as const } };

  const [listings, totalCount] = await Promise.all([
    db.listing.findMany({
      where,
      include: { restaurant: true, reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } },
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
            eyebrow="Restaurants"
            title="Browse places to eat"
            description="Menus, hours, and restaurant profiles are open to guests. Reserving or requesting a table needs an account."
          />
          <p className="mb-4 text-sm text-muted-foreground">{totalCount} restaurant profiles</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                type="Restaurant"
                title={listing.title}
                location={listing.city ?? ""}
                price={formatListingPrice(listing)}
                description={listing.description}
                rating={ratingSummary(listing.reviews).average}
                imageUrl={listing.coverImageUrl}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPagesFor(totalCount)} buildHref={(p) => `/restaurants?page=${p}`} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
