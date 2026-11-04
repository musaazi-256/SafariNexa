# Nile & Crater Lodges demo dataset

Open the business portal and select **Nile & Crater Lodges**. Sign in as
`owner.stays@safarinexa.test` with password `Passw0rd!`, or use the existing
`business@dev.test` account and the business switcher.

The local demo seed is additive and restricted to a localhost PostgreSQL database:

```sh
npm run db:demo:nile
```

Run the normal database schema and base seed setup first on a fresh database.
This command requires the existing `nile-crater-lodges` business and its owner.

## Coverage

- 12 additional properties: 10 published, one draft, one archived. Existing
  listings remain in place (37 total on the development database at setup).
- Three room types and two optional extras per new property.
- 36 fictional guests, using reserved `.test` addresses. Guest login example:
  `guest.1@nilecrater.demo.test`, password `Passw0rd!`.
- 336 bookings per monthly dataset: 126 recent examples covering every booking
  status, plus 210 historical bookings spread over approximately six months.
- Every payment status, with card, Stripe, MTN and Airtel examples; declined
  payments and provider timeouts; full and partial refunds; requested,
  processing, completed and rejected refund outcomes.
- Four payouts covering pending, processing, completed and failed states.
  Payment allocations reconcile after completed refunds and the 12% commission.
- 82 reviews with mixed ratings, moderation states, and business replies.
- 30 conversations, including 64-message and 36-message histories, mixed read
  states, and booking context for reviewing inbox scrolling.
- 10 support cases across all five statuses and 24 owner notifications.
- 45 days of room availability, including sold-out dates and price overrides.

## Where to review

Dashboard: current-month booking and revenue charts, ratings and requests.
Bookings: search `NCL-`, apply status filters, inspect traveller and room details.
Revenue: successful/failed payments, refunds, earnings and payout charts.
Listings: published, draft and archived properties, rooms, extras and calendars.
Messages: conversation list scrolling, long histories and the customer detail card.
Reviews and support: moderation states, replies and unresolved cases.

## Repeatability

IDs are deterministic. Rerunning in the same UTC month creates missing records
without resetting existing records, duplicating bookings, or undoing demo actions.
A new month adds a fresh dataset, keeping recent charts populated when rerun.
Existing dates and actions are preserved; the seed does not run automatically and
is not a reset command. Older monthly data remains available.

All newly added properties and transactions are fictional demonstrations. No
payment provider is called, no funds move, and no email or SMS is sent.
