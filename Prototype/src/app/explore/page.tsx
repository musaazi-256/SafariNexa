import Link from "next/link";
import { Building2, Car, Compass, MapPin, UtensilsCrossed } from "lucide-react";

import { ListingCard } from "@/components/listing-card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/page-hero";
import { db } from "@/lib/db";
import { LISTING_TYPE_TO_SERVICE_TYPE, SERVICE_TYPE_TO_LISTING_TYPE, type ServiceType } from "@/lib/listing-types";
import { formatListingPrice, ratingSummary } from "@/lib/listings";

const CATEGORIES: Array<{ type: ServiceType; label: string; href: string; icon: React.ComponentType<{ className?: string }> }> = [
  { type: "Accommodation", label: "Accommodation", href: "/accommodation", icon: Building2 },
  { type: "Tour", label: "Tours & safaris", href: "/tours", icon: Compass },
  { type: "Restaurant", label: "Restaurants", href: "/restaurants", icon: UtensilsCrossed },
  { type: "Transport", label: "Transport", href: "/transport", icon: Car }
];

export default async function ExplorePage() {
  const visibleWhere = { status: "PUBLISHED" as const, business: { verificationStatus: "APPROVED" as const } };

  const [listings, destinations, listingCounts] = await Promise.all([
    db.listing.findMany({
      where: visibleWhere,
      include: { restaurant: true, reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } },
      orderBy: { createdAt: "asc" },
      take: 6
    }),
    db.destination.findMany({ orderBy: { name: "asc" } }),
    db.listing.groupBy({ by: ["type"], where: visibleWhere, _count: true })
  ]);

  const countByType = new Map(listingCounts.map((row) => [row.type, row._count]));

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20">
          <PageHero
            eyebrow="Explore"
            title="Explore SafariNexa"
            description="Guest browsing is open across every category. Booking, saving, paying, messaging, reviewing, and trip management require an account."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((category) => {
              const count = countByType.get(SERVICE_TYPE_TO_LISTING_TYPE[category.type]) ?? 0;
              return (
                <Link key={category.type} href={category.href}>
                  <Card className="h-full transition-shadow hover:shadow-card-hover">
                    <CardContent className="flex flex-col gap-2 pt-6">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <category.icon className="h-5 w-5" />
                      </span>
                      <p className="font-bold">{category.label}</p>
                      <p className="text-sm text-muted-foreground">{count} listings</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-extrabold">Popular right now</h2>
            <Link href="/search" className="text-sm font-semibold text-primary hover:underline">
              Open full search
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                type={LISTING_TYPE_TO_SERVICE_TYPE[listing.type]}
                title={listing.title}
                location={listing.city ?? ""}
                price={formatListingPrice(listing)}
                description={listing.description}
                rating={ratingSummary(listing.reviews).average}
                imageUrl={listing.coverImageUrl}
              />
            ))}
          </div>

          <div className="mt-12 mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-extrabold">Browse by destination</h2>
            <Link href="/destinations" className="text-sm font-semibold text-primary hover:underline">
              All destinations
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {destinations.map((destination) => (
              <Link key={destination.slug} href={`/destinations/${destination.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-card-hover">
                  <CardContent className="flex flex-col gap-1.5 pt-6">
                    <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-primary">
                      <MapPin className="h-3.5 w-3.5" />
                      {destination.region}
                    </p>
                    <p className="font-bold">{destination.name}</p>
                    <p className="text-sm text-muted-foreground">{destination.summary}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
