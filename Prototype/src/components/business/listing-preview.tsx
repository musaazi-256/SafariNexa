import type { ReactNode } from "react";
import { CalendarCheck, CalendarX, CheckCircle2, Clock, MapPin, Users, XCircle } from "lucide-react";

import { PhotoGallery } from "@/components/rooms/photo-gallery";
import { RemoteImage } from "@/components/remote-image";
import { PageTitle } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatUGX } from "@/lib/booking";

type Room = { id?: string; name: string; description?: string | null; images?: string[]; priceMinor: number; maxOccupancy?: number; bedType?: string | null; breakfastIncluded?: boolean; isRefundable?: boolean; roomFeatures?: string[]; totalRooms?: number };

/** Saved listing content, either the live row (with reviewInclude) or a draft snapshot of it. */
export type PreviewListing = {
  type: string;
  title: string;
  description: string;
  city?: string | null;
  address?: string | null;
  locationDirections?: string | null;
  basePriceMinor: number;
  coverImageUrl?: string | null;
  images?: string[];
  bookingMode?: string;
  destination?: { name: string } | null;
  accommodation?: { propertyType?: string; amenities?: string[]; checkInTime?: string | null; checkOutTime?: string | null; maxGuests?: number; cancellationPolicy?: string | null; roomTypes?: Room[] } | null;
  tour?: { tourType?: string | null; durationDays?: number; groupSizeMin?: number; groupSizeMax?: number; difficulty?: string | null; inclusions?: string[]; exclusions?: string[] } | null;
  restaurant?: { cuisineType?: string | null; priceRange?: string | null; seatingCapacity?: number | null; menuUrl?: string | null } | null;
  transport?: { category?: string; vehicleType?: string; capacity?: number; estimatedDurationMinutes?: number | null; pricingModel?: string | null } | null;
};

const UNIT: Record<string, string> = { ACCOMMODATION: "night", TOUR: "person", RESTAURANT: "guest", TRANSPORT: "trip" };

function Facts({ items }: { items: Array<[string, string | number | null | undefined]> }) {
  const shown = items.filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!shown.length) return null;
  return <dl className="mt-6 grid gap-4 rounded-2xl border border-border p-5 sm:grid-cols-3">{shown.map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="mt-0.5 text-sm font-medium">{v}</dd></div>)}</dl>;
}

function List({ title, items, icon: Icon }: { title: string; items?: string[]; icon: typeof CheckCircle2 }) {
  if (!items?.length) return null;
  return <section className="mt-10 border-t border-border pt-8"><h2 className="type-section">{title}</h2><ul className="mt-4 grid gap-3 sm:grid-cols-2">{items.map((item) => <li key={item} className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 shrink-0 text-primary" />{item}</li>)}</ul></section>;
}

/** Customer-facing layout of a listing, for the business preview. Read-only: no booking, saving or messaging. */
export function ListingPreview({ listing, businessName, ratingText = "No reviews yet", narrow = false }: { listing: PreviewListing; businessName: string; ratingText?: string; narrow?: boolean }) {
  // Embedded in another page (narrow), the listing title is a section heading, not the page h1.
  const Title = narrow ? (props: { children: ReactNode }) => <h2 className="type-page break-words">{props.children}</h2> : PageTitle;
  const images = listing.images?.length ? listing.images : listing.coverImageUrl ? [listing.coverImageUrl] : [];
  const acc = listing.accommodation;
  const rooms = acc?.roomTypes ?? [];
  const fromPrice = rooms.length ? Math.min(...rooms.map((r) => r.priceMinor)) : listing.basePriceMinor;
  const unit = UNIT[listing.type] ?? "booking";

  return (
    <div>
      <PhotoGallery images={images} title={listing.title} />
      <div className={narrow ? "mt-8 grid gap-10" : "mt-8 grid gap-10 lg:grid-cols-[1fr_340px]"}>
        <div className="min-w-0">
          <Badge variant="secondary" className="mb-2 capitalize">{acc?.propertyType || listing.tour?.tourType || listing.restaurant?.cuisineType || listing.transport?.vehicleType || listing.type.toLowerCase()}</Badge>
          <Title>{listing.title || "Untitled listing"}</Title>
          <p className="mt-1 flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-4 w-4" />{[listing.city, listing.destination?.name].filter(Boolean).join(" · ") || "Location not added"}</p>
          <p className="mt-3 text-sm text-muted-foreground">{ratingText} · Offered by {businessName}</p>

          <section className="mt-8">
            <h2 className="type-section">About this {listing.type === "ACCOMMODATION" ? "stay" : listing.type.toLowerCase()}</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-muted-foreground">{listing.description || "No description added yet."}</p>
          </section>

          {acc && <Facts items={[["Check-in", acc.checkInTime && `From ${acc.checkInTime}`], ["Check-out", acc.checkOutTime && `By ${acc.checkOutTime}`], ["Maximum guests", acc.maxGuests]]} />}
          {listing.tour && <Facts items={[["Duration", listing.tour.durationDays && `${listing.tour.durationDays} ${listing.tour.durationDays === 1 ? "day" : "days"}`], ["Group size", `${listing.tour.groupSizeMin ?? 1}–${listing.tour.groupSizeMax ?? 12} people`], ["Difficulty", listing.tour.difficulty]]} />}
          {listing.restaurant && <Facts items={[["Cuisine", listing.restaurant.cuisineType], ["Price range", listing.restaurant.priceRange], ["Seating", listing.restaurant.seatingCapacity && `${listing.restaurant.seatingCapacity} seats`]]} />}
          {listing.transport && <Facts items={[["Vehicle", listing.transport.vehicleType], ["Seats", listing.transport.capacity], ["Journey time", listing.transport.estimatedDurationMinutes && `About ${Math.round(listing.transport.estimatedDurationMinutes / 6) / 10} h`]]} />}

          {rooms.length > 0 && (
            <section className="mt-10 border-t border-border pt-8">
              <h2 className="type-section">Rooms</h2>
              <div className="mt-4 space-y-4">
                {rooms.map((room, i) => (
                  <article key={room.id ?? i} className="flex flex-col gap-4 rounded-2xl border border-border p-4 md:flex-row">
                    <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-muted md:w-44">{room.images?.[0] && <RemoteImage src={room.images[0]} alt={room.name} width={352} height={256} className="h-full w-full object-cover" />}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{room.name}</h3>
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Users className="h-4 w-4" />Sleeps {room.maxOccupancy ?? 2}</span>{room.bedType && <span>{room.bedType}</span>}{room.breakfastIncluded && <span>Breakfast included</span>}</p>
                      {room.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{room.description}</p>}
                      <p className="mt-2 flex items-center gap-1 text-sm">{room.isRefundable === false ? <><CalendarX className="h-4 w-4 text-destructive" />Non-refundable</> : <><CalendarCheck className="h-4 w-4 text-success" />Free cancellation</>}</p>
                    </div>
                    <div className="shrink-0 md:text-right"><p className="text-lg font-semibold">{formatUGX(room.priceMinor)}</p><p className="text-xs text-muted-foreground">per night</p></div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <List title="Amenities" items={acc?.amenities} icon={CheckCircle2} />
          <List title="What's included" items={listing.tour?.inclusions} icon={CheckCircle2} />
          <List title="Not included" items={listing.tour?.exclusions} icon={XCircle} />

          {acc && <section className="mt-10 border-t border-border pt-8"><h2 className="type-section">Policies</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{acc.cancellationPolicy || "No cancellation policy added yet."}</p></section>}

          <section className="mt-10 border-t border-border pt-8">
            <h2 className="type-section">Location</h2>
            <p className="mt-3 text-sm">{[listing.address, listing.city].filter(Boolean).join(", ") || "Address not added yet."}</p>
            {listing.locationDirections && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{listing.locationDirections}</p>}
          </section>
        </div>

        <aside className={narrow ? "max-w-sm" : "lg:sticky lg:top-24 lg:self-start"}>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">From</p>
            <p className="text-2xl font-semibold">{fromPrice > 0 ? formatUGX(fromPrice) : "Price not set"}</p>
            <p className="text-sm text-muted-foreground">per {unit}</p>
            <Button type="button" disabled className="mt-5 w-full">{listing.bookingMode === "INSTANT" ? "Book now" : "Request to book"}</Button>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Booking is turned off in preview.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
