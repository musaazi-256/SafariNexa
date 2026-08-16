# SafariNexa functional and integration audit

**Scope:** customer app, business portal, admin portal, and the data paths between them.  
**Date:** 16 August 2026  
**Method:** source/data-flow review, public-route smoke checks, TypeScript check, Jest tests, lint, and production-build attempt. No production data was changed.

## Executive result

The catalogue and core UI are working as a **prototype/demo**, not yet as a production-ready marketplace. Public catalogue pages render and the existing unit tests pass, but key booking, payment, availability, refund, notification, and reporting behaviours are either simulated, incomplete, or can report misleading values.

| Area | Result | Readiness |
| --- | --- | --- |
| Customer browsing, search, listing details, saved items | Mostly connected to real listing data | Usable with fixes below |
| Customer checkout and booking | UI works; server-side commercial validation is incomplete | Not ready for real bookings |
| Payments | Simulated success/failure only; no provider/webhook integration | Not production-ready |
| Business listing creation/editing | Most customer-facing listing fields are saved | Needs data integrity and destination fixes |
| Business operational portal | Bookings/reviews/messages are partly connected; profile and several controls are visual only | Partly ready |
| Admin moderation and verification | Primary queues are connected to data | Needs notification, authorization and reporting corrections |
| Admin payments/reports | Displays data, but refunds/payouts and several reporting controls are incomplete or inaccurate | Not reliable for financial operations |

## Verification performed

- Jest: **15/15 tests passed** (booking and payments helper tests).
- TypeScript: **passed**.
- Lint: completed with eight warnings, mainly unoptimised `<img>` use and two missing `alt` attributes.
- Public HTTP routes returned 200: `/`, `/accommodation`, `/tours`, `/restaurants`, `/transport`, `/guides`, `/destinations`, `/search`, `/cart`, `/safety`, and `/admin/login`.
- Protected `/trip-planner`, `/support`, and `/business` redirect to sign-in as expected.
- Production build could not complete because the `build` command runs `prisma db push --accept-data-loss` and seed first; Prisma's schema engine fails against the configured local PostgreSQL database. The compile stage was therefore not reached.

## What is correctly connected

- The public listing-detail pages only show published listings whose business has approved verification. Their displayed title, description, price, city/address, map coordinates, images, rooms, amenities, policy, guide, and reviews are read from the database.
- Business listing forms persist the main listing fields and the relevant type-specific fields (accommodation, tour, restaurant, and transport) through Prisma.
- Successful simulated payment moves a booking/order to `AWAITING_BUSINESS_CONFIRMATION`, and the business booking page exposes confirmation/decline actions.
- Admin verification updates both the verification record and the related business profile status in one transaction.
- Admin reports use live counts for bookings, reviews, support cases, payments, listings, and approved businesses; they are not wholly static mockups.

## High-priority gaps

1. **Payment processing is a simulation, not a real payment integration.** The customer explicitly clicks “Simulate successful/failed payment”; there is no provider API, signed webhook, idempotency protection, reconciliation, or secure payment tokenisation. Do not accept real money with this flow.

2. **Checkout can create invalid or unavailable bookings.** Server-side booking creation does not verify that a listing is published and its business is approved, that the route type matches the listing, that dates are valid/future, that a selected room exists, that capacity is respected, or that the room is available. Client-side controls are not enough because requests can be altered.

3. **Availability overrides are disconnected from booking.** The schema and business availability editor maintain `Availability` rows, but customer availability is derived only from existing booking rows. Price overrides and `remaining` capacity are not applied at search, detail, or checkout; overbooking remains possible during concurrent checkout.

4. **Refunds and payouts are not operational.** Refund records are only seed/demo data: there is no customer request, business/admin approval, provider refund call, payment-status update, or payout ledger. The commission is a flat render-time 12% calculation rather than an auditable payout model.

5. **Review integrity is bypassed.** Each customer listing-detail page creates a synthetic completed “TEST-REV” booking whenever a signed-in user has no eligible booking, then accepts the review. This permits reviews without a real completed stay/tour/ride/reservation.

6. **Editing an accommodation is unsafe once bookings exist.** Saving its form deletes every room type and add-on and recreates them. Existing bookings reference room types, so this can fail due to foreign-key constraints; even where deletion succeeds, IDs and historic relations are lost.

7. **New listings are assigned to the user’s first business, not the currently selected business.** This breaks a multi-business owner’s active-business context and can put a listing under the wrong business.

8. **Verification status notices are delivered to the administrator, not the business owner.** The transaction creates a `Notification` using the admin’s user ID even though the message tells the business about its result.

## Business-form to customer-app coverage

| Customer information | Business form/data source | Assessment |
| --- | --- | --- |
| Name, description, city, address, coordinates, base price, cover/gallery photos | Listing base form | Connected |
| Accommodation property type, rooms, add-ons, amenities, check-in/out, guest limit, policy | Accommodation form | Connected; enforce required check-in/out and preserve room IDs on edit |
| Tour type, duration, group limits, difficulty, inclusions/exclusions, itinerary, guide | Tour form | Connected; validate min ≤ max and ensure the selected guide belongs to the current business |
| Restaurant cuisine, price range, hours, menu, seats, reservations allowed | Restaurant form | Saved; booking must enforce seats/hours/reservation setting |
| Transport category, vehicle, passenger limit, duration, pricing model | Transport form | Saved; booking must enforce passenger limit and availability |
| Destination pages and destination breadcrumbs | `Listing.destinationId` | **Missing from business listing forms.** New business-created listings cannot be assigned to a destination, so they will not appear correctly in destination journeys and curated destination counts.
| Business’s public profile/contact | Business profile model | **Missing UI.** The portal’s Business Profile page is “Coming soon”; customers cannot rely on business-managed public profile information.
| Dynamic room availability and override prices | Availability model/editor | **Not connected** to customer selection, pricing, or checkout.

## Admin portal reporting assessment

- **Verification queue:** The status change correctly syncs to `BusinessProfile`, but reviewers cannot add contextual notes in the admin UI; every decision saves the generic “Processed via admin portal”. Fix recipient notifications and add reviewer notes/doc validation.
- **Businesses:** Listing count and verification state are real. Search, filters, export, column sorting and overflow actions are visual only.
- **Users/access:** User lists are real and existing admins can be suspended/reactivated. “Add user” and export do nothing. The status-changing action should validate allowed transition values and write an audit log.
- **Reviews:** Status changes are real, but there is no customer/business notification or moderation audit record.
- **Payments:** Transaction rows are real. “Refunded” metric reads `Payment.status`, while the separate `Refund` records are never reconciled into that status, so refunded totals can be zero even when refund records exist. There is no actual payout state/model.
- **Reports:** Counts are live. The All-time/This Month/This Week control is explicitly visual only, and the label “Published listings” does not filter out listings belonging to unapproved businesses. Financial figures inherit the payment/refund limitations above.
- **Business revenue dashboard:** It derives totals from payments, but has hard-coded comparison percentages, charts, payout-breakdown amounts, date controls, filters, search and export. These are presentation placeholders and should not be used for operating decisions.

## Other missing or incomplete functions

- Forgot-password and email verification screens are placeholders; no email delivery/reset workflow is implemented.
- Business profile management is explicitly “Coming soon”.
- Dashboard quick actions, booking export/calendar, revenue export/filter/date range, admin exports, and many search/filter controls have no backing action.
- Message inbox uses mocked active-tab/unread/time UI behaviours; confirm its actual thread workflow before launch.
- Review summary shows dummy category scores, not data collected from reviewers.
- Live email delivery is not connected for verification updates; provider credentials fall back to dummy values in development configuration.

## Recommended remediation order

1. Make booking creation transactional and authoritative: validate publication/verification/type/date/capacity, lock or atomically reserve inventory, and use the `Availability` model in both price and capacity calculations.
2. Replace simulated payment completion with provider-specific server integrations and verified, idempotent webhooks. Never collect raw card data in the app; use hosted/tokenised provider fields.
3. Implement refunds and payouts as stateful workflows/ledger entries; reconcile `Refund`, `Payment`, `Booking`, business revenue, and admin reporting.
4. Remove synthetic review bookings. Allow reviews only from a real completed booking and introduce review eligibility/notification.
5. Add destination selection to listing create/edit forms, enforce type-field validation, validate guide ownership, and honour the active-business cookie when creating a listing.
6. Replace delete/recreate accommodation edits with ID-preserving updates; block/archive rooms that have bookings instead of deleting them.
7. Finish functional controls and remove/label all visual-only metrics/actions before staff use the portals for operations.
8. Correct notification recipients, add audit logging to every privileged mutation, and add integration tests for the cross-portal lifecycle: listing → approval → booking → payment webhook → business confirmation → completion → review/refund → admin reports.

## Code evidence

- Checkout lacks the required booking validations: `Prototype/src/app/checkout/page.tsx:78`.
- Payment outcome is deliberately simulated: `Prototype/src/app/payments/processing/page.tsx:37`.
- New listing ignores active selected business: `Prototype/src/app/business/(portal)/listings/new/page.tsx:58`.
- Accommodation edit deletes and recreates rooms/add-ons: `Prototype/src/app/business/(portal)/listings/[id]/edit/page.tsx:71`.
- Listing parser contains no `destinationId`, range or guide-ownership validation: `Prototype/src/lib/business-listing-form.ts:18`.
- Verification notice uses the admin as recipient: `Prototype/src/lib/actions/admin.ts:46`.
- Payout/commission is a flat render-time calculation: `Prototype/src/lib/revenue.ts:1`.
- Report period controls are visual only: `Prototype/src/app/admin/(portal)/reports/page.tsx:66`.
- Review summary category metrics are dummy values: `Prototype/src/components/reviews/review-summary.tsx:4`.
- Business profile management is a placeholder: `Prototype/src/app/business/(portal)/profile/page.tsx:4`.
