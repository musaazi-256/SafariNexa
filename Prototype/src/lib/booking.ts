/** Whole nights between two ISO date strings, clamped to a minimum of 1. */
export function nightsBetween(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
  const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, nights);
}

/** "YYYY-MM-DD" from a Date's UTC calendar fields — date-only values (from `<input type="date">`
 * or Booking.startDate/endDate) are stored/parsed as UTC midnight, so reading them back with UTC
 * getters (not local getters) avoids an off-by-one shift when the server's local timezone differs. */
export function dateKeyUTC(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function generateBookingRef() {
  const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  return `BK-${uuid.split("-")[0].toUpperCase()}`;
}

export function formatUGX(amountMinor: number) {
  return `UGX ${amountMinor.toLocaleString("en-UG")}`;
}

/** Restaurants only store a price range (e.g. "UGX 40,000 – 90,000 per
 * person"); use the low end as a representative per-person estimate. */
export function parseFirstUgxAmount(text: string) {
  const match = text.replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export const LISTING_TYPE_PARAM = {
  Accommodation: "accommodation",
  Tour: "tour",
  Restaurant: "restaurant",
  Transport: "transport"
} as const;

export type ListingTypeParam = (typeof LISTING_TYPE_PARAM)[keyof typeof LISTING_TYPE_PARAM];
