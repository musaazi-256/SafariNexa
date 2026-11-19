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

**Demo sign-in (4 Nov 2026):** with demo mode on (default), sign-in cards are prefilled with the seeded account and one click signs in via the passwordless `demo` provider; no `AUTH_SECRET` is needed (a public demo secret is used — see `getAuthSecret()` in `src/lib/dev-mode.ts`). Live mode requires `AUTH_SECRET`. The hosted database does **not** receive schema changes on deploy — push them manually with `prisma db push`.

**Auth:** NextAuth v5 with Google OAuth and a credentials provider, per surface (`src/auth.ts`, edge-safe config in `src/auth.config.ts`). **As of 1 Nov 2026**, `AUTH_DEV_MODE` is a validated-but-inert legacy flag (`src/lib/dev-mode.ts`) — it no longer bypasses credential checks or elevates any session to admin on any surface; the real blank-login-as-demo-admin shortcut and the blanket `AUTH_DEV_MODE`-based admin elevation were removed as release hazards. The seeded demo accounts (`customer@safarinexa.test`, `business@dev.test`, `admin@safarinexa.test`, all password `Passw0rd!`) still sign in, but only through the normal, now-hardened credentials path (real bcrypt-matched password, and for admin, a real `ACTIVE` `AdminUser` record). A separate, explicit dev-only convenience (one-click quick-sign-in buttons in `src/components/auth-card.tsx`, gated to `process.env.NODE_ENV !== "production"`) submits through that same real path — it never renders on any deployed build, including Vercel previews.

**The seed script runs on every deploy, not just the first one.** `package.json`'s `build` script is `prisma generate && prisma db push --accept-data-loss && prisma db seed && next build` — every Vercel deploy re-runs `prisma/seed.ts` against whatever database is configured. This is deliberate self-healing for the four core demo businesses (one per category — accommodation/tours/restaurants/transport) and their seed-defined listings: their `upsert` calls' `update` clauses force `verificationStatus`/`status` back to `APPROVED`/`PUBLISHED` on every run (fixed 12 Oct 2026 — previously `update: {}` was a no-op on existing rows, so testing an admin Suspend/Reject action against one of these businesses on the live site silently broke it forever, since no later deploy ever repaired it). This only touches the seed's own known IDs — anything created later through the real product UI is untouched.

**Money:** all prices are stored as `*Minor` integer fields (minor currency units, e.g. UGX has no subunit so these are whole-shilling integers) — never floats.

**Payments — read this before assuming anything works:** **As of 1 Nov 2026**, the old `processPaymentAction` self-attested-success path (which unconditionally marked every method, including `"stripe"`, as `SUCCESSFUL` with no gateway ever contacted) was removed. Checkout now creates a real **Stripe-hosted Checkout Session**, and the webhook (`src/app/api/webhooks/stripe/route.ts`) validates payment identity, amount/currency, and payable state with idempotency guards before confirming a booking. **However, no Stripe keys are configured in this environment** — with `STRIPE_SECRET_KEY` blank, checkout honestly disables itself with an unpaid message rather than faking success. Mobile money is modeled in the schema/UI but has no gateway call-sites. Admin refunds (`src/app/admin/(portal)/payments/page.tsx`) call the real Stripe refund API for Stripe-labeled payments. **Net effect: the payment flow is real but inert** (no provider configured) rather than simulated-successful — don't treat a "payment successful" screen as proof of settlement until Stripe keys are added and reconciled. See `SAFARINEXA_FIXES_AND_VERIFICATION_2026-11-01.md` for full detail.

**Images:** the shared `ImageUploader` (`src/components/ui/image-uploader.tsx`) base64-encodes photos client-side and stores them as text directly in Postgres — there is no object storage integration. It does enforce a 10MB/file, image-type-only, and a photo-count cap as of 9 September 2026, but the storage mechanism itself is still base64-in-DB.

**Figma designs (18 Nov 2026):** the Figma files are generated from the running app, not drawn by hand. `npm run capture` (`scripts/capture/`) records every page, tab, dialog and menu of the three surfaces plus the booking journey into `design/handoff/`, and the plugins in `design/figma-captured/` rebuild them in Figma from GitHub `main`. `src/capture-fresh.test.ts` fails until UI changes are recaptured.

**This document, and the companion changelog, are themselves a module:** `/docs`, `/docs/changelog`, `/docs/overview` (`src/app/docs/**`), rendering markdown from `content/docs/*.md` via `src/lib/docs.ts`, linked from the public `SiteFooter`. **Public** — no auth gate. Kept up to date as part of every code change per the standing rule in `CLAUDE.md`.

---

## 2. Customer portal

### 2.1 Discovery — Explore, Search, Destinations, Guides
**Status: Partial.**
- `/` (`src/app/page.tsx`), `/explore` — real, DB-backed listing grids.
- `/search` (`src/app/search/page.tsx`) — the main search experience, backed by `SearchBar`/`SearchFilters`/`MobileFilters`. Guest/passenger-count filters and text/city search genuinely query the database (`Prisma.ListingWhereInput`). **However**, the property-type, tour-type, vehicle-type, cuisine, and amenities filters do a plain substring match against listing title/description rather than querying the real structured columns the business forms save (`AccommodationListing.propertyType`, `TourListing.tourType`, etc.) — the underlying data is correct, the filter reading it isn't always.
- `/destinations`, `/destinations/[slug]` — real, but `Destination` rows are **seed-only**; there is no create/edit UI anywhere in the product for admin or businesses to add a new destination.
- `/guides`, `/guides/[id]` — real, backed by the `Guide` model.
- **Fixed 12 Oct 2026**: `/`, `/explore`, `/destinations`, `/destinations/[slug]`, and `/guides/[id]` had no `searchParams`/`auth()`/dynamic-rendering signal, so Next.js statically prerendered them once at build time and never re-queried the database again — new listings, verification approvals, and reviews silently never appeared on the deployed Vercel site (invisible locally, since `next dev` always renders fresh). All 5 now carry `export const revalidate = 60`, so they re-fetch at most once a minute.

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
**Status: Working but unconfigured — see §1.**
- `/payments`, `/payments/success`, `/payments/cancelled`, `/payments/receipt`. Checkout now hands off to real Stripe-hosted Checkout rather than collecting a raw card form; the webhook confirms payment before any booking is marked paid (fixed 1 Nov 2026 — previously `processPaymentAction` self-attested every method as `SUCCESSFUL`). With no Stripe keys configured in this environment, checkout is disabled with an explicit unpaid message instead of faking success. Receipt/success pages now derive their state from real owned payment records — an unpaid booking can no longer show a "Payment successful" receipt.

### 2.5 Bookings management
**Status: Working.**
- `/bookings` (list), `/bookings/[id]` (detail) — real, shows payment history, room/add-on detail (now snapshotted so it survives a later room edit), booking-scoped chat, and cancel/refund-request actions. Cancelling an unpaid booking now correctly restores room availability (fixed 9 Sept); cancelling a paid booking creates a `Refund` request that an admin must action.

### 2.6 Reviews
**Status: Working.**
- `/reviews/new` — a review can only be written against a real completed booking with no existing review (`findEligibleReviewBooking` in `src/lib/listings.ts`); the previous synthetic-booking bypass is gone. **As of 19 Nov 2026**: star rating input, 20-character minimum, booking summary card; a missing rating is rejected instead of saved as 1 star. The direct-review forms on listing pages share the star input but keep their own looser server checks.

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
**Status: Working, as of 1 Nov 2026 — was Placeholder.**
- `/trip-planner/[id]` now persists an owned itinerary to the `TripPlan`/`TripPlanItem` models that previously sat unused; add/edit/remove/save/copy-to-share controls work against a real detail URL reachable from `/trip-planner/new`. It still does not create or hold a reservation — it's a planning tool, not a booking path.

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
- **Added 19 Nov 2026**: `/business/getting-started` — an eight-step setup guide whose progress is computed from real records (`src/lib/business-getting-started.ts`); a progress card on the dashboard links to it until every step is done.
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
- **Added 19 Nov 2026**: `/business/listings/[id]/preview` shows the saved listing (or pending draft revision) in the traveller layout, with Edit and Submit for approval. It is a separate layout (`components/business/listing-preview.tsx`), not the public detail page, so changes to the public pages need mirroring there.

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
**Status: Partial — real totals and allocations, some decorative chrome remains.**
- `/business/revenue` — the headline stat totals (gross/commission/net/refunded) are real, computed from actual `Payment` rows. **As of 1 Nov 2026**, these now derive from real booking-level payment allocations including multi-business orders, replacing some of the previously simulated revenue-chart data. The comparison percentages, date-range picker, and some line items may still be hardcoded/non-functional — not fully re-audited item-by-item since the 1 Nov remediation; verify against `SAFARINEXA_FIXES_AND_VERIFICATION_2026-11-01.md` before trusting anything beyond the headline totals.

### 3.9 Verification
**Status: Working**, business side. Every page and action in the verification and listing-approval flows is documented in `/docs/verification` (`content/docs/verification.md`), and captured step by step as Figma journeys.
- **As of 19 Nov 2026**, `/business/verification` is the verification outcomes page: the business decision plus every listing's latest review outcome and reviewer notes. Document upload lives at `/business/settings/verification`.
- `/business/settings/verification` — document upload (real file write, same serverless caveat as onboarding) and a status banner that now shows real, status-specific copy plus the admin's actual reviewer notes when present (fixed 9 Sept — previously a static "under review" regardless of real status). Document deletion now works via a real dropdown action (added 9 Sept).

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

**Confirmation step (added 4 Nov 2026):** irreversible or high-impact actions — reject a business submission or listing, approve-and-publish a listing, flag (fraud-hold) a business, suspend an admin, approve a refund, hide a review, close a support case, sign out — open a confirmation dialog before submitting (`src/components/admin/confirm-submit.tsx`). Reversible actions still submit on one click.

### 4.1 Dashboard
**Status: Working, as of 1 Nov 2026 — was Partial.**
- `/admin/dashboard` — a substantial rewrite (25 Aug) added many real database queries; as of 1 Nov 2026, admin dashboard activity/health metrics that were previously hardcoded/simulated were replaced with real queries as part of the same remediation that fixed business revenue (§3.8). Not every literal panel has been individually re-verified since — if a specific number looks suspiciously round, check it against the database before relying on it. Empty-state mock rows in the verification/support panels no longer look clickable (fixed 9 Sept). The dashboard also now links to a real `/admin/audit` route (added 1 Nov 2026 — previously linked twice but 404'd).

### 4.2 Verification queue
**Status: Working.** Per-page actions, rules and outcomes for business verification and listing approval: `/docs/verification`.
- `/admin/verification` — approve/request-changes/flag actions correctly sync `BusinessProfile.verificationStatus` in one transaction, and now carry a real reviewer-notes textarea that reaches the business owner's notification (fixed 9 Sept — previously hardcoded to a generic string). **Added 1 Nov 2026**: `/admin/verification/[id]` detail route (the dashboard linked to it before this date, but only the collection route existed — a reproduced 404). Verification documents now live in private storage with content/type/size validation; old public `/uploads` URLs are intercepted and require admin authorization (`src/lib/private-documents.ts`).

### 4.3 Businesses
**Status: Working.**
- **As of 20 Nov 2026**: the listing review (`/admin/listings/[id]`) keeps the reviewer's progress (opened photos and documents) per submission for the browser tab, and the portal's background refresh pauses while a review or any unsaved form is in progress (`src/components/live-refresh.tsx`). Before this, the minute-by-minute refresh cleared typed notes and review progress on every admin and business page.
- **Added 19 Nov 2026**: listing rows on `/admin/businesses/[id]` open `/admin/businesses/[id]/listings/[listingId]`, a read-only listing record (traveller view / all fields, booking and rating stats, review history). `/admin/listings/[id]` (listing verification) was rebuilt in the business-verification layout with the same decision rules.
- `/admin/businesses`, `/admin/businesses/[id]` — search and status-tab filtering are real. **As of 1 Nov 2026**, "Filter" submits a real URL-backed search and "Export" downloads the visible rows as CSV, replacing the previously decorative toolbar pattern described here before that date. The row's dead "⋮" overflow menu was removed (11 Sept) — a working "View" link/button already sat next to it in the same row, so the menu offered no real destination of its own.

### 4.4 Users & access
**Status: Working.**
- `/admin/users`, `/admin/users/new` — invite/promote and suspend/reactivate are both real, with audit logging (the suspend/reactivate action was hardened 31 Aug — it used to trust an unvalidated client field and log nothing). **Fixed 1 Nov 2026**: invitations no longer default every invite to Super Admin — sensitive finance/user-management/verification/support/moderation actions enforce role-appropriate permissions server-side rather than a single blanket `isAdmin` gate.
- **Added 2 Nov 2026**: permission levels are now a real, built feature, not just schema. `/admin/users/new` has a real "Permission level" dropdown — `inviteAdmin()` used to hardcode every invite to one role regardless of what the inviter picked (there was no picker). `/admin/users` now shows and can change an existing admin's permission level in place (not your own row — mirrors the suspend guard). `/admin/roles` lists every permission level with what it grants and lets a Super Admin edit that (new permission key `roles.manage`, held only by Super Admin via the hardcoded role-name bypass — never granted through data, so no lower level can self-escalate); `/admin/roles/new` creates a new one. Starter levels beyond Super Admin/Support Agent: Finance Manager (`payments.manage`), Verification Reviewer (`businesses.manage`), Content Moderator (`reviews.moderate`).
- **Admin identity is now separate from customer identity** (fixed 9 Sept): `/admin/profile` reads/writes `AdminUser.displayName`/`phone`, not the shared `User` fields — previously an admin who started as a customer would see (and could overwrite) their customer-entered name here.

### 4.5 Bookings
**Status: Working.**
- `/admin/bookings` — real status tabs, search, and pagination; now also shows which room/add-ons a booking was for (fixed 9 Sept). **As of 1 Nov 2026**: added `/admin/bookings/[id]` (previously this surface had no detail route, unlike customer/business); "Filter" and "Export" now submit real URL-backed search/CSV download; the decorative date-range picker and row overflow menu were removed rather than left as inert controls.

### 4.6 Reviews
**Status: Working.**
- `/admin/reviews` — moderation actions notify both the review author and the business owner and write an audit log entry.

### 4.7 Payments & refunds
**Status: Working**, with the caveat from §1.
- `/admin/payments` — refund approval transactionally syncs `Refund`/`Payment`/`Booking` status and calls the real Stripe refund API for Stripe-labeled payments (though, per §1, very few payments will actually carry a real Stripe reference today); payout batching creates real `Payout` records.

### 4.8 Support
**Status: Working.**
- `/admin/support`, `/admin/support/[id]` — real case list and threaded reply, shared with the customer-side support system.
- **Business support (added 4 Nov 2026):** `/business/support` and `/business/support/[id]` — business users open and follow cases inside the business portal (`SupportCase.surface = BUSINESS`, optional related booking). Customer `/support` shows only customer cases.

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

One list, so nothing here is repeated-but-inconsistent across the sections above. **Updated 1 Nov 2026** — several long-standing items on this list were resolved that day; they're kept below, struck through in spirit (marked **Resolved**) rather than deleted, so the history of what used to be wrong here isn't lost.

1. **No live payment gateway configured** — real Stripe-hosted checkout exists as of 1 Nov 2026 (§1, §2.4), but no Stripe keys are set in this environment, so checkout is honestly disabled rather than faking success. Mobile money remains unimplemented as a live integration.
2. **Images are base64-in-Postgres**, not object storage (§1) — guardrails exist, storage mechanism doesn't scale. Listing photos now upload separately to a validated image endpoint (`src/lib/listing-images.ts`, 1 Nov 2026) rather than embedding multi-megabyte data URLs in server-action bodies, but the underlying storage is still local/DB-backed, not durable object storage.
3. **Verification/onboarding documents**: verification documents moved to private, access-controlled storage with validation (**Resolved**, 1 Nov 2026 — `src/lib/private-documents.ts`). Onboarding document upload still writes to the local filesystem and remains a pre-deployment blocker (§3.1) — not covered by the 1 Nov private-storage fix.
4. **Trip planner is unreachable prototype scaffolding** — **Resolved**, 1 Nov 2026 (§2.10): now a real, persisted itinerary feature.
5. **No admin reporting page** — still true. `/admin/audit` (added 1 Nov 2026) is an audit log, not an analytics/reporting page — don't conflate the two (§4.10 unchanged).
6. **Business revenue page and admin dashboard**: real allocations/queries replaced several previously hardcoded figures as of 1 Nov 2026 (§3.8, §4.1), but neither has been re-audited line-by-line since — treat any suspiciously-round or unlabeled number with the same caution as before until it has.
7. **Checkout collects one participant per booking**, regardless of party size — schema supports more, UI doesn't ask (§2.3). Unchanged.
8. **`Destination` is a closed, seed-only catalog** — no admin or business UI to add one (§2.1). Unchanged.
9. **Password reset has no working email delivery** — expiring single-use tokens were added 1 Nov 2026 for reset/invitation-acceptance, but delivery depends on a configured email provider (`RESEND_API_KEY`) that is not set in this environment, so this has not been exercised against a real inbox end to end. Treat as partially resolved: the workflow is real, the delivery leg is unverified.
10. **Admin roles**: **Resolved**, 1–2 Nov 2026 (§4.4) — invitations no longer default to Super Admin, role-appropriate permission checks gate sensitive actions server-side instead of a single `isAdmin` gate, and as of 2 Nov 2026 there's a real UI (`/admin/roles`) to see and edit what each permission level grants, plus a role picker at invite time and an in-place role-change control on `/admin/users` — this was previously schema-only with no UI on top of it.

Everything else described in this document as "Working" was verified — by direct code trace, by a passing `tsc`/`eslint`/`jest` run, and in the highest-risk cases by an actual browser session — during the sessions covered in the companion changelog document. For the 1 Nov 2026 batch specifically, see `SAFARINEXA_FULL_PRODUCT_ENGINEERING_AUDIT_2026-11-01.md` and `SAFARINEXA_FIXES_AND_VERIFICATION_2026-11-01.md` (repo root) for full line-level detail — this document summarizes, it doesn't replace them.

11. **Structural/naming debt** (found 9 Sept 2026) — the mechanical issues were fixed same day: `src/lib/actions.ts` split into `src/lib/actions/{session,customer,business}.ts`, the dead duplicate `use-mobile` hook removed, root-level scripts consolidated into `scripts/`, and portal-shell components (sidebars, switchers, `AccountLayout`) reorganized into `src/components/{business,admin,customer}/` consistently. **Still open, deliberately deferred**: a few route shapes diverge between portals — admin's sign-in path breaks the pattern customer/business use, the business portal's "list→edit" and admin's "list→view" shapes differ for the same underlying concept, admin bookings has no detail route (customer and business both do), and `/reviews` has no index page. These change real URLs/behavior rather than just renaming files, so they weren't fixed silently — see `SAFARINEXA_STRUCTURE_NAMING_AUDIT_2026-09-09.md` (repo root) for the full original findings.

12. **Re-verification hides listings** (found 20 Nov 2026) — an Approved business that uploads another verification document goes back to Submitted, and every public page requires an Approved business, so all its listings disappear from the marketplace until an admin approves it again. The upload form doesn't warn about this. Needs a product decision (e.g. keep listings live during re-verification, or warn before submitting). See `/docs/verification` §2.3.
