# Business-led booking and payment operations

The business owns routine customer operations. Admin retains platform-wide payment
support, listing/business moderation and platform settlements. Online payment
success is provider-confirmed; neither surface has an arbitrary "mark paid" button.

## Daily workflow

1. Customer browses published listings belonging to approved businesses. Checkout
   recalculates the price, checks category rules, snapshots the traveller and policy,
   and reserves inventory in a serializable transaction.
2. A request-to-book listing creates a request for the business. An owner or manager
   accepts it before payment; an instant listing proceeds directly to payment.
   Restaurant table requests remain free, with business acceptance required.
   Demo mode now respects these same listing modes.
3. Customer payment records retain provider, reference, amount and status. Provider
   webhooks and the business's provider-check action share the same reconciliation
   logic. Failed attempts are visible to both customer and business. Reservations
   remain held during the retry window; the expiry job releases expired reservations.
4. Business → Bookings shows booking and payment status separately. Booking details
   expose traveller information, messaging, acceptance/decline, cancellation,
   fulfilment/driver assignment, completion and payment/refund controls.
5. Business → Payments & refunds shows paid, unpaid, processing, failed and refund
   activity, searchable by reference, listing or customer. Shared order payments
   count only the current booking's allocation. Earnings & payouts remains separate.
6. Owners and managers can remind an unpaid customer through in-app notifications,
   check the provider, create full or partial refund requests, approve requests,
   decline requests not yet submitted, or escalate an issue to support. Reminders
   are limited to one per booking per 15 minutes and respect the payment deadline.
7. A refund remains pending until completion is confirmed. Customer booking details
   and receipts show the booking's own completed and pending refund amounts.
   Full refunds update the booking and release inventory. Business cancellation
   releases inventory immediately, independently of the provider's refund timing.
   After a partial refund, cancellation requests only the remaining refundable amount.
8. Business → Customers lists only that workspace's customers, booking counts, net
   paid and outstanding balances, with links to bookings, payments and messaging.
   Global customer identity and credentials remain owned by the customer.
9. Pending refunds appear in the business action centre. Admin booking details use
   the same payment/refund component and operations, gated by `payments.manage`.
   Escalations create a booking-linked support case and notify capable admins.

## Access and consistency

- All financial writes recheck database membership in the active workspace. Owners
  and managers can act; staff can view. Admin writes require an active admin with
  payment-management capability. Hidden form fields grant no access.
- Refund amounts must be positive whole UGX. Requested, processing and completed
  allocations reserve the balance at both booking and shared-payment level.
  Transactions prevent concurrent over-allocation; request IDs prevent duplicate
  submissions. Actions and provider results are audited.
- Provider submissions use a stable refund idempotency key. Recorded provider refund
  IDs are retrieved on subsequent checks. An older processing request with no known
  provider result requires reconciliation rather than risking another submission.
- Customer payment and refund notifications use actual user IDs. Supported admin
  notifications are tied to the affected booking and support case.

## Integration boundaries

- Live payment verification/refund execution currently supports configured Stripe
  Checkout payments. Demo references simulate refunds only when demo mode is enabled.
- Live MTN/Airtel/other unsupported records route to support/provider reconciliation;
  they are never silently marked paid or refunded. Cash/offline payment recording
  is not introduced by this change.
- No live payment or refund was executed during verification. Provider API behavior
  follows https://docs.stripe.com/api/refunds/create and https://docs.stripe.com/refunds.
- Payout settlement is the existing admin/demo facility. This change does not build
  live business disbursements or recovery of already-settled payouts after refunds.
- Payments currently computes its filtered ledger from scoped booking records, as
  the existing earnings view does. Move allocation/filtering into indexed database
  queries when deploying at larger transaction volumes.
- Automatic reservation expiry uses the existing protected
  `/api/jobs/expire-bookings` job; a scheduler and `CRON_SECRET` must be configured
  for it to run automatically. Businesses can also cancel unpaid bookings directly.

## Validation

- Unit and regression tests cover checkout payment outcomes, provider signatures,
  mismatched amounts/currencies, failed-payment propagation, replay, workspace
  isolation, role checks, shared-order allocation, over-refunds, provider retries,
  unsupported providers and customer reminders.
- `npx tsx scripts/check-business-payment-flow.ts` runs a localhost/demo-only database
  walkthrough with synthetic provider responses. It creates labelled test records
  and archives its fixture listing afterward; no external payment API is called.
- `npx tsx scripts/check-payment-pages.ts` signs in using the normal local demo
  provider and checks authenticated rendering of the business ledger, customer list,
  bookings, payment panel and admin support pages. It expects port 3001.
