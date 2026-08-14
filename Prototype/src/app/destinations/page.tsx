import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { db } from "@/lib/db";

export default async function DestinationsPage() {
  const [destinations, listingCounts] = await Promise.all([
    db.destination.findMany({ orderBy: { name: "asc" } }),
    db.listing.groupBy({ by: ["destinationId"], where: { status: "PUBLISHED" }, _count: true })
  ]);

  const countByDestinationId = new Map(listingCounts.map((row) => [row.destinationId, row._count]));

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20">
          <PageHero
            eyebrow="Destinations"
            title="Plan around Uganda highlights"
            description="Destination guides stay open to guests — see accommodation, tours, restaurants, and transport together before you sign up."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((destination) => {
              const count = countByDestinationId.get(destination.id) ?? 0;
              return (
                <Link
                  key={destination.slug}
                  href={`/destinations/${destination.slug}`}
                  className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-card-hover">
                    <div className="relative h-36 overflow-hidden">
                      {destination.heroImageUrl ? (
                        <Image src={destination.heroImageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-brand-green to-[#062617]" />
                      )}
                    </div>
                    <CardContent className="pt-5">
                      <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-primary">
                        <MapPin className="h-3.5 w-3.5" />
                        {destination.region}
                      </p>
                      <h2 className="mt-1 text-lg font-bold">{destination.name}</h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{destination.summary}</p>
                      <p className="mt-3 text-xs font-semibold text-muted-foreground">{count} listings</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
