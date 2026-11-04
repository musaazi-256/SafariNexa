# Page structure and styling review — 4 November 2026

The filter UI from this original pass has been superseded by the
[shadcn filter rebuild](filter-rebuild-review.md), which includes browser validation.

## Scope and conventions

Inspected the structure of all 105 App Router page files and their shared shells.
The customer marketplace, account pages, business portal, admin portal, forms,
detail screens, authentication, and redirect routes use different page types.
Each type retains its appropriate structure while sharing typography, controls,
surfaces, and responsive spacing.

List-page order is heading → summary cards → controls → results → pagination.
`PortalToolbar` owns the controls: search at the left, filters and sorting next,
and export/list actions at the right. Mobile uses the same reading order with
stacked, wrapping controls. Filter-only and action-only lists use the same shell.
Search remains explicit-submit and retains its URL-backed filter behavior.

## Changes

- Migrated every existing portal page search and status filter to the shared
  toolbar: bookings, users, businesses, listings, payments, customers, revenue,
  reviews, verification, and support.
- Applied the toolbar to audit exports and the upcoming bookings calendar.
- Migrated the shared notification centre, covering customer, admin, and business.
- Unified admin/business shell backgrounds, header heights, responsive padding,
  and maximum list-page widths. Narrow forms/detail views retain smaller widths.
- Removed extra portal hero bottom padding so parent section gaps control spacing.
- Standardized functional page heading typography across listing details, search,
  review creation, support, and authentication status screens.
- Payments use shared cards, button tokens, heading roles, and mobile action
  stacking. Awaiting-acceptance booking cards also use the shared card treatment.
- Verification uses responsive card padding, wrapping decision actions, shared
  form controls, status badges, and the shared empty state.
- Listing pagination now retains the search query.
- Recorded the conventions in `tabs-and-filters.md`.

Marketplace travel search remains above its results/facets; conversation search
remains above the inbox thread list. These controls keep their contextual scope.
Redirect-only routes continue to resolve to their styled destination screens.

## Verification

- TypeScript: passed.
- ESLint: passed without warnings.
- Tailwind stylesheet compilation: passed.
- Jest: all 48 suites / 243 tests passed.
- Structural source check: all 23 existing portal-page search/status controls are
  inside the shared toolbar; no outliers found.
- Local HTTP rendering with demo sessions: 21 routes passed (18 toolbar list
  routes, business verification settings, email verification, payment cancellation).
  Checks require HTTP 200, no server-render error digest, and the shared toolbar
  on list pages.

Rendered route checks covered admin bookings, businesses, users, payments,
verification, listings, reviews, support, audit, and notifications; business
bookings, listings, reviews, revenue, payments, customers, notifications, calendar,
and verification settings; and the two public status pages above.

These were the checks for the original structure pass. The follow-up filter
rebuild adds desktop/mobile Chrome checks and screenshots; see the linked report.
Existing unrelated workspace changes were retained.
