# SafariNexa customer–business loop: implementation and verification

Date: 2 November 2026. Environment: local demo, localhost:3002 and local safarinexa database. This report supplements the earlier audits; it does not certify every route or production readiness.

## Implemented

- Request-based services now wait for business acceptance before requesting payment. Instant bookings have a separate path. Legacy bookings retain their previous lifecycle.
- Restaurant bookings reserve a table at zero booking charge; menu estimates are not charged as prepaid meals. Both portals explain that meals are paid separately.
- Traveller notes and transport pickup/drop-off, flight, luggage and child-seat information persist and appear in customer, business and admin booking details. Confirmed transfer assignment can be shared back with the customer; tenant and booking-state checks protect the action.
- Booking terms and price are snapshotted. Response/payment deadlines are stored, cancellation releases inventory and notifies the business, and payment handlers enforce payable states. Verified paid new-mode bookings confirm without requiring a second acceptance.
- Published listing edits are saved as drafts. Admins review a frozen submission containing listing information and photos. The old public version remains visible until approval; approval checks for conflicting live changes before applying the revision. Rejection does not replace the live version.
- Editing preserves existing custom select values and amenities. Missing tour type/booking mode prefills and past-date reservation enablement were corrected.
- Operational dashboards surface pending requests, deadlines, unassigned transfers and review work. The planner links actual bookings without implying that planning itself reserves inventory.
- Listing trust/payment copy is more explicit about review scope and provider availability.

The published-revision workflow supersedes the earlier report's instruction to unpublish a listing before editing it.

## Actual browser journeys

| Journey | Observed result |
| --- | --- |
| Customer tour request → business workspace → acceptance → customer return | Traveller details/notes persisted; business acceptance changed the customer state to payment required. |
| Business booking message → customer return | The business reply appeared in the customer's booking chat. |
| Customer payment screen | Unconfigured provider was honestly unavailable; no payment was executed. |
| Customer tour cancellation | Customer saw Cancelled by you. Test booking BK-D588B040 retained as cancelled. |
| Business listing submission → admin review → customer listing | Initial approved listing was public. A subsequent draft stayed private until separate approval, after which the public title changed. |
| Customer attempts admin listing queue | Access denied; customer could not review submissions. |
| Customer restaurant request → restaurant business confirmation → customer return | Confirmed table reservation, UGX 0, submitted notes visible and meals-paid-separately explanation displayed. |
| Restaurant test cleanup | Customer cancellation visibly confirmed. Test booking BK-6EC34034 retained as cancelled. |

The synthetic listing `cmvyvfc5b0001xsw27o3ajzsr` was archived after verification; its review history remains. No genuine business listing was altered by this test. With explicit user approval, only admin@safarinexa.test received the existing Super Admin role in the local demo; its password was not changed.

## Automated and database evidence

- TypeScript check passed; lint passed without warnings/errors.
- 107 tests passed across 15 suites, including booking modes, submission/revision handling, form round trips, transfer assignment authorisation and signed payment webhook branches.
- Rollback-only integration against the real local database passed: request → acceptance → payment-required → cancellation → inventory restoration/business notification; zero-charge restaurant confirmation; draft preview → applied revision. All records from that script were rolled back.
- Prisma schema/migration comparison reported no difference. The local booking-operations/revisions migration was applied.
- Changed public/admin/checkout/planner views received 390px mobile spot checks without observed horizontal overflow or application error. This is not a complete browser/device matrix.
- Final production build passed, including compilation, type validation and generation of 86 static pages.

## Remaining limitations and decisions

- Live payment, refund and payout provider credentials and real settlement remain unverified. Signed webhook tests are not evidence of a real charge. No money moved during testing.
- Expiry processing has an endpoint but still requires deployed scheduling and operational monitoring. The 24-hour response and one-hour payment windows are demo defaults requiring a business SLA decision.
- Transfer assignment was covered by automated authorisation/persistence tests, not a paid live-provider UI journey.
- A mixed order whose final outstanding sibling is cancelled may retain the earlier, longer payment deadline. This is safe against early expiry but needs policy harmonisation before production.
- Commercial decisions—commission/subscription terms, provider contracts, cancellation obligations and service guarantees—still require owner approval. Guest checkout, funnel analytics and channel-manager integrations are not claimed as completed.
- Production security, load/concurrency testing, recovery drills, email delivery and a comprehensive accessibility/device matrix remain release work.

Existing unrelated worktree changes were preserved. Figma was not changed in this phase.
