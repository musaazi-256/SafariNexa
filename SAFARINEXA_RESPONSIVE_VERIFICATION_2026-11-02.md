# SafariNexa responsive verification — 2 November 2026

Production-mode local server on port 3002, AUTH_DEV_MODE=false. The 50 views below were checked at a measured window.innerWidth of 390 CSS pixels. Each rendered without the application error page and with document scroll width no greater than viewport width. Dynamic routes are representative records; a successful page render is not proof that every action/state on it passed.

| Surface | Route/view | 390px document overflow |
|---|---|---|
| Business | `/business/dashboard` | None observed |
| Business | `/business/listings` | None observed |
| Business | `/business/bookings` | None observed |
| Business | `/business/messages` | None observed |
| Business | `/business/reviews` | None observed |
| Business | `/business/revenue` | None observed |
| Business | `/business/settings` | None observed |
| Business | `/business/team` | None observed |
| Business | `/business/verification` | None observed |
| Business | `/business/guides` | None observed |
| Business | `/business/bookings/calendar` | None observed |
| Business | `/business/listings/new?type=accommodation` | None observed |
| Business | `/business/listings/new?type=tour` | None observed |
| Business | `/business/listings/new?type=restaurant` | None observed |
| Business | `/business/listings/new?type=transport` | None observed |
| Business | `/business/guides/new` | None observed |
| Business | `/business/listings/accommodation-bulk-20/edit` | None observed |
| Business | `/business/listings/accommodation-bulk-20/availability` | None observed |
| Account | `/profile/messages` | None observed |
| Account | `/profile/preferences` | None observed |
| Account | `/profile/payment-settings` | None observed |
| Account | `/profile` | None observed |
| Account | `/notifications` | None observed |
| Account | `/support` | None observed |
| Marketplace | `/` | None observed |
| Marketplace | `/explore` | None observed |
| Marketplace | `/search` | None observed |
| Marketplace | `/accommodation` | None observed |
| Marketplace | `/tours` | None observed |
| Marketplace | `/restaurants` | None observed |
| Marketplace | `/transport` | None observed |
| Marketplace | `/guides` | None observed |
| Marketplace | `/destinations` | None observed |
| Marketplace | `/accommodation/accommodation-bulk-20` | None observed |
| Marketplace | `/tours/bunyonyi-canoe-day-trip` | None observed |
| Marketplace | `/restaurants/fort-portal-bites` | None observed |
| Marketplace | `/transport/entebbe-airport-transfer` | None observed |
| Marketplace | `/guides/guide-bulk-guide-1` | None observed |
| Marketplace | `/destinations/kampala` | None observed |
| Admin | `/admin/dashboard` | None observed |
| Admin | `/admin/bookings` | None observed |
| Admin | `/admin/businesses` | None observed |
| Admin | `/admin/verification` | None observed |
| Admin | `/admin/payments?status=pending` | None observed |
| Admin | `/admin/users` | None observed |
| Admin | `/admin/reviews` | None observed |
| Admin | `/admin/support` | None observed |
| Admin | `/admin/settings` | None observed |
| Admin | `/admin/profile` | None observed |
| Admin | `/admin/audit` | None observed |

## Additional checks and limitations
- 768px/1280px spot checks: admin dashboard, admin bookings, search and accommodation detail. The initial 768px admin bookings check exposed an 8px toolbar overflow; search/filter/export wrapping was corrected and the final retest is recorded in the remediation handoff.
- Mobile admin sidebar opened correctly; after the navigation fix, selecting Bookings closed the sidebar and reached the intended route at 390px.
- Tour checkout, unpaid receipt, synthetic cancellation and itinerary persistence were exercised separately and are described in the fixes report.
- CSV export displayed its download-request feedback, but the in-app browser did not deliver a captured download event/file. Saved CSV delivery remains unverified; do not count that as a completed file-download test.
- Google OAuth, real email delivery, provider money movement, real-device Safari/Android behavior, full screen-reader/keyboard flows, concurrency and load are not certified by these checks.
- Table content intentionally scrolls within its keyboard-focusable table region. The document-width check does not mean wide tables fit every column simultaneously on a phone.
- Another project occupied port 3000 and was left undisturbed. SafariNexa's preview uses port 3002.
