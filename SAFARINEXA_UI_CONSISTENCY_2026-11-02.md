# UI consistency and premium-feel pass

Scope: shared UI foundations, customer account/profile, portal shells and business overview. This is a targeted implementation and review, not a claim that every screen has been individually redesigned.

## Findings and changes

| Finding | Implemented refinement |
| --- | --- |
| Pill buttons, gradients and scaling effects conflicted with the existing Radix/shadcn component structure | Solid primary buttons, consistent rounded-md controls, restrained hover states and visible keyboard focus |
| Gold used as a general interaction hover colour | Neutral accent token for hover/selection; explicit gold badge retained for brand highlights |
| Mixed warm/slate borders and inconsistent card elevations | Neutral semantic border/input tokens, 12px base radius and bordered low-elevation shared cards |
| Textareas/selects did not match inputs | Matched corner treatment, spacing and focus rings; textarea retains 16px mobile text |
| Pill tab bars and heavy active states | Quiet inset tabs with clear active state, disabled handling and horizontal overflow support |
| Business/admin shells differed in background, header height and page gutters | Shared neutral surface, 64px header and responsive bounded content gutters |
| Profile had borderless cards, heavy typography, narrow form column and a non-functional chevron | Bordered forms, more usable form width, quieter type, token-based account summary and static authentication method row |
| Customer navigation was visually heavy and lacked current-page semantics | Subtle selected state, aria-current and keyboard focus treatment |
| Business overview used a decorative photo hero above operational tasks | Clear page heading and tasks-first hierarchy; published listing metric no longer an oversized green panel |
| Motion preferences not respected consistently | Reduced-motion override for CSS animations/transitions |

The existing Radix-based implementation was preserved rather than upgrading or replacing the component stack. Changes use the semantic CSS-variable approach documented at https://ui.shadcn.com/docs/theming.

## Verification

- 110 tests passed across 16 suites, including three new shared design-system regression tests.
- TypeScript and lint passed during this pass; the final production build also validates both.
- Actual browser review: customer profile at desktop and narrow viewport; business dashboard with the demo business account. Narrow profile showed no document-level horizontal overflow. Requested viewport overrides did not match the browser's measured CSS width, so no exact device-width certification is claimed.
- No profile data, passwords, bookings or business information were changed by this UI pass.

## Remaining visual work

Individual screens still contain custom hardcoded colours, font weights and corner overrides, including some dashboard metric cards and marketplace/editor sections. A further screen-by-screen pass should remove these in small, verified groups. Dark mode has not been certified. Full keyboard/screen-reader testing, contrast measurement across all states and a complete responsive matrix remain outstanding. No Figma changes were made.

## Follow-up: business dashboard redesign

- Replaced the remaining mismatched dashboard metrics with four consistent, linked cards, restrained icons and tabular figures. Payouts are accurately labelled as recorded payouts rather than revenue.
- Removed the duplicate booking attention list and its redundant database query. The action centre retains booking, assignment and listing review tasks, including queue bounds and demo-deadline disclosures. Its shared styling also applies in admin.
- Added a compact useful-actions panel; removed disabled promotion/download placeholders. Calendar now points to the actual booking calendar instead of the bookings list. Read-only calendar/review/settings navigation is not blocked by the listing-verification modal.
- Added a proper collections empty state, gross/unsettled figures and settlement disclaimer. Guest feedback uses consistent metadata, full-date labels and a three-line excerpt; the latest-review query now selects published reviews only.
- Layout uses single-column sections on narrow screens, two-column metrics at small widths, and four metrics plus split content panels at extra-large widths. Existing tenant scoping and financial calculations are preserved.
- Added shortcut route/placeholder regression tests. Latest browser verification was blocked by the browser URL policy; no screenshot or visual certification of this follow-up is claimed. Earlier screenshots predate this follow-up.
- Follow-up checks: 112 tests passed across 17 suites; production build (including lint/type validation) passed; diff whitespace check passed.
