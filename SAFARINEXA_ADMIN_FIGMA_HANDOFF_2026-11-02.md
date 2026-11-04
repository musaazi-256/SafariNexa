# SafariNexa Admin — editable Figma handoff

Target file: https://www.figma.com/design/OBOzr94yZV2n0egJ3jx3IY/SafariNexa-Admin-portal

Start here: https://www.figma.com/design/OBOzr94yZV2n0egJ3jx3IY?node-id=19-2

## Deliverable

122 screen/state frames across 11 flow pages, plus a Start Here page. These are editable Figma text, frames, SVG paths and component instances, not screenshots pasted onto a canvas. Semantic light-theme variables and Inter text styles derive from the current prototype. Source Lucide icons and the public SVG logo are included as editable components; buttons have reusable state variants.

Each screen has a stable ID, route, source reference, permission, state/outcome and implementation notes. Handoff notes sit separately below the corresponding UI. Same-flow action links use prototype navigation; cross-flow links open the corresponding Figma node. Native form entry and asynchronous server operations are represented by editable state examples, not executable backend actions.

## Flows

| Page | Frames | Coverage |
| --- | ---: | --- |
| Access & invitations | 7 | Sign-in, credential error, OAuth hand-off, access denied, invitation sign-in/acceptance/expiry |
| Dashboard | 2 | Populated and empty overview, metrics, queues, action centre and audit entry points |
| Businesses & verification | 22 | All directory filters, business detail, verification filters/details and decisions |
| Listing review & photos | 20 | All submission states; four service categories; frozen revisions; checklist-ready, missing-media and conflict branches |
| Bookings oversight | 13 | List filters and read-only booking lifecycle/ledger details |
| Payments & refunds | 11 | Payment filters, requested/processing/completed/rejected refunds, reconciliation failure and disabled payouts |
| Users & access | 11 | Role filters, suspend/reactivate, invitation form/pending/error/success and no matches |
| Review moderation | 6 | All filters, moderation outcomes and empty state; no invented set-pending action |
| Support cases | 13 | Queue filters, five case states, persisted reply and no cases |
| Audit, settings & profile | 7 | Audit/empty, all three settings tabs, profile/edit/saved |
| Shared UI & responsive states | 10 | Loading/error/not-found, filter popover, export messages, external-file hand-off and representative mobile navigation and desktop icon-collapse |

## Data and fidelity boundary

All names, contacts, records and financial figures are synthetic. No signed-in demo data or private files were uploaded. Live capture was blocked on privacy grounds; the chosen safe workflow used code-built editable screens. Real listing photographs and private documents are not included: labelled synthetic media slots show their role.

This is a code-derived reconstruction, not a pixel-verified live capture. Representative mobile states are included, not an exhaustive device matrix. Active rendered branches and action outcomes are illustrated; dormant/legacy schema-only booking states are documented in Start Here rather than invented as new working journeys. Figma cannot charge/refund money, send invitations or change real access.

## Important implementation findings preserved in handoff

- Verification detail exists but queue cards lack links to it. Dashboard and business history provide existing entry points.
- Some verification queue document labels/fallback chips misleadingly imply verification before review.
- Settings fields have no persistence and Save remains disabled. Category fee defaults do not configure the live shared commission calculation.
- Payout integration is unavailable. The current refund table labels non-requested states Processed even if processing/rejected; provider confirmation is still required.
- Admin booking oversight is read-only. Operational acceptance and driver assignment belong to the business portal.
- Most server action failures use the generic error boundary. No custom inline failure/confirmation flow is claimed where the code has none.

No application source or database records were changed in this Figma task.

## November 3 sync — current state

This update supersedes the earlier visual and frame-count descriptions in this report. The existing Figma file was updated in place: 124 editable admin screens and states retain their root IDs and existing functional flows.

- Restored the code's established visual treatment: SF Pro as the macOS system-ui font, white main surfaces, warm borders, 16px cards, 12px inputs and pill buttons.
- Restored the dashboard's twelve metrics, featured businesses, activity and operational sections, including collapsed and mobile states.
- Retained listing review, verification, roles and permissions functionality. Updated demo access and refund copy to distinguish simulated actions from live provider states.
- Corrected button-label wrapping, authentication-card containment and role field widths. Final structural checks covered all 124 frames; the remaining role placeholder overflow was fixed and its bounds verified. No non-SF Pro text or image-filled screen nodes were found.
- Visually reviewed the dashboard, login, listing queue and role form. Designs remain a code-derived reconstruction using synthetic records and editable SVG placeholders; authenticated live-browser pixel parity is not claimed.
- This file covers the admin portal. Customer checkout is outside this Figma file's scope.

Figma: https://www.figma.com/design/OBOzr94yZV2n0egJ3jx3IY/SafariNexa-Admin-portal?node-id=5-152

Local sync ledger: `/tmp/safarinexa-figma-sync/sync-state.json`.

## Verification evidence

- Structural audit of the original 121 screen frames found 4,386 editable text nodes, 2,377 component instances and 6,150 vector nodes; no complete-UI raster/image fills were present.
- No zero-sized text, non-Inter text or detected text overflow beyond the audit tolerance was found in those frames.
- Representative composition screenshots were inspected across all 11 flows; clipping, width, section-order and incorrect-action issues found during review were corrected. The additional desktop collapsed-state frame was checked separately.
- Public Home and Contact support actions exit to the actual localhost public routes, rather than incorrectly entering the admin support queue.
- These checks do not establish live-browser pixel parity or an exhaustive accessibility/device certification. The source-derived fidelity boundary remains explicit in the Figma start page.
