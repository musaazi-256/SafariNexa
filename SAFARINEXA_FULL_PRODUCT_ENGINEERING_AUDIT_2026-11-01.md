# SafariNexa — full-product engineering and UX audit
Date: 1 November 2026  
Scope: local `Prototype` application; customer, business and admin surfaces. Review only; no fixes implemented.

## Executive assessment

**Not ready for real payments or a public production launch.** The prototype has substantial working foundations, but several screens imply financial or operational completion that the underlying workflow does not deliver. Cross-app communication is partly implemented, not consistently end-to-end.

The most important problems are: tour reservations fail at checkout; the main payment action manufactures successful payments without calling a provider; unpaid bookings can display successful receipts; payout processing does not transfer funds; and authentication/build defaults must be separated from production.

This is an evidence-backed prototype audit, **not a claim that every page, state, device and integration has passed testing**. All 85 page-route definitions were inventoried. Representative pages across every major surface were opened; selected workflows were exercised, and server actions/schema were traced. The companion route inventory distinguishes browser coverage from source-only/external flows.

### Evidence notation
- **UI**: reproduced through the local running browser.
- **Code**: confirmed by implementation review; impact not necessarily exploited.
- **Helper test**: executed directly against a pure helper.
- **Unexecuted**: external/destructive/production-dependent action intentionally not performed.

## Checks and environment
- TypeScript: `npm run typecheck` passed.
- Jest: `npm test -- --runInBand` passed, 3 suites / 18 tests. These do not constitute cross-app or gateway coverage.
- Lint: passed with 11 warnings, including image optimization and an image-alt warning.
- Development app ran at localhost:3000.
- Full production build was **not run**: the configured build pushes the database schema with `--accept-data-loss` and seeds it. A build must not mutate an operational database.
- Existing development authentication changes role behavior. A customer session could access admin UI under the development override; this does **not** establish a production authorization bypass. Repeat permission tests with development overrides disabled.
- Mobile spot checks included a 390px viewport. This was not a full browser/device/accessibility matrix.
- Test side effects: one clearly labelled local support case and admin reply were created and the case closed; a tour was added to local browser cart. The tour checkout transaction failed before creating a booking. No real payment, refund, payout, invitation or business approval was performed.
- Previous audit documents were not assumed to describe the current app.

## 1. Release blockers

### R01 — Payment form records payment success without collecting money
**P0 · Code · customer → business → admin**

`src/app/payments/actions.ts:10` reads the chosen method, constructs its own provider reference, sets bookings/order to CONFIRMED and creates a SUCCESSFUL payment. No card/mobile-money provider is contacted. The action also lacks a pending-only transition and payment-attempt idempotency, so replay can create duplicate successful records.

**Impact:** unpaid bookings become confirmed, customer receipts and admin/business financial views cannot be trusted. The presence of a Stripe webhook elsewhere does not fix this action.

**Solution:** move simulation behind an explicit nonproduction adapter with conspicuous demo labels. In production, create a payment attempt, initiate a provider checkout, and confirm only after a verified, reconciled provider event. Use hosted/tokenized card collection rather than the current raw-card prototype form. Validate allowed method, amount, currency, ownership and payable state server-side. Add unique idempotency keys and replay tests.

### R02 — Tour checkout fails on availability foreign key
**P0 · UI + Code**

Reproduction: open Lake Bunyonyi Canoe Day Trip → choose 6 December 2026 / 2 travellers → add to cart → Checkout now → enter traveller details → Proceed to payment. The UI exposes a Prisma `Availability_roomTypeId_fkey` error.

`src/lib/booking-service.ts:160–164` writes `roomTypeId: ""` for a non-accommodation inventory row. That field is a RoomType foreign key; an empty string is not a valid room identifier.

**Solution:** redesign inventory identity so a tour departure does not require a fictitious room. Use an inventory-resource entity or separate valid uniqueness constraints for rooms and departures, backed by a migration. Test tour single/cart checkout, concurrent reservations, cancellation and inventory release. Return a safe actionable error, not a database exception.

### R03 — Success receipt can be shown for an unpaid booking
**P0 · UI + Code**

Opening `/payments/receipt?bookingId=cmsxv7epl000s49qnmq7uhicj` for the owned pending booking showed both “Payment successful” and “Payment required”, with UGX 1,800,000 labelled as paid and no payment method. `/payments/success` also presents completion/email claims without proving settlement.

**Solution:** derive receipt state from verified payment records; otherwise show a clearly unpaid/pending invoice. Bind success pages to an authorized, reconciled checkout reference. Only claim an email was sent after a real delivery event.

### R04 — Refund and payout screens overstate actual money movement
**P0 · Code · Unexecuted**

`src/app/admin/(portal)/payments/page.tsx:63` marks non-Stripe refunds COMPLETED without issuing a provider refund. A partial requested amount still marks the whole payment and booking REFUNDED. The Stripe request lacks an idempotency key. Inventory release is not performed here.

At line 115, “Settle payouts” creates COMPLETED payout records and associates payments, but performs no banking/provider transfer. It selects only booking-linked payments, excluding order-level payments created by multi-checkout.

**Solution:** keep refund/payout requests pending until external settlement confirmation. Add provider transaction IDs, immutable ledger entries, idempotency and reconciliation. Allocate order payments to child bookings/businesses. Track refunded amounts separately from original gross; support partial refunds correctly. Release inventory through one canonical cancellation/refund workflow. Restrict finance actions to explicit finance permissions.

### R05 — Demo authentication and database-mutating builds are release hazards
**P0 · Code**

- `src/components/auth-card.tsx:44–52`: blank credentials fall back to seeded demo accounts and a known password, without an environment guard.
- `src/auth.config.ts:15`: hardcoded fallback authentication secret.
- `src/auth.ts:261`: AUTH_DEV_MODE gives sessions admin status. Production guards exist elsewhere, but this still makes local negative-role tests misleading.
- `package.json:7`: build runs `prisma db push --accept-data-loss` and `prisma db seed`.

**Solution:** remove blank-login fallbacks from deployable forms; isolate demo accounts/data and fail closed on missing production secrets or development flags. Separate build, reviewed migrations and explicitly authorized seed steps. Verify no demo administrators exist in production. Add configuration checks that fail CI/deployment.

## 2. Cross-app workflow and data-integrity gaps

### R06 — Stripe webhook has an invalid notification recipient and weak replay reconciliation
**P1 · Code · Unexecuted**

`src/app/api/webhooks/stripe/route.ts:57,74` assigns a Business ID to Notification.userId (a User foreign key). A normal event can therefore fail its transaction. The handler replaces its session lookup reference with a payment-intent reference, weakening replay lookup, and lacks a durable processed-event constraint and sufficient amount/currency/payment-state reconciliation.

**Solution:** resolve authorized business-member User IDs; retain checkout-session and payment-intent IDs separately; persist provider event IDs uniquely; reconcile amount/currency/status before state changes. Use a transactional outbox for notifications and retry safely.

### R07 — Order cancellation/refunds do not follow order-level payments
**P1 · Code**

Multi-checkout stores payment against Order. Child-booking cancellation checks booking payments, so a paid child can take an unpaid-cancellation branch without a refund request. Order status and booking status can diverge. Business child-booking payment history can be empty despite an order payment.

**Solution:** define payment allocations per booking. Derive paid/refundable/settled amounts from allocations everywhere. Update parent aggregate state transactionally; test cancelling one child, multiple businesses and partially refunded orders.

### R08 — Availability has competing sources and missing merchant controls
**P1 · Code**

Reservations write Availability counters, while calendar calculations also derive occupancy from booking statuses. REFUNDED is not excluded from blocking bookings in that calendar path. An AvailabilityCalendarEditor exists but is not mounted in a page. Price override data is not applied by the booking service. No complete expiring-hold workflow was found.

**Solution:** one inventory service for quoting, holds, confirmation, release and merchant closures. Expose an actual business availability editor. Expire abandoned payment holds; prevent double releases and concurrent overselling; make calendar and checkout consume the same service.

### R09 — Date validation accepts impossible stays
**P1 · Helper test + Code**

`src/lib/booking.ts:7` clamps nights to at least one. Executed checks returned one night for both same-day and reversed dates. A subsequent `nights <= 0` check cannot reject those values.

**Solution:** validate raw end-date > start-date before pricing; normalize timezone rules and reject past/invalid dates. Add tests across all entry points, not just form min attributes.

### R10 — Category-specific business rules are not consistently enforced
**P1 · Code**

Transport checkout uses per-participant pricing despite configurable fixed-fare pricing. Restaurant booking does not enforce the reservation-request setting, seating capacity and opening hours as an integrated workflow. Tour minimum group size is not enforced alongside maximum capacity.

**Solution:** implement typed category quote/availability policies with shared server validation and matching UI labels. Either support each advertised reservation mode or clearly disable it.

### R11 — Business acceptance and booking completion are incomplete
**P1 · Code**

The payment action immediately CONFIRMS bookings, bypassing the business “awaiting confirmation” response path. A complete operational transition into COMPLETED/REVIEW_PENDING was not found for newly created bookings; review eligibility can depend on seeded rather than reachable states.

**Solution:** agree a single booking state machine: reservation/hold → payment pending → paid and awaiting acceptance (if required) → confirmed → fulfilled → review eligible. Define rejection, no-show, cancellation and refund branches. Wire business actions and scheduled jobs to those transitions, with customer notifications.

### R12 — Listing edits can target unscoped child records
**P1 · Code; not exploited**

Room/add-on updates use submitted child IDs without consistently restricting those IDs to the authorized parent listing. Some parent/subtype writes occur outside the subsequent child-record transaction.

**Solution:** load and verify every submitted child ID against the authorized accommodation/listing, reject foreign IDs and wrap the complete edit atomically. Test with two independent business accounts and forged foreign IDs.

### R13 — Non-refundable room setting cannot be saved reliably
**P1 · Helper test + Code**

`src/lib/business-listing-form.ts:66–67` defaults an absent checkbox to true. An unchecked checkbox is absent, so the executed parser test returned `isRefundable: true`.

**Solution:** submit explicit boolean state (or treat absent as false in an expected submitted row). Round-trip test create/edit/reload and the customer cancellation-policy display. Also test clearing optional values: undefined updates can retain stale data instead of clearing it.

### R14 — Role administration does not enforce the intended permission model
**P1 · Code; negative access matrix incomplete**

Admin access is largely an isAdmin gate rather than per-action permissions. Invitation assigns SuperAdmin without a complete invitation acceptance/delivery lifecycle. JWT role/business claims can remain stale until refreshed; suspending a user does not necessarily revoke an existing session immediately. Business membership is not equivalent to owner/finance/editor authorization.

**Solution:** enforce permissions server-side for every sensitive action, scope all queries, use least-privilege default roles and implement invite expiry/acceptance. Add session-version or revocation checks and two-tenant authorization tests with AUTH_DEV_MODE disabled.

### R15 — Verification uploads are public and insufficiently validated
**P1 · Code**

Verification/onboarding writes documents into public/uploads using user-influenced file information, without sufficient server MIME/type/size enforcement. Placeholder document fallback can also represent an upload that never happened. Local filesystem storage is not durable across many deployment models.

**Solution:** private object storage, signed reviewer URLs, server size/type/content validation, safe generated filenames, access logging and a retention policy. Require real documents before submission; keep demo substitutes isolated.

### R16 — Messaging is substantially connected, but read state and notification coverage need repair
**P1 · Code**

sendMessage/getThreadMessages check thread access and revalidate customer and business views: a positive foundation. However, `src/lib/actions/messages.ts:126` markThreadAsRead authenticates the caller without checking thread membership. One readAt value also cannot represent per-staff read state. A durable new-message notification/delivery pipeline is not connected here.

**Solution:** centralize thread authorization for all actions; use participant read cursors, input limits and transactional message/outbox writes. Test customer → business → customer, multi-staff unread behavior and unauthorized thread IDs.

## 3. Broken routing and nonfunctional controls

### R17 — Admin dashboard links lead to missing pages
**P1 · UI + Code**

- `/admin/audit`: linked twice in dashboard (lines 219 and 341), returns 404.
- Dashboard verification review links to `/admin/verification/<id>`, but only the collection route exists; representative link returns 404.

**Solution:** implement authorized detail/audit pages or link to an existing filtered page and focus the relevant record. Add a route/link smoke test for every navigation item and table action. A direct `/admin/reports` also returns 404, but no active reference was established, so it is not counted as a broken active control.

### R18 — Payments “Pending” filter crashes
**P1 · UI + Code**

`/admin/payments?status=pending` feeds PENDING into Prisma PaymentStatus although the enum uses states including PROCESSING, not PENDING. The page shows a runtime exception.

**Solution:** whitelist and map query parameters to domain enums before queries. Invalid filters must show a safe fallback or validation message; test all advertised tabs and malformed query strings.

### R19 — Enabled-looking controls do nothing
**P1/P2 · Code, with representative UI clicks**

Representative clicks confirmed no navigation/dialog/state change for business View business profile, Calendar view, Export, listing Filters, revenue Export, verification Contact support, admin businesses Filter and verification Bulk Action.

Source inspection found the following additional unbound controls. These are **reviewed candidates**, not a claim that every one was clicked:

| Surface | Controls needing implementation or honest removal |
|---|---|
| Admin bookings | Fixed date selector; Export report; Filter; Export; row ellipsis |
| Admin businesses | Filter; Export |
| Admin payments | Filter; Export |
| Admin users | Filter |
| Admin verification | Bulk Action |
| Business bookings | Export; Calendar view; Filters |
| Business dashboard | View business profile |
| Business listing edit | Actions |
| Business listings | Filters |
| Business revenue | Fixed August date selector; Export; Filters; row ellipsis |
| Business reviews | Filters; standalone Reply; menu Flag as inappropriate / Contact customer |
| Business verification | Contact support |
| Trip planner detail | Share; Save Itinerary; Add Item; Edit; Add Another Day |
| Shared/footer | Social links and verification Learn more use # placeholders |

The review reply form itself exists; the separate Reply button is the disconnected control. Dropdown triggers and Room “More details” wrappers were excluded from the static dead-control count because wrapper behavior can be valid.

**Solution:** maintain a control contract: intended action, server operation/route, pending/success/error state and permission. For exports implement scoped downloadable CSV; for filters use validated URL state; for profile/support navigate to real destinations; for menus implement commands or disable with explanatory copy. Never leave a prominent enabled CTA inert.

### R20 — Trip planner is a mock editor with runtime problems
**P1/P2 · UI + Code**

Index advertises coming soon, but `/trip-planner/new` resolves through the dynamic mock editor with non-saving controls. The client page imports an async server header; browser logs showed async-client/request-context/hydration errors.

**Solution:** either gate the entire feature consistently or implement an authenticated persisted itinerary model and real editor. Keep server header outside the client editor boundary.

## 4. Product design, UI and accessibility

### R21 — Dashboard information is not consistently sourced from live operations
**P1/P2 · UI + Code**

Admin KPI/activity/featured sections mix static arrays with database queries. “System operational”, uptime/latency/user counts are not backed by monitoring. Business greeting names/activity timestamps and fixed date selectors are misleading. Some charts explicitly label simulated data, which is an improvement, but surrounding operational claims need the same honesty.

**Solution:** tag every widget as live, demo or unavailable. Derive counts from shared definitions and date filters. Hide operational-health claims until real probes/telemetry exist. Dashboard totals must reconcile with drill-down tables and finance allocations.

### R22 — Mobile search has horizontal overflow
**P2 · UI**

At viewport width 390px, the search page measured approximately 514px scroll width and pushed a listing CTA offscreen. Business dashboard/messages did not exhibit document-level overflow in the same spot checks; admin verification cards wrapped successfully. Wide data tables need deliberate horizontal-scroll affordances, not blanket claims of broken responsiveness.

**Solution:** fix minimum widths/grid children (`min-width:0`), wrap controls, provide narrow-screen cards or explicit table scrolling; add 360/390/768/desktop visual regressions.

### R23 — Customer flow labels and saved/account context are inconsistent
**P2 · UI + Code**

Tour checkout uses accommodation/check-in terminology and a cart breadcrumb that returns home. Tour cart editing exposes a generic traveller limit inconsistent with tour-specific limits. “Reserve” and “Add to cart” can lead to the same cart behavior despite different expectations. Saved-profile preferences did not prefill the observed traveller form. Some shared listing cards show sign-in-to-save links even when customer detail controls recognize the signed-in user.

**Solution:** category-aware labels and field constraints; correct breadcrumb destinations; distinct or honestly renamed CTAs; consistent session/saved state in shared cards. Prefill only verified applicable preferences and let customers override them. Requote server-side and disclose any price change before commitment.

### R24 — Accessibility and error recovery need a dedicated pass
**P2 · UI + Code**

Examples include unattached labels for date/select controls, unnamed icon actions, very small text, nested interactive link/button patterns and a missing image-alt lint warning. Checkout exposed raw Prisma internals. No comprehensive custom loading/error/not-found recovery layer was found.

**Solution:** semantic single interactive elements, associated labels, accessible names, visible focus, error summaries/live regions and usable tap targets. Add error boundaries and safe retry paths. Run keyboard and screen-reader tests plus automated accessibility checks; contrast/WCAG compliance has not been certified by this audit.

### R25 — Feature discoverability and unfinished lifecycle screens
**P2 · UI + Code**

Admin support and business guides exist but are not obvious in primary navigation. Business profile/team now correctly redirect to settings routes; they should not be described as missing pages. Customer payment settings and password recovery/verification retain coming-soon or placeholder behavior. Admin settings is explicitly disabled rather than falsely functional.

**Solution:** align navigation with supported roles/features. Finish account recovery and verification before public onboarding. Gate genuinely unfinished features consistently and explain the next available action.

## 5. DevOps and reliability assessment

### R26 — Deployment and observability controls are not demonstrated
**P1 · Code / evidence limitation**

No tracked Prisma migration history or repository CI workflow was found in the inspected locations. A running dev server, passing typecheck and mocked helper tests do not prove production readiness. Verification files stored locally, nondurable notifications and synthetic health widgets create operational blind spots.

**Solution:**
1. Separate app build from migrations and seed; use reviewed migration history, deployment backups and tested restore.
2. Add CI for lint/typecheck/unit tests, database integration tests and browser journeys.
3. Use explicit environments, validated secrets, managed database connections and private durable document storage.
4. Add structured error reporting, provider-event and outbox retry monitoring, reconciliation alerts and actual readiness/liveness checks.
5. Exercise production-mode build/start with isolated staging data, then configure rollback and smoke tests.
6. Define owners/runbooks for failed payments, webhook backlog, unaccepted bookings, refund/payout failures and data restoration.

The 10MB image-upload allowance also exceeds the default server-action request size unless the transport is changed/configured; next.config does not supply an explicit override. Treat this as a source-derived risk and test real upload boundaries. Prefer direct signed object-storage uploads rather than large data URLs.

## 6. Cross-app wiring summary

| Data/workflow | Current assessment | Required contract |
|---|---|---|
| Business listing → customer catalogue | Shared database and published/verified checks exist; category/edit edge cases remain | Authorized atomic edit → publication policy → consistent public quote |
| Customer tour → booking/business/admin | Checkout blocked by inventory FK | Valid inventory identity → reservation → all authorized views |
| Customer payment → booking/business/admin finance | Appears connected, but success is fabricated | Provider-confirmed ledger → booking transition → notifications |
| Order payment → child cancellation/payout | Allocation path incomplete | Per-booking allocations and aggregate order status |
| Business availability → customer calendar | Editor not mounted; ledger/calendar disagree | One inventory service and visible merchant controls |
| Customer/business messaging | Access checks in send/read queries; mark-read gap | Authorized participant state + notification delivery |
| Customer support → admin → customer | **UI-tested end to end successfully**, including reply and close | Preserve behavior; expose admin entry point and test role isolation |
| Business verification → admin review → public eligibility | Data/actions exist; dashboard detail link broken; uploads unsafe | Secure real documents, reachable review, audited decision |
| Booking fulfillment → verified review | Completion transition not established | Fulfillment state/job → eligible review → moderation/public display |
| Admin dashboard → source records | Mixture of real and hardcoded information | Reconciled live metrics with accurate drill-downs |

## 7. Recommended implementation sequence

### Gate A — trustworthy demo and safe development
Owner: engineering lead.
- Clearly disable real-payment claims; fix R02 tour booking, R03 receipts and R18 filter crash.
- Remove unguarded demo-login defaults, fallback secret and destructive build behavior.
- Remove/disable dead CTAs and repair dashboard links.
Acceptance: all advertised demo journeys complete honestly; no false payment/settlement claims, raw database errors or active 404 links.

### Gate B — correct commerce and authorization
Owners: backend/payments + platform.
- Agree booking state machine and implement canonical quote/inventory services.
- Integrate real provider sandbox checkout, idempotent webhooks, allocations, refunds and payouts.
- Scope child edits, enforce permissions/session revocation and protect verification documents.
Acceptance: isolated two-business/two-customer integration tests prove no cross-tenant access; payment replay, failures, partial refunds and concurrent inventory tests pass.

### Gate C — complete operational workflows and product polish
Owners: frontend/product + business operations.
- Wire filters, exports, calendars, support and reply controls.
- Implement acceptance/fulfillment/review transitions, notification delivery and truthful dashboards.
- Fix responsive search, account continuity, accessibility and upload UX.
Acceptance: supported user tasks work on narrow/desktop screens with keyboard access and meaningful feedback.

### Gate D — release qualification
Owner: DevOps/QA.
- Production-mode build/start in staging; reviewed migrations, backup restore, observability and rollback.
- Automated browser journey suite plus provider sandbox and production-like authorization tests.
Acceptance: reproducible release checklist, no unresolved P0/P1 finance/security/data-integrity findings and signed-off role/flow coverage.

## 8. Required end-to-end regression suite
Use isolated fixtures, not the shared demo database.
1. Guest discovery/search/filter → auth returnTo → saved item.
2. Each category: merchant creates/edits → admin eligibility → customer discoverability and correct quote.
3. Accommodation single/cart and tour single/cart: valid dates, invalid/reversed dates, group bounds and simultaneous last-place bookings.
4. Mixed-business order → provider pending/success/failure/cancel; duplicate/reordered webhook; stale amount and rejected signature.
5. Business accept/reject → customer status/notification → fulfillment → eligible review → business reply/admin moderation.
6. Single and order-child cancellation → partial/full refund → inventory release → customer receipt/admin ledger/business revenue.
7. Payout request → provider success/failure → reconciliation; no double settlement.
8. Customer/business message, attachments if supported, unread state and unauthorized thread mutation.
9. Verification upload → safe reviewer access → approve/reject → customer catalogue eligibility.
10. Support submit → admin reply → customer reply → close/reopen, with ownership checks.
11. Signup/verification/recovery/OAuth; invited admin activation; suspended-session revocation; staff permission matrix.
12. Every enabled CTA and menu item, valid/invalid URL filters, missing IDs, empty/loading/error states, keyboard and mobile layouts.

## Coverage limitations
No real provider transactions, OAuth-provider completion, full new-account/invite recovery lifecycle, destructive finance/admin actions, database failover/restore, concurrency/load testing or full screen-reader/device matrix were executed. Dynamic routes were sampled with representative records, not every record. Passing unit tests do not cover these omissions. The route inventory records browser visits separately from successful workflow completion.

**Bottom line:** preserve the working shared-data/support foundations, but prioritize truthful money state, reliable inventory, tenant authorization and reachable business operations before visual expansion or production rollout.

