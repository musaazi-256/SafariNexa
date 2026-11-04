export const SUPPORT_CATEGORIES = ["Booking", "Payment", "Refund", "Business verification", "Safety", "Account access", "Other"] as const;

/** Categories offered when a business user opens a case from the business portal. */
export const BUSINESS_SUPPORT_CATEGORIES = ["Bookings", "Payments & payouts", "Listings", "Business verification", "Reviews", "Team & account", "Other"] as const;

/** Same shape as generateBookingRef in lib/booking.ts — short, sortable-enough, human-readable. */
export function generateCaseRef() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `SC-${stamp}${random}`;
}
