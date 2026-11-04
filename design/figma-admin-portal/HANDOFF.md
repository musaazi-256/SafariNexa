# Handoff: SafariNexa admin portal → Figma (as of 2026-11-04)

## Goal
Design the entire admin portal in Figma, flow by flow and page by page, with every state and modal, matching the code in `Prototype/src/app/admin/**`.
Target file: https://www.figma.com/design/OBOzr94yZV2n0egJ3jx3IY/SafariNexa-Admin-portal?node-id=3-2

## Done
- Built a Figma dev plugin at `design/figma-admin-portal/` that generates all of it as auto-layout layers:
  - `src/lib.js`: tokens (from globals.css / tailwind), layout helpers `F/H/V/T`, lucide icon components, Button and Badge component sets, inputs, table, dialogs.
  - `src/shell.js`: AdminSidebar, header, `screen()` and `withOverlay()` for modals and tooltips.
  - `src/screens-a.js`: Auth, Shell, Dashboard, Businesses, Verification, Listing reviews.
  - `src/screens-b.js`: Bookings, Payments, Users, Roles, Reviews, Support, Audit, Notifications, Settings, Profile.
  - `src/main.js`: pages, sections, captions, cover and flow map, design system page.
  - Build with `node build.mjs`, which writes `code.js`. Node lives at `~/.local/node-v22.23.4-darwin-arm64/bin` (it isn't on PATH).
- Output: 18 pages (00 Cover & flow map, 00 Design system, 01–16 flows) and 94 frames. The confirmation modals (formerly purple "PROPOSED") were built in code on 2026-11-04 via `Prototype/src/components/admin/confirm-submit.tsx` and are now labelled as built; re-run the plugin to refresh the file.
- Tested only against a mock Figma API (`design/figma-admin-portal/mock-run.js`; run `node mock-run.js code.js`): 0 errors, ~22k nodes. **Not yet checked in real Figma.**
- The user has imported the plugin into Figma desktop and was about to run it.
- Nothing is committed to git.

## Next
1. Confirm the plugin ran: look for the final message "94 frames on 18 pages" and any red "generation error" frames.
2. Use the Figma connection to screenshot frames, starting with Dashboard, Bookings list, the Filters modal, Verification detail and the Design system page. Compare them with the code.
3. Things to watch for:
   - text overflow in table cells and wrapping widths
   - stat card heights
   - the logo (`horizontal-white.svg` has a white rect)
   - tooltip and modal positions
   - section sizing
   - icon flatten/stroke rendering
4. Fix the issues in `src/*.js`, rebuild, delete the old generated pages, re-run. Or patch frames directly through Figma.
5. Optional follow-ups: mobile (390) frames, prototype links between frames, Figma variables for tokens, Code Connect.
