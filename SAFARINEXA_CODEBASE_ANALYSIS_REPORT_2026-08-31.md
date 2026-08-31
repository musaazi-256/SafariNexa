# SafariNexa codebase analysis

**Date:** 31 August 2026
**Scope:** full repository — architecture, data model, customer app, business portal, admin portal, and the in-progress (uncommitted) messaging feature.
**Method:** direct source review of the stack/config/schema, plus four targeted deep-dive passes verifying every finding from the prior 16 August audits (`SAFARINEXA_FUNCTIONAL_AUDIT_REPORT.md`, `SAFARINEXA_CROSS_PORTAL_WIRING_REPORT_2026-08-16.md`) against the current code, with file:line evidence. `tsc --noEmit`, `eslint`, and `jest` were run directly.

## Executive summary

The picture has changed substantially since the 16 August audits. The single biggest risk called out then — **checkout could create invalid, overbooked, or unauthorized bookings** — is now genuinely fixed: one transactional function (`validateAndReserveBookings`) is the sole path for both single and cart/multi checkout, enforces listing/business/date/capacity rules, and atomically decrements `Availability`. The synthetic-review bypass, the wrong-business-on-create bug, the destructive room-edit bug, and several admin notification/reconciliation bugs are also fixed. TypeScript now passes cleanly (it didn't on 16 August), lint is clean, and 15/15 tests pass.

Two things still stand between this and a real launch:

1. **Payments are still not actually live.** The "Simulate success/failure" buttons are gone and a real Stripe webhook + refund integration exists, but nothing in the app ever creates a Stripe Checkout Session or PaymentIntent — `processPaymentAction` unconditionally marks every payment (including `"stripe"`) as `SUCCESSFUL` and the booking `CONFIRMED` itself. It looks like a real gateway integration but no gateway is ever actually asked to confirm funds.
2. **A wide layer of "looks real, isn't wired" UI remains**, concentrated in the admin portal (dashboard, bookings, businesses list) and the business revenue page: buttons, filters, exports, date-range pickers, and — in the dashboard's case — freshly-added real database queries whose results are computed and then never rendered. This is easy to miss on a click-through and should be triaged before anyone relies on these screens operationally.

The uncommitted messaging feature currently in the working tree (booking chat + pre-booking inquiries) is solid: fully wired, correctly authorized, typechecks cleanly, with only minor polish gaps (silent failure handling, a duplicate-thread race condition, some duplicated JSX/logic).

## Architecture snapshot

- **Stack:** Next.js 14.2 (App Router), React 18.3, TypeScript 5.6, Prisma 5.22 + PostgreSQL, NextAuth v5 (beta), Zod, Zustand, Tailwind + Radix UI, Stripe SDK + `@stripe/stripe-js`, Recharts, Jest.
- **Size:** 229 `.ts`/`.tsx` files under `src/`; 83 routes (`page.tsx`); 61 client components. ~12.1k LOC in `src/app`, ~10.5k in `src/components`, ~2.0k in `src/lib`.
- **Three surfaces, one codebase:** customer app (`src/app/**`), business portal (`src/app/business/(portal)/**`), admin portal (`src/app/admin/(portal)/**`), gated by `src/middleware.ts` using prefix matching plus `session.user.isAdmin` for admin routes. The auth split is sound at the routing layer.
- **Data model** (`prisma/schema.prisma`, 892 lines): well-normalized — identity/auth, a polymorphic `Listing` with four type-specific 1:1 tables (accommodation/tour/restaurant/transport), `Booking`→`Payment`→`Refund`/`Payout`, `Review` uniquely keyed per booking, an `AuditLog`, and `MessageThread`/`Message`. Good touches: `BookingAddOn` snapshots name/price at booking time so later `AddOn` price edits can't rewrite history; `Review.bookingId` is `@unique`, which is what makes the review-integrity fix (below) actually enforceable at the DB level, not just in application code.
- **Hygiene:** `next.config.mjs` has no `ignoreBuildErrors`/`ignoreDuringBuilds` escape hatches, so type/lint errors would actually block a build — good. `prisma/seed.ts` (1,942 lines) is upsert-based and idempotent.
- **Operational risk in the build script:** `package.json`'s `build` script is `prisma generate && prisma db push --accept-data-loss && prisma db seed && next build`. Fine for a prototype pointed at a throwaway DB; genuinely dangerous if ever pointed at a production database with real user data — `db push --accept-data-loss` can silently drop columns/data, and it runs on every deploy. This should move to `prisma migrate deploy` with seeding removed from the production build path before go-live.
- **Env/provider drift:** `.env.example` documents Flutterwave as the payment provider ("Payments — Flutterwave... leave blank to run the payment flow in simulated/placeholder mode") and lists no Stripe variables at all, while the only gateway code actually wired up (`src/lib/stripe.ts`, the webhook, admin refunds) is Stripe. Anyone deploying from the documented env file won't know Stripe needs configuring. The `PaymentProvider` enum (`FLUTTERWAVE`, `MTN_MOBILE_MONEY`, `AIRTEL_MONEY`, `CARD`, `STRIPE`) still reflects the original multi-provider ambition, not what's implemented.
- **Test coverage is thin relative to the business logic now in place:** only `src/lib/booking.test.ts` and `src/lib/payments.test.ts` (15 tests total). There is no test coverage for `booking-service.ts`'s transactional reservation logic, the admin/business server actions, the Stripe webhook handler, or the new messaging actions.

## Booking, checkout, and payments

| Prior finding (16 Aug) | Current status | Evidence |
|---|---|---|
| Payments are a deliberate simulation | **Partial.** Simulate buttons removed; real card/mobile-money form + Stripe webhook exist, but `processPaymentAction` unconditionally marks every payment `SUCCESSFUL` for every method — no `stripe.checkout.sessions.create`/`paymentIntents.create` call exists anywhere, so the webhook can never actually fire from a real booking flow. | `src/app/payments/actions.ts:76-93`, `src/app/api/webhooks/stripe/route.ts:1-91`, `src/components/payments/payment-method-form.tsx:1-153` |
| Checkout can create invalid/unavailable bookings | **Fixed.** `validateAndReserveBookings` is the single booking-creation path: checks listing published, business approved, type match, valid/future dates, room existence/occupancy, and atomically decrements `Availability` with a `remaining < 0` guard inside `db.$transaction`. | `src/lib/booking-service.ts:1-218`, used at `src/app/checkout/page.tsx:87-104` |
| Cart/multi-checkout bypasses single-checkout protections | **Fixed.** Multi-checkout calls the exact same `validateAndReserveBookings`. | `src/app/checkout/multi/actions.ts:7-15`, `src/components/checkout/multi-checkout-form.tsx:52` |
| Availability overrides disconnected from booking | **Fixed at enforcement, not at management.** `tx.availability.upsert` decrements capacity per night/date during the booking transaction, which does stop overbooking. But nothing pre-booking reads it (search/detail show no live capacity or price override), and the business-side editor for setting capacity/price overrides is dead code — see Business Portal below. So today `Availability` rows exist only as auto-created-by-booking artifacts, not a managed inventory. | `src/lib/booking-service.ts:69-88,112-126` |
| Review integrity bypassed via synthetic `TEST-REV` booking | **Fixed.** No `TEST-REV` string remains anywhere; all four listing-detail pages now call `findEligibleReviewBooking`, which only returns an id for a real `COMPLETED`/`REVIEW_PENDING` booking with no existing review. | `src/lib/listings.ts:103-108`, e.g. `src/app/accommodation/[id]/page.tsx:52,79,224` |
| Refunds/payouts not operational | **Substantially real, with one caveat.** Admin `approveRefund` calls real `stripe.refunds.create` and transactionally updates `Refund`/`Payment`/`Booking`; `processAllPayouts` computes commission via `src/lib/revenue.ts` and creates real `Payout` rows. Caveat: since no real Stripe PaymentIntent is ever created (see row 1), `providerReference` on most payments isn't a valid Stripe id, so the gateway refund call is only meaningful for the (currently unreachable) Stripe path — mobile-money/card "refunds" are DB-state changes only. | `src/app/admin/(portal)/payments/page.tsx:62-163`, `src/lib/revenue.ts` |

`npx tsc --noEmit` now **passes with zero errors** (it failed on 16 August).

**Bottom line for payments:** this is the one area where the gap between "looks integrated" and "is integrated" is largest and highest-stakes. The webhook and refund plumbing being real makes it easy to assume the whole path is live; it isn't, because nothing initiates a real charge.

## Business portal (`src/app/business/(portal)/**`)

| Area | Status | Evidence |
|---|---|---|
| Business Profile | **Working.** No longer "Coming soon" — real `updateBusinessProfile` action with `db.businessProfile.update` and audit logging. Only the Notifications tab is still a disabled placeholder ("Save preferences (Coming Soon)"). | `src/lib/actions/business-settings.ts:9-51`, `src/app/business/(portal)/settings/page.tsx:242-246` |
| New listing → active business | **Fixed.** Uses `requireBusinessSession()` + the `active_business` cookie, not the user's first business. | `src/lib/business.ts:16-38`, `listings/new/page.tsx:61,97` |
| Accommodation edit destroying rooms/add-ons | **Fixed.** Transactional diff-by-ID: updates existing rows, creates new ones, and only deletes rows with zero existing bookings — bookings referencing a room type can no longer be orphaned or FK-broken by an edit. | `listings/[id]/edit/page.tsx:80-118`, `src/components/business/room-type-editor.tsx:61` |
| Team management | **Working.** Merged into Settings → "Staff Access": real invite/remove/cancel actions with owner-protection and audit logging. | `src/lib/actions/team.ts:11-141` |
| Business Messages | **Working.** Real `MessageThread`/`Message` queries scoped to the business, not mocked. | `messages/page.tsx:13-47` |
| Revenue dashboard | **Partial.** Stat-card totals (gross/commission/net/refunded) are real, from actual payment data. Everything decorative around them is hardcoded: comparison percentages, sparkline data, the date-range label, Export, the payout-breakdown line items, and the filter chips/search/page-size controls are static. Only pagination is functional. | `src/app/business/(portal)/revenue/page.tsx:84-91,112-182,233-290,416-421` |
| Availability editor | **Orphaned dead code.** No route exists under `.../availability/`; `availability-calendar-editor.tsx` is never imported anywhere and takes an `action` prop it never receives. `Availability` has no read call-site in the codebase — it is written only, inside the booking transaction. | grep confirmed no importers; `prisma/schema.prisma:593` |

## Admin portal (`src/app/admin/(portal)/**`)

| Area | Status | Evidence |
|---|---|---|
| Verification | **Partial.** Status changes are real and now correctly notify the business **owner** (fixed — this used to go to the admin), with audit logging. But despite a 336-line rewrite, reviewer notes are still hardcoded to `"Processed via admin portal"` — there's no notes textarea in the UI. | `src/lib/actions/admin.ts:26-71`, `verification/page.tsx:60` |
| Businesses | **Partial.** Search and verification-status tabs are real filters. Filter, Export, column-sort, and the row overflow menu remain non-functional decoration. | `businesses/page.tsx:35-40,64-134` |
| Users | **Partial.** "Add user" now genuinely works (`inviteAdmin` creates User+AdminUser, logs an audit event). Export was quietly removed rather than fixed. `toggleAdminAccess` still has no transition validation and still doesn't write an audit log. | `users/new/page.tsx:25`, `admin.ts:77-138`, `users/page.tsx:52-60` |
| Reviews | **Working (fixed 18 Aug).** Status changes now notify both the review author and all business owners, and log a `admin_moderate_review` audit event. | `reviews/page.tsx:44-97` |
| Payments | **Working (fixed 18 Aug).** Refund approval transactionally syncs `Refund` and `Payment` status together, so the old "refunded totals silently read zero" bug can't recur; a real `Payout` model and creation flow now exists. | `payments/page.tsx:62-163` |
| Reports | **Deleted, not fixed.** The entire admin Reports page was removed on 16 August (same day as the audit that flagged its date-range control as non-functional) and nothing replaced it — the sidebar's "Insights" group now links only to Settings. The platform currently has **no admin analytics/reporting surface at all.** | `git log --diff-filter=D`; `src/components/admin-sidebar.tsx:61-63` |
| Bookings | **Partial.** The 454-line rewrite added real DB-backed status tabs with live counts, a working search form, and real pagination — a genuine improvement. Filter, Export, the date-range picker, column-sort, and the row overflow menu are still inert. | `bookings/page.tsx:36-77,285-371` |
| Dashboard | **Partial, largely cosmetic.** The 469-line rewrite adds many real `Promise.all` queries, but most of what they compute is never rendered — `allTime`/`monthly` revenue summaries, published-listing count, confirmed/completed booking counts, recent support cases, top businesses, recent audits, and featured businesses are all fetched and then dropped. The headline KPI cards and several whole panels (Featured Businesses, Recent Platform Activity, Top Performers, Recent Actions) are still hardcoded literals. Only a handful of secondary stats use a `value > 0 ? real : fallback` pattern to actually surface live data. | `dashboard/page.tsx:36-136,274-358` |

## In-progress work: booking chat + inquiries (uncommitted)

The current working tree has an uncommitted messaging feature layered on the existing `MessageThread`/`Message` models, touching 6 page files, `src/lib/actions/messages.ts`, and two new components (`booking-chat.tsx`, `inquiry-dialog.tsx`).

- **What it does:** `InquiryDialog` on all four listing-detail pages lets a customer message a business pre-booking (`sendListingInquiryAction`, find-or-create a thread keyed on `businessId+customerId+bookingId:null`). `BookingChat` on both the customer and business booking-detail pages provides a booking-scoped thread (`sendBookingInquiryAction` → `createThread`).
- **Wiring:** complete — both components are actually imported and rendered where expected, both server actions are reachable only through them, and there's optimistic UI with rollback on send failure.
- **Authorization is sound:** `sendMessage` and `createThread` both verify the caller is the thread's customer or a member of the thread's business before allowing send/create.
- **Gaps worth fixing before merging:**
  - Send failures are only `console.error`'d and silently rolled back — no toast/inline error shown to the user (`booking-chat.tsx:75`, `inquiry-dialog.tsx:52`).
  - Thread creation is find-then-create with no unique DB constraint on `MessageThread` — concurrent double-submits can create duplicate threads.
  - Up to three `auth()` calls and ~5 DB round trips happen per message sent (each layer re-authenticates and re-fetches) — inefficient, not incorrect.
  - Inquiries about two different listings from the same business land in one shared thread (the dedup key ignores listing id), disambiguated only by a bracketed text prefix.
  - The action-row JSX block is duplicated near-identically across all four listing pages, and the chat-message-mapping logic is duplicated between the two booking-detail pages — both are good candidates for extraction once the feature stabilizes.
- `npx tsc --noEmit` passes cleanly against this uncommitted state.

## Recommended priority order

1. **Finish the payment gateway integration.** Add the actual `stripe.checkout.sessions.create` (or PaymentIntent) call so `processPaymentAction` reflects a real, provider-confirmed outcome instead of self-attesting success — this is the one remaining item standing between "looks like Stripe is wired up" and "can safely take real money." Reconcile `.env.example` and the `PaymentProvider` enum with whichever gateway(s) are actually being shipped.
2. **Triage the decorative-vs-real gap in admin/business reporting UI** — dashboard, bookings list, businesses list, revenue page. Either wire the buttons/filters/exports or visibly label them as not-yet-implemented so staff don't mistake them for working controls; delete the now-dead query computations in the admin dashboard or actually render them.
3. **Rebuild (or consciously drop) admin Reports** — it was deleted, not fixed, and the platform currently has no reporting surface.
4. **Give the Availability model a management UI** (or remove the dead editor component) and surface live capacity/price overrides on search/detail pages — right now it only prevents overbooking silently, with no way for a business to actually set overrides.
5. **Harden the new messaging feature** before/while committing it: add a unique constraint or transactional upsert for thread creation, surface send errors to the user, and collapse the redundant auth/DB calls.
6. **Fix the build pipeline before any real deployment**: replace `prisma db push --accept-data-loss` with `prisma migrate deploy` and take seeding out of the production build script.
7. Add test coverage for `booking-service.ts`, the Stripe webhook handler, and the admin/business server actions — the highest-value logic in the app is currently the least tested part of it.

## Uncommitted changes reminder

The working tree currently has real, unstaged changes (the messaging feature above) plus modifications to the same six listing/booking pages. No commit was made as part of this analysis — this is a read-only report.
