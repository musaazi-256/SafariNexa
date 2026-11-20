/** The public page of a listing, by type. */
export function publicListingHref(listing: { id: string; type: string }) {
  const base = { ACCOMMODATION: "accommodation", TOUR: "tours", RESTAURANT: "restaurants", TRANSPORT: "transport" }[listing.type] ?? "explore";
  return `/${base}/${listing.id}`;
}
