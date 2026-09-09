# SafariNexa — project structure & naming audit

**Date:** 9 September 2026. Scope: `Prototype/` (the actual Next.js project root) checked against standard Next.js 14 App Router, React/TypeScript, and general project-layout conventions. Three parallel passes: route structure, component/lib naming, root-level/tooling config. Read-only — nothing fixed in this pass.

## Verdict

**Solid overall, with specific, fixable deviations — not a systemic problem.** The headline result: file-naming discipline is genuinely excellent (kebab-case filenames, PascalCase exports, checked exhaustively across all 108 files in `components`/`lib`/`hooks`/`types` — zero deviations found), Next.js reserved-file conventions are used correctly everywhere, folder naming under `src/app` is 100% clean kebab-case, and `tsconfig`/ESLint/Prisma are all standard, unmodified-from-sensible-defaults setups. The issues below are real but localized.

## Fix these

### 1. Seven scripts sitting loose in the project root
`Prototype/scripts/` already exists and holds four Prisma seed/data scripts. These seven do the same category of work but sit in the root instead, which is inconsistent with the project's own established pattern:

| File | What it is |
|---|---|
| `check-bookings.ts` | One-off diagnostic dump of booking/business counts |
| `fix-pagehero.js` | One-time codemod (already applied) — rewrote `<PageHero>` usages across admin/business |
| `fix-tables.js` | One-time codemod (already applied) — wrapped `<Table>` elements in a bordered div |
| `link-businesses.js` | Dev-data script linking a hardcoded test user to every business |
| `reorder.sh` | Single-purpose regex script hardcoded to one file path — throwaway |
| `seed-messages.ts` | Seed script generating fake message threads |
| `test_onboarding.mjs` | Incomplete scratch file — builds a form and does `console.log`, never actually calls anything or asserts; not a real test despite the name |

**Fix:** move the still-useful ones into `scripts/` (`check-bookings.ts`, `link-businesses.js`, `seed-messages.ts`); the two already-applied codemods (`fix-pagehero.js`, `fix-tables.js`) and the incomplete `test_onboarding.mjs` have no ongoing purpose and can just be deleted.

### 2. `src/lib/actions.ts` vs `src/lib/actions/` — a real naming collision
Six components import `signOutAction`/`toggleSavedItem`/`setActiveBusiness`/`getAccommodationRoomsAction` from `src/lib/actions.ts` (a loose file), while every *other* server action in the app lives under `src/lib/actions/` (`admin.ts`, `business-settings.ts`, `messages.ts`, `onboarding.ts`, `team.ts`, `verification.ts`). A file named `actions.ts` sitting next to a folder named `actions/` is an easy source of import confusion — someone typing `@/lib/actions` and expecting the folder's contents finds four unrelated functions instead.

**Fix:** move the four functions in `src/lib/actions.ts` into `src/lib/actions/` (split by concern, e.g. `src/lib/actions/customer.ts` for `signOutAction`/`toggleSavedItem`, `src/lib/actions/business.ts` for `setActiveBusiness`/`getAccommodationRoomsAction`), update the six importers.

### 3. A dead, duplicate hook file
`src/hooks/use-mobile.ts` and `src/hooks/use-mobile.tsx` both export a `useIsMobile()` with nearly identical bodies. Only the `.ts` version is imported anywhere (`src/components/ui/sidebar.tsx`); the `.tsx` one is orphaned — likely leftover shadcn/ui scaffolding.

**Fix:** delete `src/hooks/use-mobile.tsx`.

### 4. Inconsistent portal-shell component placement
`src/components/business/` holds 10 business-portal-only components, but the portal's own shell pieces — `business-sidebar.tsx`, `business-switcher.tsx` — sit at the top level instead. The customer portal has the opposite problem: `account-layout.tsx`/`account-sidebar.tsx` are customer-only but there's no `src/components/customer/` equivalent to put them in (the one file that *does* exist there, `customer/message-inbox.tsx`, is isolated). The admin portal has no subfolder at all — `admin-sidebar.tsx` sits top-level with nowhere else it could go. Three portals, three different conventions for where their own shell lives.

**Fix (pick one convention, apply everywhere):** either move every portal's shell components into that portal's subfolder (`components/business/business-sidebar.tsx`, create `components/admin/admin-sidebar.tsx`, decide whether `account-*` counts as "customer" and move it into `components/customer/`), or conversely move `business-sidebar.tsx`/`business-switcher.tsx` back up to match admin/customer's top-level placement. Either is fine; the inconsistency across all three is the actual problem.

### 5. Route-shape inconsistencies across the three portals
- **Admin sign-in breaks the pattern**: customer is `auth/sign-in`, business is `business/auth/sign-in`, admin is `admin/login` — not `admin/auth/sign-in` (even though `admin/auth/` exists as a folder for other things). Cosmetic but worth aligning.
- **List→detail/edit shape differs per portal**: admin's `businesses/[id]` is view-only (no edit route); business's `listings/[id]` is edit-only (no view/detail route — the list page links straight to `.../edit`, skipping a detail view entirely). Same underlying "manage one record" concept, two different shapes.
- **Admin can't drill into a single booking.** Customer and business both have `bookings/[id]` detail pages; admin's `bookings` list has no `[id]` sibling at all — admin can see the list, not open one.
- **`/reviews` has no index page.** Every comparable top-level resource (`guides`, `tours`, `support`, `bookings`) has one; `reviews` only has `reviews/new`. Bare `/reviews` currently 404s.
- **`src/app/saved/page.tsx`** is a single-purpose redirect to `/profile/saved` — the only page in the whole tree whose entire body is a redirect. Consider a `redirects()` entry in `next.config.mjs` instead, or delete it if nothing still links to `/saved`.

### 6. Small config/dependency items
- `@tailwindcss/typography` landed in `dependencies` (package.json) but it's a Tailwind build-time plugin only — should be in `devDependencies`, matching `tailwindcss-animate` right next to it.
- `db:migrate": "prisma migrate dev"` (package.json) is dead/misleading — the project actually manages schema via `db push` everywhere else (`build` script, `db:push`), and there's no `prisma/migrations/` folder. Either remove this script or leave a comment explaining it's intentionally unused.
- `seed` and `db:seed` are identical duplicate npm scripts — harmless, but pick one.
- `SAFARINEXA_PRISMA_DATABASE_URL` (vs. the Prisma-conventional `DATABASE_URL`) is the one env var that breaks the plain `SCREAMING_SNAKE_CASE`-no-prefix pattern every other variable follows. Likely intentional (avoids collisions with tooling defaults) — no fix needed, just worth a one-line comment in `.env.example` explaining why, so the next engineer doesn't "fix" it into a collision.

## Worth knowing, not necessarily worth fixing
- `src/components/business/message-inbox.tsx` exports `MessageInbox`; the parallel `src/components/customer/message-inbox.tsx` exports `CustomerMessageInbox` — same filename in two folders, only one side is role-prefixed. Harmless (folder already disambiguates the import), but inconsistent if you're grepping for the export name specifically.
- `src/lib/admin.ts` (a plain `requireAdminSession()` auth-guard helper) and `src/lib/actions/admin.ts` (the actual admin server actions) share the "admin" name across two different `lib` locations. Both are correctly placed by the established `actions/`-vs-not split (see item 2) — just flagging that the shared name invites a double-take.
- No `loading.tsx`/`error.tsx`/`not-found.tsx` exist anywhere in the route tree — not a naming issue, a missing-feature note for another day.
- No barrel (`index.ts`) files exist anywhere — consistently absent, not inconsistently applied, so not a smell; mentioned only because it's often assumed and isn't here.

## Not audited here
This pass covered structure and naming only — not correctness, security, or completeness (those were covered by the earlier `SAFARINEXA_CODEBASE_ANALYSIS_REPORT_2026-08-31.md`, `SAFARINEXA_FORMS_AUDIT_REPORT_2026-09-01.md`, `SAFARINEXA_FORMS_DEEP_DIVE_2026-09-01.md`, and `SAFARINEXA_DEAD_BUTTONS_AUDIT_2026-09-01.md`).
