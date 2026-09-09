# SafariNexa — project documentation

**Prepared:** 9 September 2026, for the engineering team.
**Purpose:** a module-by-module reference to the whole platform, organized by portal (customer, business, admin), covering what each module does, the routes and data behind it, and — critically — what's real versus simulated or unfinished. Status is marked per module as **Working** (real, production-shaped logic), **Partial** (some real logic, some hardcoded/decorative parts — detailed inline), or **Placeholder** (UI exists, no real logic behind it).

---

## 1. Architecture overview

**Stack:** Next.js 14.2 (App Router), React 18.3, TypeScript, Prisma 5.22 + PostgreSQL, NextAuth v5 (beta), Tailwind + Radix UI primitives, Zustand (cart state), Zod, Jest.

**Three portals, one codebase, one database.** Everything lives under `src/app`:
- **Customer** — the public marketplace: `src/app/{accommodation,tours,restaurants,transport,guides,destinations,search,explore,cart,checkout,payments,bookings,profile,notifications,reviews,support,trip-planner,safety,auth}`
- **Business** — `src/app/business/**`, gated behind `requireBusinessSession()` (`src/lib/business.ts`)
- **Admin** — `src/app/admin/**`, gated behind `requireAdminSession()` (`src/lib/admin.ts`)

**Identity model:** one `User` table underlies all three surfaces, joined by email. A person can simultaneously be a customer (has a `CustomerProfile`, bookings, saved items), a business owner/staff (via `BusinessUser`, pointing at a `BusinessProfile`), and an admin (via `AdminUser`, pointing at a `Role`). **This is intentional** — see the identity-model note in §5. Route protection is enforced centrally in `src/middleware.ts`, which checks `session.user.isAdmin` for admin routes and session presence for customer/business-protected routes.

**Auth:** NextAuth v5 with Google OAuth and a credentials provider, per surface (`src/auth.ts`, edge-safe config in `src/auth.config.ts`). `AUTH_DEV_MODE=true` (dev-only) makes email/password sign-in on any surface accept any credentials and auto-provision the account — this is how the seeded demo accounts (`customer@safarinexa.test`, `business@dev.test`, `admin@safarinexa.test`, all password `Passw0rd!`) work locally. **Never enable this in production.**

**Money:** all prices are stored as `*Minor` integer fields (minor currency units, e.g. UGX has no subunit so these are whole-shilling integers) — never floats.

**Payments — read this before assuming anything works:** `stripe` and `@stripe/stripe-js` are installed, a webhook handler and admin refund flow are real (`src/app/api/webhooks/stripe/route.ts`, `src/app/admin/(portal)/payments/page.tsx`), but **nothing in the app ever creates a Stripe Checkout Session or PaymentIntent.** `processPaymentAction` (`src/app/payments/actions.ts`) unconditionally marks every payment method — including `"stripe"` — as `SUCCESSFUL` without any gateway confirming funds. Treat all payment flows in this codebase as **simulated** until that's built.

**Images:** the shared `ImageUploader` (`src/components/ui/image-uploader.tsx`) base64-encodes photos client-side and stores them as text directly in Postgres — there is no object storage integration. It does enforce a 10MB/file, image-type-only, and a photo-count cap as of 9 September 2026, but the storage mechanism itself is still base64-in-DB.

**This document, and the companion changelog, are themselves a module:** `/docs`, `/docs/changelog`, `/docs/overview` (`src/app/docs/**`), rendering markdown from `content/docs/*.md` via `src/lib/docs.ts`, linked from the public `SiteFooter`. **Public** — no auth gate. Kept up to date as part of every code change per the standing rule in `CLAUDE.md`.

---

## 2. Customer portal

### 2.1 Discovery — Explore, Search, Destinations, Guides
**Status: Partial.**
- `/` (`src/app/page.tsx`), `/explore` — real, DB-backed listing grids.
- `/search` (`src/app/search/page.tsx`) — the main search experience, backed by `SearchBar`/`SearchFilters`/`MobileFilters`. Guest/passenger-count filters and text/city search genuinely query the database (`Prisma.ListingWhereInput`). **However**, the property-type, tour-type, vehicle-type, cuisine, and amenities filters do a plain substring match against listing title/description rather than querying the real structured columns the business forms save (`AccommodationListing.propertyType`, `TourListing.tourType`, etc.) — the underlying data is correct, the filter reading it isn't always.
- `/destinations`, `/destinations/[slug]` — real, but `Destination` rows are **seed-only**; there is no create/edit UI anywhere in the product for admin or businesses to add a new destination.
- `/guides`, `/guides/[id]` — real, backed by the `Guide` model.

### 2.2 Listing detail pages
**Status: Working**, with one known display bug.
- `/accommodation/[id]`, `/tours/[id]`, `/restaurants/[id]`, `/transport/[id]` — all real, published-and-approved-only, pulling live data including images, rooms, amenities, policy, guide, and reviews.
- Room browsing on the accommodation page (`RoomPreviewCard`, `RoomDetailsModal`) shows full room detail (bed type, features, refundability) and a real "remaining tonight" count (fixed 9 Sept — previously a static number).
- Known limitation: two independent availability signals exist — a live-booking-count calendar (`getRoomTypeAvailability`) and the transactional `Availability` table that actually gates checkout. They're reconciled at booking-enforcement time (cancellations now correctly restore capacity, fixed 9 Sept) but are still two separate code paths, not one.

### 2.3 Reservations & checkout
**Status: Working for integrity, Partial for UX completeness.**
- Single-item checkout: `/checkout` (`src/app/checkout/page.tsx`). Cart/multi-item checkout: `/checkout/multi` + `src/components/checkout/multi-checkout-form.tsx`.
- **The core booking-integrity logic is solid**: `validateAndReserveBookings` (`src/lib/booking-service.ts`) is the single authoritative path both checkout flows call. It validates the listing is published and the business approved, that the listing type matches, dates are valid, room/capacity fits, and atomically decrements inventory inside a database transaction — this closes what was, as of mid-August, the single biggest integrity risk in the app.
- Checkout only ever collects the primary booker's name/email/phone. `BookingParticipant.documentType`/`documentNumber` exist in the schema for per-guest details but nothing in the UI collects them — every booking has exactly one participant row regardless of party size. This is a known, deliberate gap (not a bug — nothing is silently dropped, the UI simply doesn't offer it), flagged as a feature candidate.
- Cart: `/cart`, Zustand-backed (`src/lib/cart.ts`), with edit-in-place support (`src/components/cart/edit-cart-item-modal.tsx`).

### 2.4 Payments
**Status: Simulated — see §1.**
- `/payments`, `/payments/success`, `/payments/cancelled`, `/payments/receipt`. Real UI, real data collection per method (masked card/mobile-money reference stored in `Payment.providerReference`), real `Payment` rows created — but the "success" outcome is never actually confirmed by a payment provider.

### 2.5 Bookings management
**Status: Working.**
- `/bookings` (list), `/bookings/[id]` (detail) — real, shows payment history, room/add-on detail (now snapshotted so it survives a later room edit), booking-scoped chat, and cancel/refund-request actions. Cancelling an unpaid booking now correctly restores room availability (fixed 9 Sept); cancelling a paid booking creates a `Refund` request that an admin must action.

### 2.6 Reviews
**Status: Working.**
- `/reviews/new` — a review can only be written against a real completed booking with no existing review (`findEligibleReviewBooking` in `src/lib/listings.ts`); the previous synthetic-booking bypass is gone.

### 2.7 Messaging
**Status: Working**, built 31 Aug–1 Sept 2026.
- Pre-booking inquiries from any listing page (`src/components/inquiry-dialog.tsx`), booking-scoped chat (`src/components/booking-chat.tsx`), and a full inbox at `/profile/messages` with read receipts. Server actions in `src/lib/actions/messages.ts` correctly authorize every send/read against thread membership.
- Known minor gaps: thread creation isn't protected by a unique DB constraint (a rare race could create a duplicate thread), and send failures fail silently client-side (no toast) — both low-severity, not fixed as of this writing.

### 2.8 Profile & account
**Status: Working, one placeholder tab.**
- `/profile`, `/profile/preferences`, `/profile/saved`, `/profile/payment-settings` — all real, backed by `CustomerProfile`.
- `/notifications` — real, backed by `Notification`.

### 2.9 Support
**Status: Working.**
- `/support`, `/support/[id]` — real case creation and threaded replies (`SupportCase`/`SupportMessage`), visible to both the customer and admin sides.

### 2.10 Trip planner
**Status: Placeholder — explicitly unfinished, not a bug.**
- `/trip-planner`'s own list page literally displays "Coming soon — currently in development." `/trip-planner/[id]` is a client-side mock builder with fabricated demo data and no persistence — none of its buttons (Save, Share, Add Item, etc.) do anything. The schema already has `TripPlan`/`TripPlanItem` models ready and unused if this becomes a real feature.

### 2.11 Safety
**Status: Working.**
- `/safety` — static advisory content plus a real link into `/support` for the "Open Support Chat" action (fixed 9 Sept — previously dead).

### 2.12 Auth
**Status: Working, one explicit gap.**
- `/auth/sign-in`, `/auth/create-account`, `/auth/google`, `/auth/verify` — real.
- `/auth/forgot-password` — **the reset button is intentionally disabled**; the page's own copy says email delivery isn't connected in this environment. There is currently no working password-recovery path for a customer who forgets their password. This needs an email provider decision before it can be built.

---

## 3. Business portal

Entry: `/business` → `requireBusinessSession()`. A business owner first has a personal (customer) account, then either completes onboarding to create a business or is invited to join one — see the identity-model note in §5.

### 3.1 Onboarding
**Status: Working**, real persistence as of 9 Sept.
- `/business/onboarding` (intro) → `/business/onboarding/setup` (the `OnboardingWizard` component, `src/components/business/onboarding-wizard.tsx`).
- All three steps' fields (business basics, contact person, documents) are now actually sent and persisted (fixed 9 Sept — previously silently dropped description, registration number, and contact name/role). Document upload writes to the local filesystem (`fs.writeFile` to `public/uploads`) — **this will not reliably persist on typical serverless hosting**; flagged as a pre-deployment blocker, not yet fixed.

### 3.2 Dashboard
**Status: Working, with a real-but-decorative quick-actions row.**
- `/business/dashboard` — real KPI cards (published/draft counts, awaiting-confirmation count, revenue, rating).
- Quick actions: "Add new listing" and "Respond to reviews" are real links; "View calendar" now links to real bookings (fixed 9 Sept); "Create promotion" and "Download report" have no backing feature at all and are now honestly labeled "Soon" rather than silently doing nothing when clicked (fixed 9 Sept).

### 3.3 Listings management
**Status: Working**, the most complex module in the business portal.
- `/business/listings` (list, real table with type/status/price), `/business/listings/new` (4-way type picker + per-type form), `/business/listings/[id]/edit`.
- Shared base + per-type field components (`src/components/business/listing-form-fields.tsx`) and a single parser (`src/lib/business-listing-form.ts`) back both create and edit — verified consistent across all 4 listing types, no dead fields.
- Accommodation rooms/add-ons use a repeatable-row pattern (`RoomTypeEditor`/`AddOnEditor`). **Editing now correctly diffs by ID** (update existing, create new, only delete rows with zero bookings) — this used to blanket delete-and-recreate every room on every edit, corrupting bed type/features/refund settings; fixed 9 Sept.
- `destinationId` assignment works correctly (fixed in an earlier session); `Destination` itself remains seed-only (see §2.1).
- "Preview listing" now opens the real listing page in edit mode (fixed 9 Sept; intentionally absent on the create form, since there's no page to preview yet).

### 3.4 Bookings management
**Status: Working.**
- `/business/bookings` (list with status tabs), `/business/bookings/[id]` (detail — confirm/decline, room/add-on detail, booking chat). Declining a booking now correctly restores room availability (fixed 9 Sept).

### 3.5 Guides
**Status: Working.**
- `/business/guides`, `/business/guides/new` — real, now includes destination assignment and an availability note field (added 9 Sept). No guide-edit page exists yet — once created, a guide's fields can't be corrected through the UI (a create-only gap, not a data-integrity bug).

### 3.6 Reviews
**Status: Working.**
- `/business/reviews` — real reply flow (`replyToReview` action, writes `Review.businessReplyBody`).

### 3.7 Messaging
**Status: Working** — see §2.7; the business side of the same system, plus the ability to start a new thread with any past customer (added 1 Sept).

### 3.8 Revenue
**Status: Partial — real totals, decorative everything else.**
- `/business/revenue` — the headline stat totals (gross/commission/net/refunded) are real, computed from actual `Payment` rows. The comparison percentages, sparkline charts, date-range picker, "Export," the payout-breakdown line items, and the filter-tab pills are all hardcoded/non-functional. **Do not use anything on this page except the four headline totals for real financial decisions.**

### 3.9 Verification
**Status: Working**, business side.
- `/business/verification` — document upload (real file write, same serverless caveat as onboarding) and a status banner that now shows real, status-specific copy plus the admin's actual reviewer notes when present (fixed 9 Sept — previously a static "under review" regardless of real status). Document deletion now works via a real dropdown action (added 9 Sept).

### 3.10 Settings
**Status: Working for Business Profile and Staff Access, placeholder for Notifications.**
- `/business/settings` — three tabs:
  - **Business Profile**: real, now with properly separated Address/City/Country fields (fixed 9 Sept — previously "Physical Address" was silently overwriting `city` with a compound string on every save).
  - **Staff Access**: real invite/remove/cancel flow (`src/lib/actions/team.ts`), with owner-protection and audit logging.
  - **Notifications**: pure UI placeholder — the toggles are static, unwired `div`s, and "Save preferences" is hardcoded disabled with a "Coming Soon" label.
- The business-portal header's avatar menu now correctly keeps "Profile" inside the business portal (`/business/settings`) instead of bouncing to the customer profile page (fixed 9 Sept).

---

## 4. Admin portal

Entry: `/admin` → `requireAdminSession()`, gated on `session.user.isAdmin` in middleware.

### 4.1 Dashboard
**Status: Partial — largely cosmetic beyond a handful of stats.**
- `/admin/dashboard` — a substantial rewrite (25 Aug) added many real database queries, but most of what they compute is never rendered. Only a handful of secondary stats (active business count, cancelled bookings, support case counts, rating average, recent verifications) reach the UI via a real-value-or-fallback pattern; the headline KPI cards (Total Revenue, Pending Payouts, Total Bookings, etc.) and several whole panels (Featured Businesses, Recent Platform Activity, Top Performers, Recent Actions) are hardcoded literals. Empty-state mock rows in the verification/support panels no longer look clickable (fixed 9 Sept).

### 4.2 Verification queue
**Status: Working.**
- `/admin/verification` — approve/request-changes/flag actions correctly sync `BusinessProfile.verificationStatus` in one transaction, and now carry a real reviewer-notes textarea that reaches the business owner's notification (fixed 9 Sept — previously hardcoded to a generic string).

### 4.3 Businesses
**Status: Partial.**
- `/admin/businesses`, `/admin/businesses/[id]` — search and status-tab filtering are real. "Filter," "Export," column-sort, and the row overflow menu are decorative (deliberately left as-is, per product direction — this is the known, intentional demo-toolbar pattern referenced throughout this document).

### 4.4 Users & access
**Status: Working.**
- `/admin/users`, `/admin/users/new` — invite/promote and suspend/reactivate are both real, with audit logging (the suspend/reactivate action was hardened 31 Aug — it used to trust an unvalidated client field and log nothing). Every invited admin is currently hardcoded to the "Super Admin" role; this is confirmed harmless today since no code anywhere branches on `Role`/`Permission` yet, but is worth knowing before that changes.
- **Admin identity is now separate from customer identity** (fixed 9 Sept): `/admin/profile` reads/writes `AdminUser.displayName`/`phone`, not the shared `User` fields — previously an admin who started as a customer would see (and could overwrite) their customer-entered name here.

### 4.5 Bookings
**Status: Partial.**
- `/admin/bookings` — real status tabs, search, and pagination; now also shows which room/add-ons a booking was for (fixed 9 Sept). "Filter," "Export," the date-range picker, and the row overflow menu remain decorative.

### 4.6 Reviews
**Status: Working.**
- `/admin/reviews` — moderation actions notify both the review author and the business owner and write an audit log entry.

### 4.7 Payments & refunds
**Status: Working**, with the caveat from §1.
- `/admin/payments` — refund approval transactionally syncs `Refund`/`Payment`/`Booking` status and calls the real Stripe refund API for Stripe-labeled payments (though, per §1, very few payments will actually carry a real Stripe reference today); payout batching creates real `Payout` records.

### 4.8 Support
**Status: Working.**
- `/admin/support`, `/admin/support/[id]` — real case list and threaded reply, shared with the customer-side support system.

### 4.9 Settings
**Status: Placeholder.**
- `/admin/settings` — both "Save changes" and "Save fees" are hardcoded disabled with "Coming Soon" labels; nothing on this page persists.

### 4.10 Reports
**Status: Removed.** There is currently no admin analytics/reporting page — it existed briefly and was deleted (16 Aug) rather than fixed. If reporting is needed, this is a build-from-scratch item, not a bug to fix.

---

## 5. Data model reference

Full source of truth: `Prototype/prisma/schema.prisma` (~900 lines). Grouped by domain:

- **Identity & auth**: `User`, `Account`, `Session`, `VerificationToken`, `PendingProviderLink`, `CustomerProfile`, `BusinessProfile`, `BusinessUser`, `BusinessInvitation`, `BusinessVerification`, `BusinessDocument`, `Role`, `Permission`, `RolePermission`, `AdminUser`, `AuditLog`.
- **Catalogue**: `Destination`, `Listing` (polymorphic base) + `AccommodationListing`/`TourListing`/`RestaurantProfile`/`TransportOption` (1:1 type-specific extensions), `RoomType`, `AddOn`, `Guide`, `Availability`.
- **Booking, payments, reviews**: `Order`, `Booking`, `BookingParticipant`, `BookingAddOn`, `Payment`, `Payout`, `Refund`, `Review`.
- **Notifications, saved items, planning, support**: `Notification`, `SavedItem`, `TripPlan`/`TripPlanItem`, `SupportCase`/`SupportMessage`, `MessageThread`/`Message`.

**The identity model is deliberate, not a bug.** A single `User` row can simultaneously:
1. Be a customer (own `CustomerProfile`, `Booking`s, `SavedItem`s) — everyone starts here.
2. Own or staff a business, via `BusinessUser` → `BusinessProfile` — created by completing onboarding (§3.1) or being invited (§3.10).
3. Be an admin, via `AdminUser` → `Role` — created only by another admin inviting them (`inviteAdmin`, `src/lib/actions/admin.ts`); if the invited email already belongs to an existing customer, that same `User` row is promoted rather than a new identity being created.

This means, correctly, the same login can move between all three portals. What was **not** correct until 9 September was that the admin and business portals both had UI that assumed a person's *display* identity (name, phone, "Profile" link) was interchangeable with their customer identity — both fixed this session (see §4.4 and §3.10).

**Money fields** are always `*Minor` integers. **Enums worth knowing**: `BookingStatus` has 19 values covering the full lifecycle including payment sub-states; `VerificationStatus` covers both business verification and (reused) admin-user status framing; `NON_BLOCKING_BOOKING_STATUSES` (a constant in `src/lib/listings.ts`, not an enum) defines which booking statuses no longer hold room inventory — keep this in sync with `releaseAvailabilityForBooking` in `src/lib/booking-service.ts` if either changes.

---

## 6. Consolidated known limitations

One list, so nothing here is repeated-but-inconsistent across the sections above:

1. **No live payment gateway** — everything is self-attested success (§1, §2.4).
2. **Images are base64-in-Postgres**, not object storage (§1) — guardrails exist, storage mechanism doesn't scale.
3. **Verification/onboarding documents are written to local disk** — will not survive a typical serverless deploy (§3.1, §3.9).
4. **Trip planner is unreachable prototype scaffolding**, not a real feature yet (§2.10).
5. **No admin reporting page** — deleted, not rebuilt (§4.10).
6. **Business revenue page, admin dashboard, and several list-page toolbars** show real headline numbers surrounded by decorative/hardcoded UI — see each module's Partial notes for exactly which parts to trust.
7. **Checkout collects one participant per booking**, regardless of party size — schema supports more, UI doesn't ask (§2.3).
8. **`Destination` is a closed, seed-only catalog** — no admin or business UI to add one (§2.1).
9. **Password reset has no working email delivery** (§2.12).
10. **Admin roles are currently cosmetic** — every invited admin is Super Admin and nothing branches on role yet (§4.4).

Everything else described in this document as "Working" was verified — by direct code trace, by a passing `tsc`/`eslint`/`jest` run, and in the highest-risk cases by an actual browser session — during the sessions covered in the companion changelog document.

11. **Structural/naming debt** (found 9 Sept 2026) — the mechanical issues were fixed same day: `src/lib/actions.ts` split into `src/lib/actions/{session,customer,business}.ts`, the dead duplicate `use-mobile` hook removed, root-level scripts consolidated into `scripts/`, and portal-shell components (sidebars, switchers, `AccountLayout`) reorganized into `src/components/{business,admin,customer}/` consistently. **Still open, deliberately deferred**: a few route shapes diverge between portals — admin's sign-in path breaks the pattern customer/business use, the business portal's "list→edit" and admin's "list→view" shapes differ for the same underlying concept, admin bookings has no detail route (customer and business both do), and `/reviews` has no index page. These change real URLs/behavior rather than just renaming files, so they weren't fixed silently — see `SAFARINEXA_STRUCTURE_NAMING_AUDIT_2026-09-09.md` (repo root) for the full original findings.
