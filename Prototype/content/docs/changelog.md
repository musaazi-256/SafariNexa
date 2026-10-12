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

---

## 9 September 2026 (nav copy + a real mobile bug fix)

Header/footer auth-link wording changed from "Sign in"/"Create account" to "Log in"/"Sign up" across `site-header.tsx`, `site-footer.tsx`, and `mobile-nav.tsx`'s button-variant check (which was matching on the literal old label — left unfixed, this rename would have silently broken which auth button rendered as the primary/filled button).

**Real bug fixed in the same change**: `site-header.tsx`'s mobile-nav trigger wrapper was `hidden md:flex` — hidden by default, only shown at the `md` breakpoint and up. That's backwards for a *mobile* nav trigger: it meant the hamburger button was invisible exactly where it's needed (small viewports) and only appeared once the screen was already wide enough that the desktop nav links were showing anyway. Fixed to `flex md:hidden`. Confirmed live at both a 1280px desktop viewport (hamburger correctly absent, "Log in"/"Sign up" buttons shown) and a 390px mobile viewport (hamburger correctly present, auth buttons correctly hidden in favor of the mobile bottom nav) — screenshotted both.

---

## 11 September 2026 — admin/business portal UI consistency pass

Full review of every admin and business portal page against the app's real shadcn primitives, prompted by the observation that the two portals had independently reinvented the same table/header/filter/pagination shapes in different, inconsistent ways. Three parallel audits (admin pages, business pages, the actual shadcn baseline already in the codebase) found: zero admin pages used the real `Table` component (all hand-rolled `grid grid-cols-12` "fake tables"), almost no page in either portal used the real `PageHero`, the brand green was a three-way split (`#1e613c` and `#0d5932` on admin, `#0B4928` on business) that matched none of the real `--primary` token, admin's filter pills were three different shapes across its own pages, and business hand-rolled its own pagination on three pages instead of using the real `Pagination` component.

**New shared component**: `src/components/ui/filter-tabs.tsx` — a `FilterTabs` component (`tabs: {value, label, href, count?}[]`, `activeValue`) rendering the status-filter pill bar as real `<Link>`s driving a URL query param (deliberately not shadcn `Tabs`, since these are real navigations, not client-side ARIA tabs). The optional `count` is only ever passed when backed by a real query — a fake number was judged worse than no number.

**Converted to the real `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableHead`/`TableCell`**: all six admin list pages that were hand-rolled div-grids (`businesses`, `users`, `bookings`, `payments` — both its payments and refunds tables, `support`), plus business `settings`' Staff Access tab (the one confirmed fake table on the business side).

**Converted to the real `PageHero`**: every admin and business list/detail page that either hand-cloned its markup or had no header at all (admin `dashboard`, business `messages`) — 17 pages total across both portals. Business `dashboard` kept its existing custom image-banner hero (personalized greeting, business name, background photo, "View business profile" CTA) rather than being flattened to the generic header — that hero carries real, page-specific content `PageHero`'s generic eyebrow/title/description shape can't express, so only its color tokens were fixed, not its structure.

**Converted to `FilterTabs`**: every hand-rolled filter-pill bar in both portals, including business `revenue`'s previously non-functional plain-`<button>` fake-count tabs — reduced to a single real "All transactions" tab with a real count, since the four sub-tabs (Paid/Refunded/Pending payout/Not started) had no backing query logic and no real destination; fabricating that filtering was judged out of scope for a UI-consistency pass (it would mean moving the page off DB-level pagination).

**Wired up the real `Pagination`**: business `bookings`, `listings`, `reviews` (each previously hand-rolled prev/next, with `reviews` carrying a divergent extra ellipsis branch the other two lacked) and admin `verification` (imported but never rendered).

**Color tokens unified**: every hardcoded `#1e613c` / `#0d5932` / `#0B4928` / `#E4F2E8` replaced with `bg-primary` / `text-primary` / `border-primary` / `text-primary-foreground` (the real `--primary: 148 88% 25%` token), across both portals — including inline SVG `stroke`/`stopColor` attributes on the admin dashboard's sparklines, via `hsl(var(--primary))`.

**Real bug found and fixed along the way**: business `bookings/page.tsx`'s status-badge mapping (`getStatusDisplay`) checked for a `PAYMENT_REQUIRED` status that doesn't exist in the `BookingStatus` enum — the real value is `PENDING_PAYMENT` (confirmed against admin's own status grouping, which already handled both). Every business booking in that state was rendering the raw enum string `PENDING_PAYMENT` instead of a real label, while the identical admin page correctly showed "Payment required" — exactly the kind of admin/business inconsistency this pass was meant to catch. Fixed to match `PENDING_PAYMENT` too.

**Row-action menus left conservative**: where a "⋮" trigger was a bare unhandled button with no real destination anywhere in the row (e.g. admin `bookings` — there's still no admin booking detail route), it was left as-is rather than wrapped in a fake `DropdownMenu`. Where a real destination already existed elsewhere in the row (admin `businesses`' row already had a working "View" link/button next to the dead "⋮"), the dead button was removed instead of duplicating the same action inside a dropdown.

**Explicitly out of scope**: the decorative Filter/Export/date-picker toolbar buttons (already ruled on in an earlier session as intentional demo placeholders), the list-wrapper's literal component (`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden` was already the shared look both portals had converged on — made byte-identical, not replaced with shadcn `Card`), and any new admin routes/feature work (e.g. a real admin booking detail page).

Verification: `tsc`/`eslint`/`jest` clean across all 18 touched files (0 errors; only pre-existing `<img>`-vs-`next/image` warnings, not introduced by this pass). Confirmed live via a full Playwright pass signed in as the seeded admin and business test accounts — screenshotted admin `bookings`/`payments` and business `bookings`/`revenue` side by side to confirm the two portals now share the same table, header, pill, and color language.

---

## 15 September 2026 — mobile layout fixes on the public homepage

Investigated a report that the homepage "isn't handled well on mobile." A Playwright pass at a 390×844 mobile viewport (with DOM-measurement overlays, not just eyeballing screenshots) turned up three real, confirmed layout bugs — all now fixed:

| Bug | Root cause | Fix |
|---|---|---|
| "One Day Tours" row: card titles truncated hard (e.g. "Lake Bunyon…") and the price wrapped onto two lines, making cards uneven and the trailing chevron icon look squeezed | `CompactListingCard` (`src/components/compact-listing-card.tsx`) used a fixed `w-64` (256px) card with no responsive sizing, leaving only ~136px for the text column after the 64px thumbnail and chevron | Widened the card to `w-72`; added `truncate` to the price line so it can never wrap to a second line |
| "Plan a full trip" banner: the last step's label ("Transport") was visibly cut off at the card's right edge | The Stay/Safari/Food/Transport icon row (`src/components/trip-planner-banner.tsx`) used fixed desktop-sized icons (48px) and connector lines (48px each) that add up to ~336px — wider than the ~294px available inside the card's padding on a 390px viewport. The row overflowed past the section's own `overflow-hidden` boundary and got clipped | Icons and connectors now scale down below the `sm:` breakpoint (40px icons, narrower connector gaps) and the row is centered, comfortably fitting the available width; unchanged at `sm:` and up |
| **Most severe**: the site footer's last row — copyright line, "Payments via…" line, and the **"Engineering docs" link** — was completely and permanently hidden behind the fixed mobile bottom tab bar (`MobileBottomNav`, `h-[68px]`) on every customer-facing page. Confirmed via bounding-box measurement at max scroll: the link's rect sat entirely inside the bottom nav's rect, with no further scroll possible — the link was unreachable and unclickable on mobile, not just visually cramped | `SiteFooter`'s last block had no bottom padding reserved for the fixed-position bottom nav, so the page's natural scroll end landed exactly where the nav started covering content | Added `pb-[calc(68px+env(safe-area-inset-bottom))] md:pb-5` to the footer's last block (mobile only; reverts to normal `py-5` at `md:` and up, where the bottom nav is hidden). Also fixed `MobileBottomNav`'s own `pb-safe` class, which doesn't exist in this project's Tailwind config (no plugin defines it) and was silently a no-op — replaced with a real `paddingBottom: env(safe-area-inset-bottom)` on a wrapping element, so the fix's padding math is now correct on notched devices too, not just a flat 68px |

Verified fixed via the same DOM-measurement technique used to find each bug (not just re-screenshotting): the trip-planner icon row's right edge now sits inside the card's boundary with margin to spare, and the footer's "Engineering docs" link's bounding box no longer overlaps the bottom nav's at max scroll — confirmed on both the homepage and `/accommodation` (same shared `SiteFooter`), with a desktop-viewport screenshot confirming no padding regression where the bottom nav is hidden. `tsc`/`eslint`/`jest` clean on all four touched files.

---

## 16 September 2026 — account section's two mobile nav menus restructured

The customer account section (`/profile`, `/bookings`, `/profile/saved`, `/profile/messages`, `/notifications`, `/support`, `/profile/payment-settings`, `/profile/preferences` — all sharing `AccountLayout`) had two navigation surfaces that genuinely conflicted on mobile: the global fixed bottom tab bar (`MobileBottomNav` — Explore/Search/Saved/Messages/Profile) and the account section's own 8-item sidebar (`AccountSidebar` — Profile/Bookings/Saved/Messages/Notifications/Support/Payments/Preferences).

The sidebar (`src/components/customer/account-sidebar.tsx`) had no mobile-specific treatment at all — below the `md:` breakpoint it lost its `sticky`/`w-64` desktop sizing but still rendered as a full `w-full` vertical stack of all 8 nav items plus a "Need help?" card, sitting directly above the actual page content (the parent layout, `AccountLayout`, stacks the aside above the content on mobile via `flex-col`). In practice this meant a mobile visitor to any account page had to scroll past roughly 500–600px of duplicate navigation — 3 of those 8 items (Saved, Messages, Profile) already sit in the always-visible bottom tab bar — before reaching the content they navigated there for.

Fixed by giving `AccountSidebar` a real responsive split:
- **Mobile (`md:hidden`)**: the same 8 destinations, now rendered as a single-row horizontally-scrollable pill strip (`overflow-x-auto`, `no-scrollbar` — the same pattern already used by the homepage `SearchBar`'s category tabs), taking up one compact row instead of a multi-hundred-pixel block. The "Need help?" card is desktop-only now — its one link (Support) is already one of the 8 pills.
- **Desktop (`hidden md:flex`)**: unchanged — the original full sticky vertical sidebar with the "Need help?" card, exactly as before.

Also tightened `AccountLayout`'s gap between the nav and the page content on mobile (`gap-4` instead of the desktop `gap-10`, which was sized for the old full-height sidebar block) and replaced the sidebar's hardcoded `#1e613c` active-state color with the real `bg-primary` token while touching the file (same off-brand-green pattern fixed across the admin/business portals on 11 Sept; this customer-facing component had been missed since it wasn't in scope then).

Verified live at a 390×844 mobile viewport (signed in as the seeded customer test account): the pill strip renders correctly on `/profile` and scrolls to reveal all 8 items with correct active-state highlighting on `/notifications`; confirmed no horizontal page overflow; confirmed the desktop sidebar is pixel-identical to before at 1440×900. `tsc`/`eslint`/`jest` clean on both touched files.

**Related, complementary change found already in progress in the working tree** (`src/components/site-header.tsx`, `src/components/user-menu.tsx`) — the mobile hamburger menu (`MobileNav`, in the header) is now only rendered for signed-out visitors; a signed-in mobile user sees just the cart icon and avatar, since the avatar's dropdown (`UserMenu`) plus the bottom tab bar already cover navigation for them. `UserMenu`'s dropdown also dropped its "Saved" and "Messages" items, which duplicated the bottom tab bar. Reviewed and verified rather than assumed correct, per this repo's working practice for unexpected working-tree changes: confirmed `tsc`/`eslint`/`jest` clean, cleaned up two now-dead icon imports (`Heart`, `MessageSquare`) left behind in `user-menu.tsx`, and live-tested both the signed-in mobile header (avatar-only, dropdown correctly trimmed) and the signed-out mobile header (hamburger still present, since anonymous visitors have no avatar/bottom-tab equivalent for category browsing). One consequence worth knowing: a signed-in mobile visitor no longer has a persistent header link to `/accommodation`, `/tours`, `/guides`, or `/trip-planner` — those remain reachable via the homepage's own sections and search, just not as a standing nav item once signed in.

---

## 12 October 2026 — fixed homepage (and 4 other public pages) silently frozen at build time on Vercel

Reported: the homepage's "Stay at our top accommodations" section was rendering completely empty on the deployed Vercel site, despite working fine in local dev.

**Root cause**: `src/app/page.tsx` had no `searchParams` prop, no `auth()`/`cookies()` call, and no `dynamic`/`revalidate` export — the three things that make Next.js's App Router treat a page as dynamic. With none of them present, Next.js statically prerenders the page **once, at build time**, and bakes whatever the Prisma queries returned at that moment into the deployed HTML — permanently, until the next deploy. `next dev` always renders fresh per request regardless of this distinction, which is why the bug was invisible locally and only showed up in production.

Audited every public page in the app for the same gap (no `searchParams`, no `auth()` call, no dynamic export — any one of the three is normally enough to force live rendering). Four more pages had the identical exposure, all now fixed the same way:

| Page | What was frozen at build time |
|---|---|
| `src/app/page.tsx` | Homepage — accommodation/tour/restaurant/transport listings, guides, destinations |
| `src/app/destinations/page.tsx` | Destinations index and their listing counts |
| `src/app/explore/page.tsx` | The category-browse listing grid |
| `src/app/guides/[id]/page.tsx` | A guide's own profile — their tours, reviews, rating |
| `src/app/destinations/[slug]/page.tsx` | A destination's own detail page — its listings |

Every other public page was already safe: anything with URL filters reads `searchParams` (which forces dynamic rendering by itself), and anything behind sign-in calls `auth()` (which reads cookies, also forcing dynamic rendering) — `src/app/search/page.tsx` already had `export const dynamic = "force-dynamic"` explicitly set, which is the precedent this fix follows.

**Fix**: added `export const revalidate = 60` to all 5 pages — chosen over `force-dynamic` (the user's call, offered as an explicit tradeoff: always-fresh-but-a-DB-round-trip-per-visitor vs. cached-and-revalidated-in-the-background-at-most-once-a-minute). New listings, verification approvals, and review changes now reach the deployed site within about a minute instead of never.

Verified: `tsc`/`eslint`/`jest` clean on all 5 files; a full `next build` production build succeeds, and the homepage's route classification changed from what would have been a permanently-static prerender to `ƒ` (rendered per request, re-querying the database) — confirming this was a real, build-observable change in behavior, not just an unused export.
