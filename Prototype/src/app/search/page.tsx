import { Suspense } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

import { EmptyState } from "@/components/ui/empty-state";
import { ListingRow } from "@/components/listing-row";
import { SearchBar } from "@/components/search-bar";
import { SearchFilters } from "@/components/search-filters";
import { MobileFilters } from "@/components/mobile-filters";
import { SortSelect } from "@/components/sort-select";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Pagination } from "@/components/ui/pagination";
import { parseFirstUgxAmount, formatUGX } from "@/lib/booking";
import { db } from "@/lib/db";
import { LISTING_TYPE_TO_SERVICE_TYPE, SERVICE_TYPE_TO_LISTING_TYPE, type ServiceType } from "@/lib/listing-types";
import { formatListingPrice, ratingSummary, guideRatingSummary } from "@/lib/listings";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";

const CATEGORY_TO_TYPE: Record<string, ServiceType | "Guide"> = {
  accommodation: "Accommodation",
  tours: "Tour",
  restaurants: "Restaurant",
  transport: "Transport",
  guides: "Guide"
};

const PRICE_RANGE_BOUNDS: Record<string, { min?: number; max?: number }> = {
  "under-200000": { max: 200000 },
  "200000-600000": { min: 200000, max: 600000 },
  "600000-1500000": { min: 600000, max: 1500000 },
  "above-1500000": { min: 1500000 }
};

const RATING_TIER_MIN: Record<string, number> = {
  exceptional: 4.7,
  excellent: 4.3,
  "very-good": 3.8
};

function toStringArray(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: {
    category?: string;
    q?: string;
    sort?: string;
    checkIn?: string;
    checkOut?: string;
    startDate?: string;
    date?: string;
    time?: string;
    duration?: string;
    guests?: string;
    passengers?: string;
    pickup?: string;
    dropoff?: string;
    transportCategory?: string;
    price?: string | string[];
    rating?: string | string[];
    propertyType?: string | string[];
    tourType?: string | string[];
    vehicleType?: string | string[];
    cuisine?: string | string[];
    specialty?: string | string[];
    location?: string | string[];
    amenities?: string | string[];
    page?: string;
  };
}) {
  const activeType = searchParams.category ? CATEGORY_TO_TYPE[searchParams.category] : undefined;
  const query = searchParams.q?.trim();
  const guests = Number(searchParams.guests ?? searchParams.passengers);
  const hasGuestFilter = Number.isFinite(guests) && guests > 0;

  const where: Prisma.ListingWhereInput = {
    status: "PUBLISHED",
    business: { verificationStatus: "APPROVED" },
    type: activeType && activeType !== "Guide" ? SERVICE_TYPE_TO_LISTING_TYPE[activeType] : undefined,
    ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { city: { contains: query, mode: "insensitive" } }] } : {})
  };

  if (activeType === "Accommodation" && hasGuestFilter) {
    where.accommodation = { maxGuests: { gte: guests } };
  } else if (activeType === "Tour" && hasGuestFilter) {
    where.tour = { groupSizeMin: { lte: guests }, groupSizeMax: { gte: guests } };
  } else if (activeType === "Restaurant" && hasGuestFilter) {
    where.restaurant = { seatingCapacity: { gte: guests } };
  } else if (activeType === "Transport") {
    const transportFilters: Prisma.TransportOptionWhereInput = {};
    if (hasGuestFilter) transportFilters.capacity = { gte: guests };
    if (searchParams.transportCategory === "airport") transportFilters.category = "AIRPORT_TRANSFER";
    if (searchParams.transportCategory === "special") transportFilters.category = "KAMPALA_SPECIAL_HIRE";
    if (Object.keys(transportFilters).length > 0) where.transport = transportFilters;

    const routeTerms = [searchParams.pickup, searchParams.dropoff].filter((term): term is string => Boolean(term?.trim()));
    if (routeTerms.length > 0) {
      where.OR = [
        ...(where.OR ?? []),
        ...routeTerms.flatMap((term) => [{ title: { contains: term, mode: "insensitive" as const } }, { city: { contains: term, mode: "insensitive" as const } }])
      ];
    }
  }

  let results: Array<{
    id: string;
    type: string;
    title: string;
    location: string;
    price: string;
    priceValue: number;
    description: string;
    rating?: number;
    reviewCount?: number;
    imageUrl?: string | null;
  }> = [];

  if (activeType === "Guide") {
    const guides = await db.guide.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { bio: { contains: query, mode: "insensitive" as const } },
              { destination: { name: { contains: query, mode: "insensitive" as const } } }
            ]
          }
        : {},
      include: {
        destination: true,
        business: { select: { verificationStatus: true } },
        tours: {
          include: {
            listing: {
              include: {
                reviews: {
                  where: { status: "PUBLISHED" },
                  select: { rating: true }
                }
              }
            }
          }
        }
      }
    });

    results = guides.map((guide) => {
      const { average, count } = guideRatingSummary(guide.tours);
      const numericPrice = (guide.hourlyRateMinor ?? 50000) * 3700;
      return {
        id: guide.id,
        type: "Guide",
        title: guide.name,
        location: guide.destination?.name ?? "Uganda",
        price: guide.hourlyRateMinor ? formatUGX(guide.hourlyRateMinor * 3700) : "UGX 185,000",
        priceValue: numericPrice,
        description: guide.bio,
        rating: average,
        reviewCount: count,
        imageUrl: guide.photoUrl
      };
    });
  } else {
    const listings = await db.listing.findMany({
      where,
      include: { restaurant: true, reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } }
    });

    results = listings.map((listing) => {
      const { average, count } = ratingSummary(listing.reviews);
      const numericPrice = listing.type === "RESTAURANT" ? parseFirstUgxAmount(listing.restaurant?.priceRange ?? "0") : listing.basePriceMinor;
      return {
        id: listing.id,
        type: LISTING_TYPE_TO_SERVICE_TYPE[listing.type],
        title: listing.title,
        location: listing.city ?? "",
        price: formatListingPrice(listing),
        priceValue: numericPrice,
        description: listing.description,
        rating: average,
        reviewCount: count,
        imageUrl: listing.coverImageUrl
      };
    });
  }

  const selectedPriceRanges = toStringArray(searchParams.price);
  if (selectedPriceRanges.length > 0) {
    results = results.filter((listing) =>
      selectedPriceRanges.some((rangeKey) => {
        const bounds = PRICE_RANGE_BOUNDS[rangeKey];
        if (!bounds) return false;
        if (bounds.min !== undefined && listing.priceValue < bounds.min) return false;
        if (bounds.max !== undefined && listing.priceValue > bounds.max) return false;
        return true;
      })
    );
  }

  const selectedRatingTiers = toStringArray(searchParams.rating);
  if (selectedRatingTiers.length > 0) {
    results = results.filter((listing) =>
      selectedRatingTiers.some((tierKey) => (listing.rating ?? 0) >= (RATING_TIER_MIN[tierKey] ?? 0))
    );
  }

  const selectedPropertyTypes = toStringArray(searchParams.propertyType);
  if (selectedPropertyTypes.length > 0) {
    results = results.filter((item) =>
      selectedPropertyTypes.some((pt) =>
        item.title.toLowerCase().includes(pt.toLowerCase()) ||
        item.description.toLowerCase().includes(pt.toLowerCase())
      )
    );
  }

  const selectedTourTypes = toStringArray(searchParams.tourType);
  if (selectedTourTypes.length > 0) {
    results = results.filter((item) =>
      selectedTourTypes.some((tt) =>
        item.title.toLowerCase().includes(tt.toLowerCase()) ||
        item.description.toLowerCase().includes(tt.toLowerCase())
      )
    );
  }

  const selectedDurations = toStringArray(searchParams.duration);
  if (selectedDurations.length > 0) {
    results = results.filter((item) =>
      selectedDurations.some((dur) =>
        item.title.toLowerCase().includes(dur.toLowerCase()) ||
        item.description.toLowerCase().includes(dur.toLowerCase())
      )
    );
  }

  const selectedVehicleTypes = toStringArray(searchParams.vehicleType);
  if (selectedVehicleTypes.length > 0) {
    results = results.filter((item) =>
      selectedVehicleTypes.some((vt) =>
        item.title.toLowerCase().includes(vt.toLowerCase()) ||
        item.description.toLowerCase().includes(vt.toLowerCase())
      )
    );
  }

  const selectedCuisines = toStringArray(searchParams.cuisine);
  if (selectedCuisines.length > 0) {
    results = results.filter((item) =>
      selectedCuisines.some((c) =>
        item.title.toLowerCase().includes(c.toLowerCase()) ||
        item.description.toLowerCase().includes(c.toLowerCase())
      )
    );
  }

  const selectedSpecialties = toStringArray(searchParams.specialty);
  if (selectedSpecialties.length > 0) {
    results = results.filter((item) =>
      selectedSpecialties.some((s) =>
        item.title.toLowerCase().includes(s.toLowerCase()) ||
        item.description.toLowerCase().includes(s.toLowerCase())
      )
    );
  }

  const selectedLocations = toStringArray(searchParams.location);
  if (selectedLocations.length > 0) {
    results = results.filter((item) =>
      selectedLocations.some((loc) =>
        item.location.toLowerCase().includes(loc.toLowerCase()) ||
        item.title.toLowerCase().includes(loc.toLowerCase())
      )
    );
  }

  const selectedAmenities = toStringArray(searchParams.amenities);
  if (selectedAmenities.length > 0) {
    results = results.filter((item) =>
      selectedAmenities.some((am) =>
        item.description.toLowerCase().includes(am.toLowerCase())
      )
    );
  }

  if (searchParams.sort === "price-asc") {
    results = [...results].sort((a, b) => a.priceValue - b.priceValue);
  } else if (searchParams.sort === "price-desc") {
    results = [...results].sort((a, b) => b.priceValue - a.priceValue);
  } else if (searchParams.sort === "rating") {
    results = [...results].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }

  const dateLabel = [searchParams.checkIn, searchParams.checkOut].filter(Boolean).join(" – ") || searchParams.startDate || searchParams.date;
  const summaryParts = [
    hasGuestFilter ? `${guests} ${guests === 1 ? 'adult' : 'adults'}` : undefined,
    dateLabel,
    searchParams.time
  ].filter(Boolean);

  const noun =
    activeType === "Accommodation"
      ? "accommodations"
      : activeType === "Tour"
      ? "safaris"
      : activeType === "Restaurant"
      ? "restaurants"
      : activeType === "Transport"
      ? "rides"
      : activeType === "Guide"
      ? "tour guides"
      : "results";

  const totalResults = results.length;
  const page = parsePage(searchParams.page);
  const pagedResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value]) params.append(key, item);
    }
    params.set("page", String(targetPage));
    return `/search?${params.toString()}`;
  }

  return (
    <>
      <SiteHeader />
      <main>
        <div className="border-b border-border bg-card py-6">
          <Container>
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </Container>
        </div>
        <Container className="py-8">
          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="hidden lg:block">
              <Card className="sticky top-24 border-0 shadow-none bg-transparent">
                <CardContent className="flex flex-col gap-6 p-0">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filter results
                  </div>
                  <Suspense fallback={null}>
                    <SearchFilters />
                  </Suspense>
                </CardContent>
              </Card>
            </aside>

            <div>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {totalResults} {noun} found{query ? ` in ${query}` : ""}
                  </h1>
                  {summaryParts.length > 0 ? (
                    <p className="text-sm text-muted-foreground mt-1">{summaryParts.join(" · ")}</p>
                  ) : null}
                  <p className="text-sm text-muted-foreground mt-2">Browse freely. Sign in when you&apos;re ready to book.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Suspense fallback={null}>
                    <MobileFilters />
                  </Suspense>
                  <SortSelect />
                </div>
              </div>

              {totalResults === 0 ? (
                <EmptyState title="No results" description="Try a different destination, category, party size, or filter." />
              ) : (
                <div className="flex flex-col gap-6">
                  {pagedResults.map((listing) => (
                    <ListingRow key={listing.id} {...listing} tags={["Verified partner"]} />
                  ))}
                </div>
              )}

              <Pagination currentPage={page} totalPages={totalPagesFor(totalResults)} buildHref={buildHref} />
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

