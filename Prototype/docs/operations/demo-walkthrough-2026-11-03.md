# Demo app walkthrough — November 3, 2026

Reviewed the current local app across customer, business and admin surfaces. Preserved the restored visual design and existing workflow functionality. No deployment, database reset or GitHub push was performed.

## Live walkthrough coverage

| Area | Checked |
| --- | --- |
| Marketplace | Home, Explore, all four category catalogues, Guides, Destinations, search results, accommodation and restaurant details |
| Customer account | Profile, saved items, messages, preferences, payment settings, notifications, support list, bookings and trip planner |
| Business | Dashboard, workspace switcher, listings/category selection, guides, verification, bookings/calendar, messages, reviews/search, revenue, settings; profile/team redirects |
| Admin | Dashboard, businesses, verification queue/detail, listing queue, bookings, payments/refunds, users, roles, reviews, support, audit, settings and profile |
| Responsive checks | Customer and portal pages at 390px; admin Dashboard and Payments rechecked after fixes with no document-width overflow |

Completed live demo journeys:

- Accommodation dates → checkout → simulated mobile-money decline → test-card retry → confirmed booking and receipt.
- Customer booking message → visible saved message → cancellation → refund requested → admin approval → completed demo refund.
- Restaurant date/time/party → free reservation request → business confirmation. No payment collected.
- New itinerary → activity edit → save to the customer account.
- Seeded portal switching and business workspace switching.
- Business booking search returning a single matching record, and review search returning its empty state.
- Admin general and fee preview saves displaying local-save confirmation.

Persistent walkthrough records use the existing seeded demo accounts: accommodation `BK-C4FED63B` (refunded), restaurant `BK-096D7586` (confirmed), and itinerary “Demo walkthrough — Uganda weekend”. No real money moved or external messages were sent.

## Corrections

- Gallery tiles now contain their own fill images instead of overlapping the entire gallery.
- Availability calendars show actual booked dates; removed invented fallback dates. Accommodation inputs have accessible names and reject past ranges before checkout.
- Cart editing keeps restaurant reservations free, retains nightly accommodation add-ons, preserves fixed transport fares and blocks invalid dates.
- Primary reservation actions go directly to checkout; Add to cart retains its separate cart behavior.
- Restaurant price and confirmation copy no longer repeat units, imply a meal charge or describe unrelated payment rules. Payment choices explicitly describe demo simulation.
- Business booking/review search fields now submit queries and retain search terms through filters and pagination. Review sorting now updates the URL and database order instead of being an inactive select.
- Pagination uses a bounded page strip. Trip-planner controls, customer payment-settings actions, portal headers, dashboard cards/chart headers and admin payment toolbars fit narrow layouts.
- Cart navigation uses one link rather than nested interactive elements.
- Verification uploads use the supported private file path instead of an unsupported URL field. Shared status badges reflect the actual verification status.
- Verification queues no longer mark submitted documents as verified, imply missing documents are present, or invent fallback document chips. Cards link to the full review; document chips open their documents. Seeded example.com documents use a local, clearly labelled sample preview.
- Added simulated payout settlement for eligible demo payments, including combined orders across businesses, commission, refund holds, audit records and repeat protection. Live payment records are excluded.
- Pending payout summaries include retained amounts after partial refunds and exclude fully refunded/settled amounts.
- Admin settings save local previews instead of presenting disabled Coming Soon actions. Fee previews clearly state that actual calculations retain the shared 12% commission.

## Verification and boundaries

- TypeScript and ESLint passed; 147 tests passed across 25 suites.
- Added regression coverage for cart repricing, invalid dates, payout allocation/refund holds, repeat settlement calculations and pending payout summaries.
- Local-database integration check exercised all four booking categories in one combined order. The server replaced a deliberately false client quote with UGX 840,000, kept the restaurant at zero and made the three paid categories ready for immediate demo payment. Settlement produced three business allocations; repeating it created no duplicate payouts. The entire fixture transaction was rolled back.
- Production builds completed in an isolated temporary copy, preserving the running development server. Existing auth-library Edge warnings about CompressionStream/DecompressionStream remain.
- Browser-extension automation stalled during the last checks; native Chrome controls verified settings saves and the full verification review destination. Not every mutation or device/browser combination was exhaustively exercised. Business mobile header/chart corrections have source/type/test coverage; a complete post-fix browser sweep of every business state remains outside the verified live coverage.
- Historical seed records retain their recorded lifecycle/provider states. External provider behavior is not certified by this demo run. Device-local settings previews do not change platform configuration or transaction rates.

Evidence screenshot: `/tmp/safarinexa-demo-review/demo-settings.png`. Rollback integration script: `/tmp/safarinexa-demo-review/integration.ts`.
