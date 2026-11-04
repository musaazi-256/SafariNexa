# Filters and page controls

Filters follow the [shadcn Tasks toolbar](https://ui.shadcn.com/examples/tasks),
[Dropdown Menu](https://ui.shadcn.com/docs/components/radix/dropdown-menu),
[Select](https://ui.shadcn.com/docs/components/radix/select), and
[Checkbox](https://ui.shadcn.com/docs/components/radix/checkbox) patterns, using
Radix primitives and the project's semantic color tokens.

## Choose controls by behavior

- Single-choice server-backed facets: `RecordFilter`. It renders an outline,
  compact outline button, a selected-value badge, and a keyboard-operable radio
  menu. The backend accepts one value for these facets; do not present checkboxes
  that imply multiple selections.
- Local list facets: `FilterControl`, the same presentation with a controlled
  value and callback. Used by conversation and document-type filters.
- Sorting: `RecordSort`, using the shared Radix Select with the same 36px height
  and rectangular corners as filter/search controls.
- Date windows: `RecordDateFilter`, with any time / past 7 / 30 / 90 days. Use an
  explicit label identifying the field: Booking created or Payment date.
  `recordDateFilter` applies the window before pagination and counts.
- Marketplace facets: shared Radix `Checkbox` groups for multiple simultaneous
  amenities, price bands, locations, and other category-specific attributes.
  Desktop and mobile render the same facet component.
- Local content tabs: shared Radix `Tabs`, retaining keyboard and panel semantics.
- Navigation: real links. Page and settings navigation are separate from filters.

Do not reintroduce pill-link status filters, native filter dropdowns, one-option
filter controls, or inert date controls. `PortalSelectFilter` is only a compatibility
export of `RecordFilter`; new code imports `RecordFilter` directly.

## Page-specific choices

| Page | Controls |
| --- | --- |
| Admin bookings | Full booking lifecycle + booking creation window; counts follow search/date |
| Business bookings | Actionable lifecycle groups + booking creation window |
| Admin payments | Provider payment outcomes + payment creation window |
| Business payments | Paid, unpaid, processing, failed, refunds, no payment required + booking creation window |
| Business revenue | Successful, pending, failed, cancelled, partial/full refund outcomes |
| Business listings | Listing type and publication state, independently combinable |
| Admin listing queue | Submission review stage; defaults to Submitted |
| Business availability | Room type, preserving each room's inventory scope |
| Admin verification | Verification stage, including rejected/suspended; defaults to Submitted |
| Admin businesses | Every supported verification state |
| Admin users | Account role, including super admins |
| Reviews | Moderation state; business reviews also offer rating/date sorting |
| Support | Case lifecycle state |
| Notifications | Read status and notification category, independently combinable |
| Business inbox | All conversations, unread conversations, conversations with bookings |
| Verification documents | Document type; also sets the type for uploads in that section |
| Marketplace | Category-specific checkbox facets plus result sorting |

## URL and reset contract

The URL is the source of truth for server-backed filters. Use `updateFilterParams`
to change one facet, preserve independent facets/search/repeated values, and reset
pagination. Keep enum casing exactly as the page expects. Pagination must retain
all active facets. Invalid values fall back to a valid page default.

Selecting All removes that facet unless the page's default is a restricted queue.
Verification therefore explicitly encodes `status=all`; removing status would
return to Submitted. Reset inside a menu clears that facet. Toolbar Reset filters
returns facets to page defaults while keeping search and sorting.

Filters must apply before pagination, not only to the visible page. Display counts
only when backed by the relevant query. All-time summary cards/charts remain
separate from result-list filters unless their text explicitly says otherwise.

## Layout

List order: heading, optional summary, `PortalToolbar`, results, pagination. The
compact toolbar puts search first, facets/sorting next, and export/list actions at
the right. Mobile stacks and wraps these controls with the same reading order.
Menus fit the viewport and scroll when long. Avoid duplicate controls in modals.

Marketplace travel search remains above results/sidebar facets. Conversation
search remains above its own thread list. Forms and detail screens can retain
narrower widths than full list pages.


Table utilities use the shared paired icon controls described in
[table-toolbar-review.md](table-toolbar-review.md). Match `PortalToolbar.tableId`
with `Table.tableId` and set `externalTools` when a page already has a search/filter
toolbar. Standalone tables provide the same paired controls automatically.
