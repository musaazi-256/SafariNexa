// ---------------------------------------------------------------------------
// Static homepage copy with no backing DB model. Everything else that used
// to live here (destinations, listings, guides) is now served from Postgres
// via Prisma — see src/lib/db.ts, src/lib/listings.ts, and prisma/seed.ts.
// ---------------------------------------------------------------------------

export const protectedActions = ["Book", "Pay", "Save", "Message", "Review", "Manage trip"];
