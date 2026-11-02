# SafariNexa remediation and verification
Work started: 1 November 2026; final verification: 2 November 2026. Code: Prototype. This document supplements, rather than replaces, the original audit.

## Outcome
Substantial cross-app, booking, payment-safety, authorization, routing, data-source and responsive-layout fixes are implemented. **This is not a production/payment-provider certification, and not every original recommendation is fully closed.** Real mobile-money collection and business payouts remain unavailable rather than being represented as successful.

## Implemented changes
### Booking and inventory
- Tour inventory uses a deterministic departure ID with a null room foreign key, fixing the reproduced checkout failure without a fictitious RoomType.
- Serializable reservation transactions count existing reservations, including legacy seeded bookings, and handle repeated inventory resources within one cart.
- Invalid, reversed and same-day accommodation stays are rejected. Participant bounds and tour minimum/maximum size are enforced.
- Room/date availability and price overrides are honored; merchant availability editor is reachable from listing editing.
- Calendar exclusions include refunded bookings. Releases recalculate remaining capacity instead of blindly incrementing it.
- Transport fixed fares are not multiplied by passengers; overlapping vehicle reservations are checked.
- Restaurant request setting, capacity, daily hours and overlapping dining reservations are checked. Daily-hours support is deliberately limited and disclosed; configurable dining duration defaults to 90 minutes.
- Timed service inputs use East Africa Time. Date-only stays/tours no longer imply a fictitious 03:00 service time.
- Customer cancellations and business declines share a transactional lifecycle. Paid order children find the parent payment and request only their allocated booking amount. Unpaid cancelled order children are removed from the payable order total.
- Business acceptance follows payment receipt. A business can mark a confirmed service completed after its service date, enabling reviews.
- A protected expiry-job endpoint can release abandoned unpaid holds. It must be scheduled and monitored in deployment infrastructure.

### Payment and finance safety
- Removed the action that manufactured successful payment rows.
- Replaced raw card-number/CVV collection with hosted Stripe Checkout. No configured provider means disabled checkout with explicit unpaid messaging.
- Mobile money methods are not presented as working integrations.
- Checkout attempts are target-scoped and provider calls use idempotency keys. Directly paying an order child is blocked.
- Signed webhooks validate payment identity, UGX/provider units, currency, allocation and payable state; terminal status guards prevent duplicate effects and cancelled-booking resurrection.
- Provider checkout-session references remain immutable. Notifications target business member User IDs, not Business IDs.
- Receipt/success routes derive their messaging from owned payment records. An unpaid booking cannot display a successful receipt.
- Refund requests use provider idempotency and metadata. Confirmed partial refunds use actual amounts; full booking refunds release inventory and update order state. Refund lifecycle events can finish asynchronous provider refunds.
- Non-integrated refunds cannot be marked complete. Payout settlement cannot fabricate completed transfers; the unconfigured payout action is disabled.
- Admin/business earnings use real database records and booking-level allocations, including combined orders. Simulated revenue charts and fabricated admin dashboard activity/health metrics were replaced.
- Historical seeded/self-attested financial records are **not** automatically reclassified as real provider transactions. They still require operator reconciliation or an isolated clean production database.

### Authorization and data capture
- Removed blank-credential demo login, arbitrary-account/admin provisioning and session-wide admin elevation.
- Removed hardcoded fallback authentication secret.
- JWT authority is refreshed against the database. Admin actions check current active status; sensitive finance, user-management, verification, support and moderation actions enforce relevant permissions.
- Password reset changes invalidate existing Node-authorized JWT sessions by credential version.
- Listing child IDs must belong to the authorized parent; relevant listing/subtype/child edits are atomic.
- Owner/manager checks cover listing/guide creation, listing editing, business settings, verification and booking operations.
- Unchecked non-refundable room setting persists false.
- Message read mutation checks membership. Per-user read receipts prevent one staff member clearing another's unread state.
- Message creation, thread updates and recipient notifications are transactional. Inboxes consume refreshed server state; portals/account pages refresh while visible.
- Business-initiated customer threads require an actual matching business/customer booking.
- Account reset/verification and admin/business invitation acceptance now have expiring, single-use token workflows. Delivery uses a configured email provider; it was not exercised against a real external inbox.
- Invitations no longer default to Super Admin. Managers cannot invite owners or promote another manager.
- Shared listing cards use actual signed-in saved state, including related cards.
- Verification documents use private storage, content/type/size checks and authorized download routes. Old public URLs are intercepted for authorization.
- Listing photos upload separately to a validated image endpoint instead of embedding multi-megabyte data URLs into server-action bodies.
- Inert notification switches, unavailable saved-payment settings and placeholder social links no longer imply persistence or working integrations.

### Routes, controls, mobile and accessibility
- Added admin audit, booking detail and verification detail routes.
- Fixed Pending payments enum mapping and invalid filter input handling.
- Filters submit actual URL searches. Exports download explicitly labelled visible table rows as CSV, with spreadsheet-formula escaping.
- Added business booking calendar and exposed guides/support/verification navigation.
- Connected profile/support/reply/menu destinations. Removed unimplemented bulk/date/ellipsis controls instead of leaving enabled-looking no-ops.
- Trip planner now persists owned itineraries and editable activities to TripPlan/TripPlanItem. Add/edit/remove/save/copy-to-share controls work; plans do not imply reservations.
- Fixed cart breadcrumb and category labels; direct checkout differs from Add to cart.
- Added min-width-safe grid/flex children, wrapping search/price/action layouts, responsive portal padding, wrapped pagination and keyboard-scrollable tables.
- Cart editing is scrollable within mobile viewport; image removal is visible on touch devices; search/reservation controls have accessible names.
- Added safe error, loading and not-found pages.
- Replaced raw image elements through a shared image component; lint has no image/alt warnings.
- Added basic response security headers.

## Verification completed
- TypeScript check passed after implementation.
- Jest: **57 tests / 7 suites passed**, including new booking, financial-state, message read-state and signed-webhook regressions.
- Lint: **no warnings or errors**.
- Production build passed with AUTH_DEV_MODE=false. Build no longer pushes or seeds the database.
- Migration baseline was compared with the localhost database before adoption. Additive MessageReadReceipt migration applied; subsequent database/schema diff showed no difference.
- Browser: reproduced tour cart checkout now reaches the UGX 420,000 payment page; payment is visibly unconfigured/disabled, not successful.
- Browser: unpaid order receipt says Payment not completed and “not a receipt”.
- Browser: synthetic pending tour booking was cancelled; UI showed Cancelled by you.
- Browser: itinerary saved from /new to an owned database-backed detail URL.
- Browser: customer access to admin was denied after removing development escalation; existing seeded admin credentials still sign in.
- Browser at measured 390px: search, payment, customer bookings, admin Pending payments, audit and verification detail had no document-level horizontal overflow.
- Production-mode 390px verification covered 50 marketplace, account, business and admin views without observed document-level horizontal overflow or application error pages. See SAFARINEXA_RESPONSIVE_VERIFICATION_2026-11-02.md. Tablet/desktop spot checks and mobile sidebar navigation were also exercised. These observations do not establish an exhaustive device, screen-reader, concurrency or external-provider test matrix.
- CSV request feedback was verified, but the browser did not provide a captured download file/event; saved-file delivery remains unverified.
- Static route/control scan: no missing literal internal destinations; remaining generic Button candidates are verified wrapper/trigger patterns rather than the original inert actions.

## Local data/files changed by verification and remediation
- Original audit support test case/reply remains as documented in that audit.
- Added one clearly labelled synthetic tour reservation/order, then cancelled the booking through the UI. No payment occurred.
- Added one clearly labelled synthetic itinerary with one activity.
- Recorded a Prisma baseline and added MessageReadReceipt to the localhost prototype database. Existing application rows were not deleted.
- Moved eight verification PNG files from public/uploads into .private/verification. Byte-for-byte comparison with their tracked originals passed for all eight. They remain recoverable in private storage; old URLs now require authorization.
- No production database was accessed; the database host was verified as localhost before migration.
- No real provider payment, refund, payout, invitation email or password change was executed.

## Still required before release
1. Choose/configure permitted production payment providers and business settlement accounts. Mobile money and payouts are not implemented as live transfer integrations.
2. Configure Stripe and test sandbox success/failure/cancel, duplicate/reordered events, provider refunds and reconciliation against actual provider records.
3. Configure/verify email sender and delivery, test account verification/reset and invitation acceptance end to end. Operational notification email/SMS still needs a durable delivery/outbox pipeline; in-app notifications are not email receipts.
4. Set secure production secrets and AUTH_DEV_MODE=false; provision least-privilege admin permissions and remove demo accounts/data from production.
5. Configure private persistent document storage and persistent public-listing-image storage. Carry the moved legacy documents into the configured private volume. Local filesystem fallbacks are not durable serverless storage.
6. Schedule the authenticated expiry job and monitor failures, unknown provider attempts and payments requiring reconciliation. Event guards are not a complete provider-event audit ledger or alerting system.
7. Confirm product policies: restaurant reservation/deposit pricing, supported operating schedules, transport duration/shared-seat rules, cancellation policy snapshots and commission contract. Defaults in this prototype must not silently become contractual policy.
8. Run isolated two-tenant authorization, concurrent last-place reservation, full browser journey, keyboard/screen-reader and load tests. Add durable provider integration/browser suites to CI.
9. Review migration baseline for each existing environment, take and restore-test backups, then deploy migrations explicitly. Do not replay baseline CREATE statements against an already-populated database.
10. Admin platform settings, flexible reporting/date ranges and other explicitly unavailable capabilities are not newly implemented just by removing misleading controls.

The code is considerably safer and more connected, but **“all production workflows are fully integrated” would still be an inaccurate claim** until these external/configuration and release-qualification items are completed.
