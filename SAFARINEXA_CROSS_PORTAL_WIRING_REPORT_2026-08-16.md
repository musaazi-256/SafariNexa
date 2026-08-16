# SafariNexa cross-portal wiring report

**Scope:** Customer application, Business Portal, Admin Portal, shared Prisma/PostgreSQL data model, and the end-to-end paths between them.  
**Audit date:** 16 August 2026  
**Method:** Read-only source review, form/action-to-model tracing, role/access review, TypeScript check, Jest, and lint. No application or database data was changed.

## Overall conclusion

SafariNexa is one shared Next.js application with a common Prisma database, so the three portals can communicate through the same records. The primary lifecycle is partly wired:

`Business onboarding/verification -> approved business -> published listing -> customer booking -> payment -> business response -> customer notification -> completed booking -> review -> business/admin views`

The following stages are genuinely connected: business verification, listing publication, most single-item checkout validation, simulated payment state changes, business confirmation/decline, verified-review eligibility, support replies, and basic refund approval state changes.

It is **not safe to operate as a production marketplace yet**. The greatest risks are the simulated payments, the under-validated cart/multi-checkout path, availability data that is not used for bookings/pricing, incomplete refunds/payouts, and several controls/dashboards that imply a function exists when it does not.

| Surface | Wiring assessment | Launch readiness |
| --- | --- | --- |
| Customer browse/search/detail/saved items | Mostly database-backed catalogue and real saved-item state | Usable with data-quality fixes |
| Customer single-item checkout | Validates more than before, but inventory is race-prone and lacks operational availability overrides | Not ready for live commerce |
| Customer cart/multi-checkout | Creates bookings from client cart data with major missing checks | Block or repair before launch |
| Payment and receipts | Database state is updated, but the payer chooses a simulated outcome | Demo only |
| Business listings and verification | Core records are shared with customer/admin views | Partly ready |
| Business operations | Booking response, reviews and messages are partly live; settings/profile and reporting have placeholders | Partly ready |
| Admin moderation/support | Primary queues read/write shared records | Partly ready; harden authorization/audit |
| Admin finance/reporting | Reads payment/refund records, but does not execute provider refunds or manage payouts | Not reliable for finance |

## End-to-end integration map

| Lifecycle event | Customer app | Business portal | Admin portal | Result |
| --- | --- | --- | --- | --- |
| Business submits onboarding/documents | Not visible to customers until approved | Creates `BusinessProfile`, owner membership, verification and documents | Verification queue reads records and changes status | Connected; document storage is local filesystem and not production-safe |
| Admin approves/rejects a business | Listings become eligible for customer display/checkout only after approval | Owner notification is created; status is visible | Status is updated in the verification record and business profile in one transaction | Connected |
| Business creates/edits listing | Published approved listings appear in catalogue | Form creates/updates the shared `Listing` and subtype records | Admin sees business/listing counts | Mostly connected |
| Customer makes a single booking | Booking and payment records created | Booking becomes visible after successful simulated payment | Booking/payment records visible | Connected but no transactional inventory reservation |
| Customer pays | Customer selects a method and then manually approves/fails simulation | Receives booking to respond to after simulated success | Payments page reads the record | Demo simulation, not payment processing |
| Business confirms/declines | Customer gets an in-app notification | Status is changed by business user | Admin booking view reads status | Connected; decline does not automatically initiate/refund payment |
| Customer cancels | Booking/refund request record is created | No notification/action flow for business | Admin can mark refund completed | Incomplete refund operation |
| Customer reviews completed booking | Review shown on listing and account | Business can view/reply | Admin can change moderation state | Correct eligibility on dedicated review flow; direct detail-page action needs a fresh server-side check |
| Customer opens support case | Customer can see/reply to case | No business-side support workflow | Admin can answer and notify customer | Connected customer/admin path only |

## What is correctly wired

- **Shared marketplace gate:** public detail/related-listing data is filtered to published listings whose business is approved. The single-item booking action independently rechecks listing publication, business verification, and listing type instead of trusting hidden form fields.
- **Business verification:** document submission creates/updates a `BusinessVerification`, and admin action synchronizes its status to `BusinessProfile` in a transaction. Owner in-app notifications use the correct owner user IDs.
- **Listing data flow:** listing base fields, destinations, accommodation rooms/add-ons, tours, restaurants and transport subtype fields persist through Prisma and are read by customer-facing detail pages.
- **Business context:** the active-business cookie is validated against real memberships by `requireBusinessSession`; new listings use that active business.
- **Single booking ownership/status:** payment, booking detail, cancellation, business response and review pages re-query the target records and enforce customer/business ownership in their server actions.
- **Review lifecycle:** `/reviews/new` requires a real booking owned by the customer in `COMPLETED` or `REVIEW_PENDING`, allows one review, then moves the booking to `REVIEWED`.
- **Support:** customers create `SupportCase` plus initial message; admin replies create a `SupportMessage`, update timestamp, and create a customer notification.
- **Messaging authorization:** message creation validates that a sender is either the thread customer or a member of the thread’s business.

## Critical findings — fix before launch

### 1. Payments are deliberately simulated

The customer payment form accepts a card number/CVV or mobile number, creates a `PROCESSING` payment, then `/payments/processing` presents **Approve Transaction** and **Decline Transaction** controls. No provider request, hosted/tokenised payment field, signature-verified webhook, idempotency key, reconciliation, or provider refund exists.

Impact: a customer can mark any own pending payment successful without paying; raw card data is posted to the application (though only a masked value is saved). Financial reporting and business fulfilment can be based on false payments.

Required remediation: use a provider-hosted/tokenised checkout; create a pending payment intent server-side; accept status changes only from signed, idempotent provider webhooks; implement reconciliation and provider refunds.

### 2. Cart/multi-checkout bypasses the protections added to single checkout

`createBulkOrderAction` only verifies that each listing exists. It does **not** check listing status, business verification, client item type against database type, dates/future dates, room existence, room occupancy, tour/transport capacity, restaurant reservation acceptance/capacity, or concurrent availability. It silently skips missing items but books all remaining ones, then creates order/bookings without a transaction.

Impact: draft/unapproved listings may be booked and paid for; invalid or over-capacity reservations may be created; partial orders are possible if one later booking create fails.

Required remediation: centralise one authoritative `validateAndReserveBooking` service used by both checkout paths. Wrap all order/booking/reservation writes in a transaction and return clear per-line failures rather than silently dropping items.

### 3. Availability is split and not authoritative

Business users can store `Availability.capacity`, `remaining`, and `priceOverrideMinor`, but customer calendars and checkout derive accommodation availability solely from bookings. The availability records are neither applied to prices/capacity nor atomically decremented. The single-item overlap query counts the whole date range once rather than every requested night and has a race between the count and booking creation.

Impact: manual closures, reduced capacity, and price overrides are invisible to customers; concurrent checkouts can overbook; a partial overlap can be incorrectly rejected/accepted.

Required remediation: model inventory by listing/room/date, lock or atomically decrement each requested date inside the booking transaction, and use the same resolver for search, detail, cart, checkout, and business calendar.

### 4. Refunds/payouts do not represent real money movement

Cancellation creates a `Refund` request for a successful payment. Admin **Approve refund** changes `Refund`, `Payment`, and `Booking` database statuses but does not call a payment provider, handle partial/rejected/refund-in-progress outcomes, prevent duplicate refund requests, or notify the customer/business. “Net to businesses” is a 12% render-time calculation; no payout recipient, ledger, schedule, or paid state is modelled.

Impact: staff may believe money has been refunded or paid out when it has not; finance figures are not an auditable ledger.

Required remediation: build provider-backed refund state machine/webhooks, one or more idempotency/amount guards, notifications, and a payout/settlement ledger before exposing financial controls.

### 5. The project does not currently typecheck

`npm run typecheck` fails. There is a stale generated route reference to the deleted admin reports page, incompatible props in the new admin profile page, a verification action return type mismatch, and an impossible `UserRole`/`"ALL"` comparison in the users page.

Impact: the app is not in a clean shippable build state. The stale `.next` type also indicates route deletion was not followed by a clean build.

Required remediation: restore/remove the reports route reference cleanly, correct component props/action signatures, validate/filter query enums, then run a clean production build in CI.

## High-priority integration gaps

| Finding | Evidence and impact | Required result |
| --- | --- | --- |
| Business decline is not tied to refund | A paid booking can become `CANCELLED_BY_BUSINESS`; no refund request, provider action or customer financial notice follows. | Apply agreed cancellation policy and create/refund/notify through one workflow. |
| No business notifications for new paid bookings/cancellations | Payment success only notifies the customer. Customer cancellation does not notify business. | Notify owner/staff in-app and by configured channel, respecting preferences. |
| Guide creation ignores selected business | `guides/new` uses `session.user.businessIds[0]`, unlike listing creation’s active-business resolver. | Use `requireBusinessSession()` in the action; enforce guide belongs to selected business. |
| Role-based permissions are not implemented | Business roles (OWNER/MANAGER/STAFF) and admin Role/Permission tables exist, but portal mutations typically require any membership or any admin. | Authorize each privileged action by explicit role/permission, particularly invitation, listing status, verification and finance actions. |
| Team invitation is incomplete | It creates a pending invitation but has no duplicate/role/owner validation, email delivery, resend/revoke UI, revalidation, or expiry job. | Complete invitation lifecycle and audit it. |
| Review action on listing details uses stale eligibility | It captures `eligibleBooking` from page render, then writes without re-querying ownership/status/review existence in the action. | Use the same authoritative review service as `/reviews/new`. |
| Admin mutation audit coverage is inconsistent | Verification and invite actions audit, but refund completion, review moderation, support status/reply and admin suspend/reactivate do not consistently audit/revalidate. | Audit and revalidate every privileged mutation. |
| Query filters trust enum-like URL strings | Admin users/reviews/verification cast URL text straight to Prisma enum types. Invalid values can produce runtime errors. | Parse against allow-lists and treat invalid values as absent/400. |
| Local document uploads are unsafe operationally | Uploads use `public/uploads` and supplied URLs; no file type/size/scanning/object storage/access control. | Use private object storage, validation/scanning, signed admin access and retention policy. |

## Forms/displays that are disconnected or misleading

### Customer app

- **Trip planner** is wholly mocked. The page ignores `TripPlan`/`TripPlanItem`; save/share/add/edit buttons do not persist and routes such as saved itinerary slugs do not correspond to records.
- **Saved payment methods and billing preferences** display mocked card/mobile-money data. Remove/add/toggle controls do not persist; there is no payment-method model.
- **Forgot password and email verification** are placeholders; no delivery/verification/reset implementation exists.
- **Customer messaging is absent from customer routes.** Threads can be created/sent in server actions and the business inbox can reply, but there is no customer message inbox/CTA tied to a booking.
- **Search UI has fields such as pickup/drop-off and dates, but data/filter parity must be verified per listing type.** It should use the same availability/price service as checkout rather than a client-only query interpretation.

### Business portal

- **Settings** displays real business values in fields but has no form/action; Save, Discard, Delete, website, profile description and all notification toggles are visual only. These fields therefore cannot feed the public/business data anywhere.
- **Dashboard** mixes real headline queries with hard-coded identity (“Grace”), time labels, comparison percentage, auto-cancellation promise, static chart data and a profile button with no destination. Treat it as presentation, not operations data.
- **Revenue/Earnings charts, comparison values, payouts, filters, search, date range and export include mock/static behaviour.** This must be labelled or made real before staff use it for decisions.
- **Messages:** existing thread/message data is read and sent through server actions, but New message, unread indicator/time display, customer profile activity and attachments include mock UI behaviours. There is no notification of a new message and no customer inbox.
- **Business Profile page** at `/business/profile` remains a Coming Soon placeholder, while `/business/settings` presents a non-saving version of similar fields; consolidate into one working path.
- **Verification help/contact controls** do not open a relevant support case; the document upload page UI only exposes a URL input although the server action can handle a `File`.
- **Listing status controls need action-level verification/role validation.** A staff member with basic membership can potentially publish/archive; the business approval gate is only in the page selection path, not a clear shared authorization service.

### Admin portal

- **Payments/refunds table is real data but says “payouts” without a payout model or workflow.** The Transactions/Refunds tabs are visual only.
- **System status footer** (“all systems operational”, uptime, response time, active users) is hard-coded and has no monitoring input. This is particularly risky for an admin portal.
- **Users page** has a visual Filter button and no export. “Add user” creates an `INVITED` admin row, but sends no invitation and does not assign a deliberately chosen scoped role.
- **Business search/filter/export and several dashboard metrics/actions are visual only.** Do not present them as live staff tools until backed by query/action code.
- **Reports route was deleted from the source tree but stale generated route types remain.** Restore a real reports page or remove all navigation/build references and clean `.next` in CI.
- **Admin review moderation** changes status but does not notify customer/business or create an audit entry. Review summary category scores are UI-derived/dummy because no category-rating fields exist in the schema.
- **Support works customer-to-admin only.** The support schema’s `surface` field is not used in the customer opening form, and no business support queue/triage is exposed.

## Data-model coverage gaps

The existing schema is a solid foundation, but the following UI promises have no corresponding operational model or data source:

- payment-method vault/token and billing preferences;
- payout account, settlement, commission/final amount and payout state;
- per-date, per-room inventory reservation/hold and cancellation release;
- notification preferences/delivery attempts/email/SMS provider state;
- customer-facing message inbox/read status/attachments;
- trip-plan CRUD/share permissions;
- business website/public-address/profile management fields (some visual settings do not exist on `BusinessProfile`);
- review sub-scores/category data;
- file metadata/access control/virus-scanning state;
- staff invitation delivery, acceptance and revocation events.

## Verification results

| Check | Result |
| --- | --- |
| `npm test -- --runInBand` | Passed: 2 suites, 15 tests |
| `npm run lint` | Completed with warnings (mainly raw `<img>` use; two missing alt attributes) |
| `npm run typecheck` | Failed: 6 errors, described above |
| Production build | Not attempted after typecheck failure; do not treat a prior/stale `.next` output as a successful build |

## Recommended delivery order

1. **Block real-money launch; replace the simulated payment screen** with provider-hosted checkout and signed idempotent webhooks.
2. **Create one booking/inventory domain service** and route both single and multi-checkout through it. Validate all business/listing/type/date/capacity rules and atomically reserve inventory.
3. **Implement refunds and payouts as audited financial workflows** with provider calls, notifications, ledger entries and reconciliation.
4. **Fix build health and authorization:** resolve all TypeScript errors, clean stale generated artefacts in CI, validate URL enums, and enforce business/admin roles at every mutation.
5. **Complete cross-portal notifications:** business new booking/cancellation/refund events, customer refund/booking state events, message notifications, and persisted communication preferences.
6. **Replace or clearly label all visual-only controls/data.** Prioritise business settings/profile, trip planning, saved payment settings, business/admin reporting, exports and system status.
7. **Add end-to-end tests** for: onboarding -> verification -> listing -> single/cart booking -> payment webhook -> business confirm/decline -> cancellation/refund -> completion/review -> admin financial/support/report views. Include concurrent booking tests and multi-business context tests.

## Key code evidence

- Authoritative checks in single checkout: `Prototype/src/app/checkout/page.tsx`.
- Under-validated multi-checkout: `Prototype/src/app/checkout/multi/actions.ts`.
- Simulated payment completion: `Prototype/src/app/payments/processing/page.tsx`.
- Booking response/customer notification: `Prototype/src/app/business/(portal)/bookings/[id]/page.tsx`.
- Cancellation/refund request: `Prototype/src/app/bookings/[id]/page.tsx`.
- Shared but disconnected availability data: `Prototype/prisma/schema.prisma`, `Prototype/src/lib/listings.ts`, and business availability editor.
- Listing/create active-business behaviour: `Prototype/src/app/business/(portal)/listings/new/page.tsx`, `Prototype/src/lib/business.ts`.
- Active-business bug in guide creation: `Prototype/src/app/business/(portal)/guides/new/page.tsx`.
- Non-persisting business settings: `Prototype/src/app/business/(portal)/settings/page.tsx`.
- Mock trip planner/payment settings: `Prototype/src/app/trip-planner/page.tsx`, `Prototype/src/app/trip-planner/[id]/page.tsx`, `Prototype/src/app/profile/payment-settings/page.tsx`.
- Admin finance state-only refund: `Prototype/src/app/admin/(portal)/payments/page.tsx`.
