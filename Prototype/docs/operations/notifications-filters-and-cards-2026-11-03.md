# Notifications, filters and cards review — 3 November 2026

## Notification coverage

Customer, business and admin portals now expose the same recipient-owned notification centre in their own shell, with a header bell and a database-backed unread count. Business and admin sidebars also link to their centres.

All and Unread include every notification category. My categories applies saved account preferences; the category controls in business settings now persist to CustomerProfile instead of claiming email/SMS subscriptions through unused browser switches. Search, category selection and pagination are URL-backed. Read actions constrain writes to the signed-in recipient and invalidate header counts.

Opening a linked booking checks current access. A business notification can select the business the recipient belongs to before opening that business's booking; personal bookings retain their customer route. Admin booking/support alerts use admin routes. Generic historical notifications without a stored related record remain informational, with messages and review-queue shortcuts available. No destination is inferred from notification prose, and historical events are not fabricated or backfilled.

Reviewed existing booking, acceptance, cancellation, expiry, message, payment, review, verification, fulfilment, refund and support event producers. Added missing delivery for:

- Verification and listing submissions to active admins with businesses.manage.
- New support cases and customer replies to active admins with support.manage.
- Support status changes back to the case opener.
- Successful simulated payments to actual business users, under payment updates.
- Refund requests to active admins with payments.manage; completed refunds to business users.
- Completed payout records to actual business users.

New notifications use actual User IDs. Relevant deliveries are part of the event's database transaction; recipient lists are deduplicated. Existing state claims still prevent duplicate settlement/refund notifications on replay.

## Shared controls and surfaces

Seven divergent portal searches now share a labelled search field, clear/search controls, standard focus treatment and query preservation. Filter dialogs expose only criteria actually supported by the corresponding list. They support Escape/focus management, reset controls and first-page results. Status tabs retain independent search/sort criteria. The mobile marketplace filter sheet remains open for multiple selections and has a Show results action.

Marketplace facets now match stored category fields rather than titles/descriptions. Tour duration uses durationDays; amenities use recorded amenities; guide specialization uses its stored enum; location choices come from the current catalogue query. Rating minima match their displayed labels. Sorting and filter changes reset pagination; clearing facets retains trip inputs.

Card foundations use light borders, restrained shadows, consistent title weights and wrapping footers. Marketplace cards retain existing layouts, reveal longer titles over two lines and avoid image zoom. Search-result ratings use the actual score label and do not add a price unit to contact-only pricing. Review cards have a readable reply footer and distinguish booking-linked guests from other reviewers. These changes preserve the established product structure.

## Validation and boundaries

- 200 tests in 41 suites passed, including recipient scoping, cross-business routing, saved preferences, eligibility/deduplication, payment/refund/payout notifications, query preservation, filter dismissal and the mobile filter sheet.
- TypeScript, ESLint, production build and git diff whitespace checks passed.
- Native browser checks covered business and customer notification records, the admin notification empty state, portal switching, the filter dialog and representative cards.
- No database schema migration, seed/reset, deployment, external email/SMS delivery or real financial transaction was performed. Existing payment simulation remains available.
- Source review and shared-component validation cover the app broadly; this is not a claim of testing every viewport and every possible stored-record combination.
