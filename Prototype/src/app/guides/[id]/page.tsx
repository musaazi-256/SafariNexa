import { notFound } from "next/navigation";
import { Car, Languages, Medal, Star } from "lucide-react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { ListingCard } from "@/components/listing-card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { formatUGX } from "@/lib/booking";
import { db } from "@/lib/db";
import { formatListingPrice, guideRatingSummary, ratingSummary } from "@/lib/listings";

export default async function GuideDetailPage({ params }: { params: { id: string } }) {
  const guide = await db.guide.findUnique({
    where: { id: params.id },
    include: {
      destination: true,
      business: { select: { verificationStatus: true } },
      tours: { include: { listing: { include: { reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } } } } }
    }
  });
  if (!guide) notFound();

  const { average: rating, count: reviewCount } = guideRatingSummary(guide.tours);
  const isVerified = guide.business.verificationStatus === "APPROVED";

  const initials = guide.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const tours = guide.tours
    .filter((tour) => tour.listing.status === "PUBLISHED")
    .map((tour) => ({
      id: tour.listing.id,
      title: tour.listing.title,
      location: tour.listing.city ?? "",
      description: tour.listing.description,
      price: formatListingPrice(tour.listing),
      rating: ratingSummary(tour.listing.reviews).average,
      imageUrl: tour.listing.coverImageUrl
    }));

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20 pt-6">
          <Breadcrumbs items={[{ label: "Guides", href: "/guides" }, { label: guide.name }]} />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 shrink-0">
              {guide.photoUrl ? <AvatarImage src={guide.photoUrl} alt={guide.name} /> : null}
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-extrabold sm:text-4xl">{guide.name}</h1>
                {guide.isTopGuide ? <Badge variant="accent">Top guide</Badge> : null}
                {isVerified ? <Badge variant="success-soft">Verified</Badge> : null}
              </div>
              {guide.destination ? <p className="mt-1 text-muted-foreground">Based near {guide.destination.name}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                {rating ? (
                  <span className="flex items-center gap-1 font-semibold">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    {rating.toFixed(1)} ({reviewCount})
                  </span>
                ) : null}
                {guide.availabilityNote ? <span className="font-semibold text-success">{guide.availabilityNote}</span> : null}
                {guide.hourlyRateMinor ? <strong>{formatUGX(guide.hourlyRateMinor)} / hour</strong> : null}
              </div>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{guide.bio}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="gap-1">
                  <Medal className="h-3.5 w-3.5" />
                  {guide.experienceYears} years guiding
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  {guide.languages.join(", ")}
                </Badge>
                <Badge variant="outline">
                  {guide.specialization === "DESTINATION_SPECIALIST" ? "Destination specialist" : "General guide"}
                </Badge>
                {guide.hasOwnVehicle ? (
                  <Badge variant="secondary" className="gap-1">
                    <Car className="h-3.5 w-3.5" />
                    Brings own vehicle
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          <section className="mt-12">
            <h2 className="mb-4 text-xl font-bold">Trips with {guide.name}</h2>
            {tours.length === 0 ? (
              <EmptyState title="No published trips yet" description="This guide doesn't have any published tours right now." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tours.map((tour) => (
                  <ListingCard key={tour.id} {...tour} type="Tour" />
                ))}
              </div>
            )}
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
