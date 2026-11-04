# Statistics cards — 4 November 2026

The existing statistics cards now use shared StatCard and StatGrid components. This covers 42 metric instances across nine surfaces: admin overview, admin payments, admin business details, business overview, bookings, listings, reviews, earnings and the message inbox customer summary.

The shared treatment uses a white surface, light border, neutral icon, regular label, semibold tabular value and supporting explanation. Optional links are explicit, keyboard accessible and aligned at the bottom of the card. Help is available on hover and keyboard focus where a calculation needs explanation. Numeric zero stays visible; missing values use an em dash. Values and labels wrap rather than truncate. Compact summaries retain the same hierarchy. Grids adapt to the available width.

Corrections made while consolidating:

- Removed repeated gross-payment totals on the admin overview; the existing published-listing count now occupies that metric slot.
- Labelled approved businesses as verified businesses, rather than equating approval with operational activity.
- Described calculated unsettled business balances separately from actual payout records.
- Distinguished confirmed booking value, gross payments, net business earnings, completed refunds and settled payouts.
- Separated publication state from review progress in listing statistics.
- Identified the moderation states included in review averages and counts; no reviews display a missing value instead of an invented zero rating.
- Removed commission/refund sparklines that repeated gross-payment data and decorative direction arrows without a comparison period.
- Retained the existing data sources and operational actions. The business detail booking-value calculation now includes completed bookings in the review stages, matching the other business summaries.

Validation: TypeScript, ESLint, 200 existing tests in 41 suites, production build and whitespace checks passed. Native browser review confirmed business and admin overview cards, including zero currency values, multi-million UGX totals, descriptions and navigation links. Screenshots are saved in /tmp/safarinexa-ui-polish/statistics-business.png and statistics-admin.png. No schema change, seed/reset, deployment or real financial transaction was performed.
