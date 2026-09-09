# SafariNexa — engineering changelog

**Started:** 9 September 2026, for handoff to the engineering team. This is a living document — every code change updates it (see `CLAUDE.md`), entries run oldest-to-newest below.
**Initial scope:** the three most recent active development sessions at the time this doc was created — **31 August 2026** (`7d14178`), **1 September 2026** (`f8fbc5a`), and **9 September 2026** (`3d365fe`). There was no development activity between 1 and 9 September.

For the full reasoning and evidence behind the 9 September commit specifically, see the three audit reports it was built from (all in repo root): `SAFARINEXA_CODEBASE_ANALYSIS_REPORT_2026-08-31.md`, `SAFARINEXA_FORMS_AUDIT_REPORT_2026-09-01.md`, `SAFARINEXA_FORMS_DEEP_DIVE_2026-09-01.md`, `SAFARINEXA_DEAD_BUTTONS_AUDIT_2026-09-01.md`.

---

## 31 August 2026 — `7d14178` "add booking chat & listing inquiries, harden admin access toggle"

**New feature — in-app messaging expansion:**
- Pre-booking inquiries: a customer can message a business directly from any listing detail page (`src/components/inquiry-dialog.tsx`), before booking. New action `sendListingInquiryAction` in `src/lib/actions/messages.ts`.
- Booking-scoped chat: a customer and business can message each other about a specific booking (`src/components/booking-chat.tsx`), rendered on both the customer's and business's booking detail pages. New action `sendBookingInquiryAction`.
- Both funnel into the existing `MessageThread`/`Message` models — no schema change this day.

**Security/correctness fix:**
- The admin "Suspend/Reactivate user" action previously trusted a hidden form field for the target status and had no audit logging. It now re-derives the status transition from the database record (a tampered form field can't force an invalid state), blocks an admin from suspending their own account, and logs to `AuditLog` like every other privileged admin action already did (`src/lib/actions/admin.ts`).

**Documentation fix:**
- `.env.example` previously documented Flutterwave as *the* payment provider with no Stripe variables listed, despite Stripe being the only gateway with real code behind it (webhook handler, admin refunds). Corrected to list `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` and accurately describe what's wired up.

---

## 1 September 2026 — `f8fbc5a` "expand messaging with read receipts and business-initiated threads"

**New feature — read receipts and business-initiated conversations:**
- `Message.readAt` added (nullable `DateTime`) — schema migration.
- `markThreadAsRead` action flips it for the counterparty's unread messages in a thread.
- Businesses can now start a new conversation with any past customer (`getBusinessCustomers`, `createThreadWithCustomer`) instead of only ever replying to inbound messages — a real gap in the messaging model closed.
- Both `src/components/customer/message-inbox.tsx` and `src/components/business/message-inbox.tsx` reworked around the new read-state and new-thread flows.
- `src/lib/actions/messages.test.ts` added, covering the core send/inquiry actions.

**Bug fix:**
- `/profile/messages` was rendering its own standalone page shell instead of the shared `AccountLayout` every other account page uses — it had no site header, sidebar, or footer. Fixed to use `AccountLayout` like its siblings, and the customer account sidebar (which had no "Messages" entry at all) got one added.

---

## 9 September 2026 — `3d365fe` "fix: data-loss bugs, availability integrity, admin/business identity separation, dead buttons"

This is the largest commit of the three — 41 files, the product of the four audit reports listed above plus two bugs found from direct user reports during testing. Grouped by theme:

### Data-loss bugs (silently discarded or overwritten real data)

| Bug | Fix |
|---|---|
| Editing an existing accommodation room silently reset bed type, room features, refundability, and refund/discount text to defaults on every save | The edit page now passes all 14 `RoomType` columns into the room editor's initial state, not 8 |
| Business onboarding wizard collected registration number, description, and contact person's name/role, then never sent them to the server | Now sent and persisted; added `BusinessProfile.address`/`registrationNumber`/`contactName`/`contactRole` columns |
| Business Settings' "Physical Address" field was written entirely into `BusinessProfile.city` (no `address` column existed), and `country` could never be edited anywhere | Split into three real fields — Address, City, Country — each mapped to its own column |
| Settings' description textarea used its own placeholder text as the saved default, so submitting without editing silently saved that literal placeholder as the real description | Now defaults to empty, placeholder text moved to the `placeholder` attribute only |
| Restaurant opening hours: the business form saved a plain string, the public page read `.summary` off it (matching only seed-data's shape) — every real business's hours were blank | Parser now writes `{ summary: <value> }`, matching the reader |

### Booking and availability integrity

| Issue | Fix |
|---|---|
| The room-selection widget used at booking time showed *less* detail than the room card the customer had just clicked (no bed type, features, or refund policy) | `reservation-fields.tsx`'s `RoomTypeOption` extended with the missing fields; both the accommodation detail page and checkout page now pass them through |
| The "We have N left" badge always showed the room's static configured total, never real remaining inventory | New `getRoomTypeRemainingToday` helper (`src/lib/listings.ts`) computes a real count; wired into the accommodation detail page |
| **Root-cause bug:** cancelling a booking never restored the `Availability.remaining` counter that booking creation decrements — it only ever ratcheted downward, so a room could eventually read "fully booked" purely from the accumulation of past cancellations, even though the customer-facing calendar (which counts live bookings directly) correctly showed it as free | New `releaseAvailabilityForBooking` helper in `src/lib/booking-service.ts`, called from both the business-decline and customer-cancel(unpaid) paths inside the same transaction as the status update |
| A room type could be edited or deleted and silently erase what a *historic* booking showed, since `Booking.roomTypeId` was a live, non-snapshotted relation | Added `Booking.roomTypeName` (snapshotted at creation, mirroring the existing `BookingAddOn` pattern); both booking-detail pages now prefer the snapshot with a live-relation fallback |
| Single-item checkout had no error handling — a validation failure (e.g. room sold out mid-session) crashed to a raw Next.js error page | Wrapped in try/catch with a redirect-and-banner pattern, matching what cart checkout already did |

### Admin/business portal correctness

| Issue | Fix |
|---|---|
| Admin verification "reject"/"needs changes" notes were hardcoded to the literal string `"Processed via admin portal"` and never reached the business | Verification cards now have a real notes textarea; notes flow into the notification sent to the business owner |
| The business verification status page always showed a static "under review" message regardless of the real status (including for REJECTED/SUSPENDED) | Now shows status-specific copy and the real reviewer notes when present |
| Admin's bookings list didn't fetch or show which room/add-ons a booking was for | Query extended to include `roomType`/`addOns`; a compact summary now shows in each row |
| Empty-state "mock" cards on the admin dashboard and verification queue had buttons that looked clickable but did nothing (they only render when there's no real data) | Converted to plain static badges so they don't look broken |

### Identity separation — found via direct user reports during this session, not the audits

| Bug | Root cause | Fix |
|---|---|---|
| Admin portal's own Profile page showed/overwrote a *customer's* name and phone | `AdminUser` had no `displayName`/`phone` of its own — it read/wrote the shared `User.name`/`User.phone`. Since `inviteAdmin` promotes an *existing* user (rather than creating a separate identity) when the invited email already belongs to a customer, an admin who started as a customer saw their customer-entered name on the admin side | Added `AdminUser.displayName`/`phone`; `/admin/profile` and `updateAdminProfile` now read/write only those, fully decoupled from any customer profile on the same login |
| Business owners clicking "Profile" in the business-portal header were sent to the customer `/profile` page instead of staying in the business portal | The business portal layout reuses the same shared `UserMenu` dropdown as the public site header, with no awareness of which portal it's rendered in | `UserMenu` gained a `surface` prop (mirrors the existing pattern on `AuthCard`); in the business portal, "Profile" now goes to `/business/settings` and stays there. Verified live with a signed-in business account. |

### Image upload guardrails

`src/components/ui/image-uploader.tsx` previously accepted any file of any size, any count, with no validation. It now enforces the 10MB limit its own copy already claimed, checks the file is actually an image, caps the number of photos, and shows a visible error instead of silently doing nothing. (Note: images are still stored as base64 text directly in Postgres, not a real object store — that larger change was explicitly deferred, see below.)

### Dead-button fixes

Eight buttons that existed but did nothing were wired to real destinations or honestly relabeled: the safety page's "Open Support Chat" (→ `/support`), the business listing form's "Preview listing" (→ the real listing page, edit mode only), the business dashboard's "View calendar" (→ real bookings) and "Create promotion"/"Download report" (no backing feature exists — now labeled "Soon" instead of silently doing nothing), a real delete action added behind the verification-document "⋮" menu, a broken link on the business onboarding page removed, and two dead/unused UI elements removed (message-composer emoji/attachment icons that were never implemented on either the customer or business side; an unused wishlist button on a component nothing currently renders).

A separate, larger set of decorative "Filter"/"Export"/date-range-picker controls across admin and business list pages, and the trip-planner builder (whose own list page already says "Coming soon — currently in development"), were deliberately **left as-is** — see "Explicitly deferred" below.

### Schema changes this day (all additive/nullable, safe)

- `BusinessProfile`: `address`, `registrationNumber`, `contactName`, `contactRole`
- `Booking`: `roomTypeName`
- `AdminUser`: `displayName`, `phone`

### Explicitly deferred (stated, not silent gaps)

These were identified during the audits but deliberately not built, because they're new features or need infrastructure decisions beyond a code fix:
- **Real payment gateway integration** — Stripe's webhook and refund code is real, but nothing in the app ever creates a Stripe Checkout Session/PaymentIntent, so payment success is still self-attested. This is the single biggest remaining item before real money can move.
- **Real object storage for images** — still base64-encoded directly into Postgres; needs a provider (S3/Cloudinary/Vercel Blob) and credentials.
- **Business verification documents** are written via a real filesystem write (`fs.writeFile` to `public/uploads`), which will not reliably persist on typical serverless hosting — flagged, not changed, pending a deployment-target decision.
- **Trip planner** — the whole itinerary builder is unreachable prototype scaffolding (its own list page says "Coming soon"); the schema (`TripPlan`/`TripPlanItem`) already supports it if/when it's prioritized as a real feature.
- **Multi-guest checkout** — `BookingParticipant.documentType`/`documentNumber` exist in the schema but checkout only ever collects the primary booker's details; building real per-guest collection is a feature request, not a bug fix.
- **Decorative Filter/Export/toolbar controls** across admin and business list pages, and forgot-password's disabled state (needs real email delivery) — left as intentional demo placeholders per product direction.

---

## Verification performed across all three sessions

`npx tsc --noEmit`, `npx eslint .`, and `npx jest` were run clean (0 errors) after every batch of changes, not just at the end. The 9 September commit's highest-risk changes (the room-booking widget, the availability release fix, the identity-separation fixes) were additionally verified against a live dev server — the room widget and remaining-count fix were confirmed by direct HTML inspection of a real listing page, and the two identity-separation fixes were confirmed with a full Playwright browser session signed in as the seeded admin and business test accounts, screenshotting the actual before/after behavior.

Nothing in this document has been deployed to production — all three commits are on `main` and pushed to `origin`, but no production deploy/migration has been run outside the local dev database.

---

## 9 September 2026 (later the same day) — engineering docs published as real in-app pages

This changelog and the companion project documentation (`content/docs/overview.md`) previously existed only as one-off markdown files in the repo root. Moved into the app itself so engineers can reach them without cloning the repo:

- New route `src/app/docs/page.tsx` — an index listing both docs.
- New dynamic route `src/app/docs/[slug]/page.tsx` — renders a doc's markdown source via `react-markdown` + `remark-gfm`, styled with `@tailwindcss/typography` (`prose` classes) to match the site's own look. `src/lib/docs.ts` holds the small shared read-and-metadata helper.
- Doc source moved from the repo root into `content/docs/{changelog,overview}.md` — this is the app's own directory, so the files are actually part of the deployable build (a repo-root file wouldn't be reachable from a server-side `fs.readFile` in a real deployment).
- New dependencies: `react-markdown`, `remark-gfm`, `@tailwindcss/typography` (added to `tailwind.config.ts` plugins).
- A single "Engineering docs" link added to the public `SiteFooter`, pointing at `/docs`.
- **This is public** — anyone visiting the live site can read it, including the parts that describe simulated payments and known limitations. Fine for a demo; reconsider gating it behind the admin portal before a real launch.
- New standing rule added to `CLAUDE.md`: both doc files get updated as part of every future code change, not as an afterthought — this entry is the first change made under that rule.

Verification: `tsc`/`eslint`/`jest` clean; confirmed live via a full Playwright pass — the footer link, the `/docs` index, both detail pages (headings, tables, and inline code all render correctly), screenshotted.

---

## 9 September 2026 (later still) — project structure & naming audit

Read-only audit of `Prototype/` against standard Next.js/React/TypeScript conventions — three parallel passes covering route structure, component/lib naming, and root-level/tooling config. Full findings: see the repo-root report `SAFARINEXA_STRUCTURE_NAMING_AUDIT_2026-09-09.md` (kept outside `content/docs` since it's a one-off snapshot, not a living page). No code changed in this pass.

Headline result: file-naming discipline is genuinely clean (kebab-case, 108/108 files checked in `components`/`lib`/`hooks`/`types`), but a handful of concrete issues are worth fixing: seven one-off scripts sitting loose in the project root instead of the existing `scripts/` folder, a real naming collision between `src/lib/actions.ts` and `src/lib/actions/`, a dead duplicate `use-mobile` hook file, inconsistent portal-shell component placement (business has its own component subfolder, admin and customer don't), and a few route-shape inconsistencies across the three portals (admin's sign-in path breaks the pattern the other two use, admin bookings has no detail route, `/reviews` has no index page). Full list and fix suggestions in the linked report.

---

## 9 September 2026 (structure fixes) — cleaned up the audit's findings

Built the mechanical/safe fixes from the structure audit above; deliberately left the route-shape items (see below).

- **`src/lib/actions.ts` → split into `src/lib/actions/`**, resolving the name collision with the existing `actions/` folder: `session.ts` (`signOutAction`), `customer.ts` (`toggleSavedItem`, `getAccommodationRoomsAction`), `business.ts` (`setActiveBusiness`). Updated all 6 importers.
  - **Bonus fix found while moving it**: `getAccommodationRoomsAction` (used by the listing-card "quick view" room preview modal, `src/components/rooms/room-preview-modal.tsx`) had the same incomplete room-field mapping that was fixed at the other two call sites in an earlier session — this third call site was missed then. Now carries bedType/bedrooms/roomFeatures/isRefundable/refundPolicyText/discountNotice/totalRooms like the other two, so the quick-view modal shows the same room detail as the full listing page.
- **Deleted the dead duplicate hook** `src/hooks/use-mobile.tsx` (only `.ts` was ever imported).
- **Cleaned up the project root**: moved `check-bookings.ts`, `link-businesses.js`, `seed-messages.ts` into `scripts/` (alongside the four seed scripts already there); deleted `fix-pagehero.js` and `fix-tables.js` (one-time codemods, already applied — confirmed idempotent-and-already-run before deleting), `reorder.sh` (single-file throwaway script, and the file it targeted has since changed shape, so it's no longer even valid to re-run), and `test_onboarding.mjs` (an incomplete scratch file that never actually called anything despite the name).
- **Reorganized portal-shell components** into each portal's own subfolder, applying one consistent rule across all three: `business-sidebar.tsx`/`business-switcher.tsx` → `src/components/business/`; `admin-sidebar.tsx` → new `src/components/admin/`; `account-layout.tsx`/`account-sidebar.tsx` → `src/components/customer/`. Updated the 3 portal layouts and all 8 customer-page importers.
- **Small config cleanup**: `@tailwindcss/typography` moved from `dependencies` to `devDependencies` (it's a Tailwind build-time plugin only); removed the dead `db:migrate` script (the project manages schema via `db push` everywhere, no `migrations/` folder exists) and the duplicate `seed`/`db:seed` scripts (kept `db:seed`); added a comment to `.env.example` explaining why `SAFARINEXA_PRISMA_DATABASE_URL` intentionally isn't the bare `DATABASE_URL` Prisma conventionally expects.

**Deliberately not fixed** — the route-shape items from the audit (admin sign-in path, list/detail/edit shape differing between the business and admin portals, admin bookings having no detail route, `/reviews` having no index page): these change actual URLs and, in a couple of cases, imply real feature work (e.g. an admin booking detail page doesn't exist yet — building one is a feature, not a rename), not a mechanical structure fix. Flagged for a separate decision.

Verification: `tsc`/`eslint`/`jest` clean; confirmed live — signed in as both the business and admin test accounts and loaded each portal's dashboard (which renders the moved sidebar/switcher components), plus a customer profile page (renders the moved `AccountLayout`), all 200s with no runtime import-resolution errors.
