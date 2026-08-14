import type { ListingType } from "@prisma/client";

import { dateKeyUTC, formatUGX } from "@/lib/booking";
import { db } from "@/lib/db";
import { LISTING_TYPE_TO_SERVICE_TYPE } from "@/lib/listing-types";

/** Bookings in these statuses no longer hold a room — every other status (including
 * mid-payment ones) still occupies the room, so we don't show a room as free while
 * someone else's payment is processing. */
const NON_BLOCKING_BOOKING_STATUSES = ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN", "PAYMENT_FAILED"] as const;

/** Which nights, over the next `monthsAhead` months, are fully booked for each room type —
 * real availability derived from actual Booking rows, not fabricated. A night only counts as
 * unavailable once the number of overlapping bookings reaches that room type's `totalRooms`
 * (so a 3-room type with 1 booking still shows as available). Guests may book several months
 * out, so this defaults to a year ahead — keep in sync with `MAX_MONTHS_AHEAD` in
 * `availability-calendar.tsx`, which caps how far the calendar widget can page forward. */
export async function getRoomTypeAvailability(
  roomTypes: { id: string; totalRooms: number }[],
  monthsAhead = 12
): Promise<Record<string, string[]>> {
  if (roomTypes.length === 0) return {};

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const windowEnd = new Date(todayUtc);
  windowEnd.setUTCMonth(windowEnd.getUTCMonth() + monthsAhead);

  const bookings = await db.booking.findMany({
    where: {
      roomTypeId: { in: roomTypes.map((room) => room.id) },
      status: { notIn: [...NON_BLOCKING_BOOKING_STATUSES] },
      startDate: { not: null, lt: windowEnd },
      endDate: { not: null, gt: todayUtc }
    },
    select: { roomTypeId: true, startDate: true, endDate: true }
  });

  const nightCounts = new Map<string, Map<string, number>>();
  for (const booking of bookings) {
    if (!booking.roomTypeId || !booking.startDate || !booking.endDate) continue;
    const start = booking.startDate < todayUtc ? todayUtc : booking.startDate;
    const end = booking.endDate > windowEnd ? windowEnd : booking.endDate;
    const roomNights = nightCounts.get(booking.roomTypeId) ?? new Map<string, number>();

    const cursor = new Date(start);
    while (cursor < end) {
      const key = dateKeyUTC(cursor);
      roomNights.set(key, (roomNights.get(key) ?? 0) + 1);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    nightCounts.set(booking.roomTypeId, roomNights);
  }

  const availability: Record<string, string[]> = {};
  for (const room of roomTypes) {
    const roomNights = nightCounts.get(room.id) ?? new Map<string, number>();
    availability[room.id] = Array.from(roomNights.entries())
      .filter(([, count]) => count >= Math.max(1, room.totalRooms))
      .map(([date]) => date);
  }
  return availability;
}

export function ratingSummary(reviews: { rating: number }[]): { average?: number; count: number } {
  if (reviews.length === 0) return { average: undefined, count: 0 };
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
}

export function ratingBreakdown(reviews: { rating: number }[]): Record<1 | 2 | 3 | 4 | 5, number> {
  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[bucket] += 1;
  }
  return breakdown;
}

/** Prisma's ListingType enum is UPPER_SNAKE; `ListingCard`'s `type` prop takes the
 * capitalized label used for routing (`TYPE_HREF` in listing-card.tsx). */
export function listingTypeLabel(type: ListingType) {
  return type === "ACCOMMODATION" ? "Accommodation" : type === "TOUR" ? "Tour" : type === "RESTAURANT" ? "Restaurant" : "Transport";
}

/** "From UGX 420,000" for most listing types; restaurants only store a price range string. */
export function formatListingPrice(listing: {
  type: ListingType;
  basePriceMinor: number;
  restaurant?: { priceRange: string | null } | null;
}) {
  if (listing.type === "RESTAURANT") return listing.restaurant?.priceRange ?? "Contact for pricing";
  return `From ${formatUGX(listing.basePriceMinor)}`;
}

/** A guide has no reviews of their own — this aggregates the real reviews left
 * on all of their tours, rather than fabricating a guide-level rating. */
export function guideRatingSummary(tours: Array<{ listing: { reviews: { rating: number }[] } }>) {
  return ratingSummary(tours.flatMap((tour) => tour.listing.reviews));
}

/** A completed-but-unreviewed booking for this user against this listing, if any — powers the "Write a review" CTA. */
export async function findEligibleReviewBooking(listingId: string, userId: string) {
  return db.booking.findFirst({
    where: { listingId, customerId: userId, status: { in: ["COMPLETED", "REVIEW_PENDING"] }, review: null },
    select: { id: true }
  });
}

export async function findRelatedListings(type: ListingType, excludeId: string, limit = 3) {
  const listings = await db.listing.findMany({
    where: { type, status: "PUBLISHED", id: { not: excludeId }, business: { verificationStatus: "APPROVED" } },
    include: { restaurant: true, reviews: { where: { status: "PUBLISHED" }, select: { rating: true } } },
    take: limit
  });

  return listings.map((listing) => ({
    id: listing.id,
    type: LISTING_TYPE_TO_SERVICE_TYPE[listing.type],
    title: listing.title,
    location: listing.city ?? "",
    price: formatListingPrice(listing),
    description: listing.description,
    rating: ratingSummary(listing.reviews).average,
    imageUrl: listing.coverImageUrl
  }));
}
