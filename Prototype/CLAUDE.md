# Working in this repo

## Keep the engineering docs current

This project publishes two living documents as real in-app pages at `/docs`, `/docs/changelog`, and `/docs/overview` (source: `content/docs/changelog.md` and `content/docs/overview.md`, rendered by `src/app/docs/[slug]/page.tsx` via `src/lib/docs.ts`). They're linked from the public site footer and are the source engineers are pointed to for what's in the app and what recently changed.

**Whenever you make a code change in this repo, update both files as part of that same change — don't leave it for later:**

- **`content/docs/changelog.md`** — add an entry for what changed and why, in the same style as the existing entries (grouped by session/date, short "what/why" per item, a table for multi-item batches). Don't rewrite history that's already there.
- **`content/docs/overview.md`** — update the relevant module's status (Working / Partial / Placeholder) and description if the change affects it: a new route, a schema change, a fix that makes a Partial module Working, a new limitation, etc. Update §5 (data model) if the Prisma schema changed. Update §6 (consolidated known limitations) if a limitation was added or resolved.

If a change is purely cosmetic/internal (e.g. a lint fix, a variable rename) with no user- or engineer-visible behavior change, it's fine to skip the docs update — use judgment, but default to updating rather than skipping.

## Keep the Figma designs in sync

Figma screens and journeys are captured from the running app, not drawn by hand.

- After changing anything users see (`src`, `public`, `tailwind.config.ts`), run `npm run capture` here and commit the updated `design/handoff/` files with the change. It starts `next dev` if nothing answers on :3000, captures every page, tab, dialog and menu of the customer website and the business and admin portals, replays the journeys and rebuilds the three bundles.
- `npm test` fails with "UI code changed since the last capture" until you do.
- New pages are picked up automatically. Give a new route a group in `scripts/capture/groups.mjs`, or it appears in Figma under "Detected automatically · not yet grouped".
- A feature that adds a new user flow should add a journey to `scripts/capture/journeys.mjs`: steps are real actions, and each label says what the screen shows, then "Next:" and the action.
- The plugins in `design/figma-captured/` load the bundles from GitHub `main`; rebuild them with `npm run capture:plugins` only when `design/figma-captured/src/plugin.ts` changes, then re-import the manifest in Figma.
- Capturing creates demo bookings and payments in the local database.
