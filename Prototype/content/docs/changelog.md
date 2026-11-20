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

---

## 12 October 2026 (same day) — the revalidate fix wasn't enough: fixed the seed script's actual self-healing gap

After the `revalidate = 60` fix deployed, the homepage's "Stay at our top accommodations" section was still empty on Vercel — but other sections on the same page load (e.g. "One Day Tours") showed real data. That ruled out caching/connectivity as the cause: if the database were unreachable or the page were still frozen, every section would be empty, not just one.

**Root cause, found by reading `prisma/seed.ts` and `package.json` together**: the `build` script (`prisma generate && prisma db push --accept-data-loss && prisma db seed && next build`) runs the seed script on **every single Vercel deploy**, not just the first one. But every `db.businessProfile.upsert`/`db.listing.upsert` call in the seed script had an empty or near-empty `update: {}` clause — meaning `verificationStatus`/`status` are only ever set by the `create` branch, the very first time a row is made. If "Nile & Crater Lodges" (the one business that owns every accommodation listing) ever had its verification status changed away from `APPROVED` on the live production database — the likeliest cause being someone testing the admin Suspend/Reject action against it on the deployed site — every subsequent deploy's auto-seed would silently leave it that way forever, since an empty `update: {}` is a no-op on an existing row. The codebase already had precedent for exactly this class of fix (a comment at the accommodation-listing upsert: "Self-healing for existing deployments (like Vercel) where rooms were seeded without images" — that self-healing only covered room images, not the business/listing status fields that actually gate what the public site shows).

**Fix** — extended the same self-healing pattern, narrowly, to just the fields that gate visibility (not a wholesale reset of every field, which would blow away real edits made through the live UI):
- `upsertBusiness()`'s business-profile upsert: `update: {}` → `update: { verificationStatus: "APPROVED" }`; its `businessVerification` upsert: `update: {}` → `update: { status: "APPROVED" }`.
- All four listing-type loops (accommodation, tours, restaurants, transport): added `status: "PUBLISHED"` to each `update` clause (accommodation's `update` already set `images`, now also sets `status`).

This applies to the 4 "core" demo businesses (one per category) and their seed-defined listings specifically — anything created later through the real product UI (a business owner's own new listing, say) is untouched, since the seed only upserts by the specific IDs it already knows about.

**Verified by directly simulating the production failure mode locally** (not just re-reading the code): connected to the local Postgres DB, manually set `nile-crater-lodges` to `SUSPENDED` and all 26 of its accommodation listings to `ARCHIVED` — reproducing exactly what the live symptom implied. Re-ran `npm run db:seed`. Confirmed via direct SQL: the business was back to `APPROVED`, 24 of the 26 listings (the ones the seed script actually owns) were back to `PUBLISHED`, and the exact query the homepage runs (`type = ACCOMMODATION AND status = PUBLISHED AND business.verificationStatus = APPROVED`) returned 24 rows again, up from 0. `tsc`/`eslint`/`jest` clean.

---

## 13 October 2026 — Card UI system alignment with Figma design specifications

Aligned card primitives and marketplace card layouts with the Figma design specification following the transition to a pure white (`#FFFFFF`) application background:

- **`Card` foundation (`src/components/ui/card.tsx`)**: Changed base border from `border-transparent bg-white` to `border border-border bg-card shadow-card`, ensuring all cards maintain crisp outline definition and elevation against the pure white page background.
- **`ListingCard` (`src/components/listing-card.tsx`)**:
  - Image media header: Standardized to exact 150px height with rounded top, Verified badge (`variant="success-soft"`) top-left, category/feature highlight badge (`variant="accent"`) bottom-left, and circular wishlist action top-right.
  - Body layout: Refined typography to 16px font-semibold title, 13px muted location with map pin, and paired rating (`★ 4.8 (126)`) alongside availability cue (`Available 15–20 Jun` in `text-success`) in a single horizontal row as designed in Figma.
  - Pricing & Actions: Cleaned up vertical duplication into a unified single-line `From [price] / night` format with 16px font-semibold styling. Removed the extra modal button on marketplace cards so accommodation cards match the clean Figma layout and align evenly across discovery rails.
- **`CompactListingCard` (`src/components/compact-listing-card.tsx`)**: Refined thumbnail image rounding, bold title, compact price typography, and hover chevron interaction.
- **`GuideCard` (`src/components/guide-card.tsx`)**: Enforced line-clamping on bio and aligned border/shadows with the updated card system.
- **`ProtectedAction` (`src/components/protected-action.tsx`)**: Updated card container to use clean `rounded-2xl border border-primary/20 bg-primary/5 shadow-card` styling with standardized padding.
- **Homepage (`src/app/page.tsx`) & Accommodation Page (`src/app/accommodation/page.tsx`)**: Wired review counts and availability cues to `ListingCard` instances across Accommodation, Restaurants, and Transport sections.

---

## 1–2 November 2026 — full product engineering audit and remediation

A full-product audit (`SAFARINEXA_FULL_PRODUCT_ENGINEERING_AUDIT_2026-11-01.md`, repo root) found the prototype's booking/payment integrity, authorization and routing had regressed well past what §1/§2.4 of this document described as "simulated but contained" — e.g. tour checkout threw a raw Prisma foreign-key error, a blank login form silently provisioned a demo admin account, and the single payment action marked every method `SUCCESSFUL` with no provider ever contacted. The same work session then implemented and verified fixes for nearly all of it (`SAFARINEXA_FIXES_AND_VERIFICATION_2026-11-01.md`); this entry summarizes that remediation. **This is a large, multi-area batch landing in one changelog entry because it was committed as one block of pre-existing uncommitted work — see the companion audit/fix/verification documents in the repo root for full line-level detail**, not because it was authored as a single change.

**Booking and inventory:**
- Tour checkout's `roomTypeId: ""` crash is fixed with a real deterministic departure-inventory identity instead of a fictitious RoomType row.
- Reservation transactions are now serializable and correctly count legacy/seeded bookings; invalid, reversed, and same-day stays are rejected; tour group-size minimums are enforced alongside the existing maximum.
- The business `AvailabilityCalendarEditor` is now reachable from listing editing (previously built but never mounted); price overrides are honored by the booking service; the booking-count calendar now excludes `REFUNDED` bookings and release logic recalculates remaining capacity instead of blindly incrementing it.
- Transport fixed fares are no longer multiplied by passenger count; restaurant bookings now check the reservation-request setting, seating capacity, and operating hours. A protected `/api/jobs/expire-bookings` endpoint can release abandoned unpaid holds (must still be scheduled in deployment infrastructure — nothing calls it on a timer yet).

**Payment and finance safety — the most significant change in this batch:**
- Removed `processPaymentAction`'s self-attested success path entirely (previously: every method, including `"stripe"`, was marked `SUCCESSFUL` with no gateway ever contacted — this is what §1/§2.4 called "simulated"). Replaced the raw card-number/CVV form with real **Stripe-hosted Checkout**; with no Stripe keys configured, checkout now honestly disables itself with an unpaid message instead of faking success. Mobile money is no longer presented as a working integration.
- The Stripe webhook now validates payment identity, currency/amount, and payable state before acting, with idempotency keys and terminal-status guards against duplicate effects; notifications correctly target business-member `User` IDs instead of `Business` IDs (previously a type mismatch that could throw inside the webhook transaction).
- Refunds/payouts: partial refunds now use the actual requested amount instead of marking the whole payment refunded; non-Stripe refunds and payout "settlement" can no longer be marked `COMPLETED` without a real provider transfer — the unconfigured payout action is disabled rather than fabricating completed transfers.
- Receipt/success pages (`/payments/receipt`, `/payments/success`) now derive their messaging from actual owned payment records — an unpaid booking can no longer render a "Payment successful" receipt (this was reproducible pre-fix).
- Admin/business revenue figures and dashboard activity/health metrics are now computed from real booking-level payment allocations, including multi-business orders, replacing several hardcoded/simulated values described as decorative in §3.8/§4.1 below. Historical seeded/self-attested payment rows are **not** retroactively reclassified as real — they still need operator reconciliation before go-live.

**Authorization and data capture:**
- Removed the blank-credentials demo-login fallback, the hardcoded fallback `AUTH_SECRET`, and `AUTH_DEV_MODE`'s session-wide admin elevation — all three were flagged as release hazards in the audit. `AUTH_DEV_MODE` is now a validated-but-inert legacy flag (`src/lib/dev-mode.ts`); real seeded demo accounts still sign in through the normal, now-hardened credentials path (a dev-only quick-sign-in convenience button was added separately, gated to `NODE_ENV !== "production"` — never shown on any deployed build).
- JWT admin authority is now refreshed against the database rather than trusted from token claims; password reset invalidates existing sessions by credential version; listing child-record edits (rooms/add-ons) now verify every submitted ID belongs to the authorized parent listing before writing.
- Admin invitations no longer default every invite to Super Admin, and a manager can no longer invite an owner or promote another manager — this was previously flagged as a cosmetic-roles gap in §4.4/§6.
- Verification documents moved from `public/uploads` to private storage with content/type/size validation and authorized download routes; old public URLs are now intercepted and require authorization (`src/middleware.ts`, `src/lib/private-documents.ts`). Message read-state now checks thread membership per user instead of one shared `readAt`, fixing a bug where one staff member's "read" could clear another's unread badge.

**Routing, dead controls, mobile and accessibility:**
- Added the admin audit log (`/admin/audit`) and booking/verification detail routes that were previously linked from the dashboard but returned 404 (flagged in §4.1/§4.3/§4.10 below — the admin Reports removal itself is unrelated and still stands).
- Fixed the `/admin/payments?status=pending` crash (the UI sent `PENDING`, which isn't a valid `PaymentStatus` enum value). Filters across admin/business tables now submit real URL-backed searches; table "Export" controls now download the visible rows as CSV.
- Added a business booking calendar and exposed guides/support/verification in business navigation. Removed several enabled-looking controls that did nothing (bulk actions, date-range pickers, row overflow menus) instead of leaving them as inert no-ops, per the dead-control inventory in the audit.
- Trip planner (previously "Placeholder" per §2.10) now persists owned itineraries to `TripPlan`/`TripPlanItem` — add/edit/remove/save work against a real detail URL. It still does not create reservations.
- Added responsive fixes (min-width-safe grid/flex children, wrapped pagination, scrollable tables) verified at 390px across ~50 views with no document-level horizontal overflow (`SAFARINEXA_RESPONSIVE_VERIFICATION_2026-11-02.md`), plus shared `error.tsx`/`loading.tsx`/`not-found.tsx` pages and a shared image component that cleared the lint image-alt warning.

**Verified:** `tsc` clean; Jest 57 tests / 7 suites passing (up from 18); lint clean with no warnings; a production-mode build passes with `AUTH_DEV_MODE=false` and no longer pushes or seeds the database on build. Browser-verified: tour cart checkout now reaches a real (disabled, since no Stripe key is configured) payment page instead of throwing; an unpaid order's receipt correctly reads "not a receipt"; a saved itinerary round-trips through its own detail URL; customer access to `/admin` is denied with dev-mode escalation removed, while seeded admin credentials still sign in normally.

**Not fixed by this batch** (still open — see "Still required before release" in `SAFARINEXA_FIXES_AND_VERIFICATION_2026-11-01.md` for the full list): no real payment provider is actually configured yet, so checkout is honestly disabled rather than live; mobile money and payouts remain unimplemented as live transfer integrations; email/SMS delivery is still unconfigured so password reset/invitation-acceptance email can't be exercised end to end; admin platform settings (§4.9) and admin reporting (§4.10) remain unbuilt.

---

## 2 November 2026 — admin permission levels: invite-time role picker + a real roles & permissions page

A Figma documentation pass on the admin invite flow surfaced a real product gap, not just a documentation one: `/admin/users/new` was a single email field, and `inviteAdmin()` hardcoded every invite to one role server-side. The `Role`/`Permission`/`RolePermission` tables already existed in the schema and were already checked throughout the admin actions via `requireAdminSession("some.permission.key")`, but nothing in the UI let anyone actually choose or define what a permission level grants. This session built that missing layer.

**New:**
- `/admin/roles` — lists every permission level (role) with its description, how many admins currently hold it, and an editable checklist of what it grants (`businesses.manage`, `users.manage`, `payments.manage`, `support.manage`, `reviews.moderate`). "Super Admin" renders as a fixed, non-editable "full access" row — it bypasses permission checks by role name in `requireAdminSession()`, not through grants, so letting someone "edit" it would be misleading.
- `/admin/roles/new` — create a new permission level from scratch with exactly the permissions it needs.
- `inviteAdmin(email, roleId)` — now takes a real `roleId` instead of silently assigning one hardcoded role; `/admin/users/new` gained a "Permission level" dropdown populated from the real `Role` table.
- `/admin/users` — each admin's actual permission level (not just the coarse customer/business/admin `User.role`) is now shown, and can be changed in place via a new `updateAdminUserRole` action — except on your own row, mirroring the existing self-suspend guard on `toggleAdminUserStatus`.
- New permission key `roles.manage`, gating all of the above. It's deliberately never granted to any role through a `RolePermission` row — only Super Admin can reach it, via the same hardcoded role-name bypass that makes Super Admin all-powerful — so no lower permission level can ever escalate itself by editing its own grants.
- Seed data: three new starter roles giving every existing permission key a dedicated home — Finance Manager (`payments.manage`), Verification Reviewer (`businesses.manage`), Content Moderator (`reviews.moderate`) — and Support Agent, previously created with zero actual grants despite its description promising support-case access, now actually has `support.manage`.

**Verified**: `tsc`/`eslint` clean; new `src/lib/actions/roles.test.ts` and `src/lib/actions/admin.test.ts` cover role creation, permission-grant/revoke sync, the Super-Admin-is-uneditable guard, the self-role-change guard, and invite-role validation (16 new tests, 123/123 passing project-wide). Browser-verified end to end against the real seeded database: the invite form's dropdown lists all 6 roles; toggling a permission on an existing role and reloading shows it persisted; changing `agent.support`'s level away from and back to "Support Agent" round-tripped correctly; your own row never shows the role-change control.

**Still not built**: role deletion, and a way to see at a glance which permission a given admin action actually requires (today that mapping only lives in each server action's `requireAdminSession("...")` call). Neither was asked for — scoped to exactly what the invite/role-assignment gap needed.


---

## 4 November 2026 — confirmation step for risky one-click admin actions

The admin portal Figma pass showed that several high-impact admin actions ran the instant the button was clicked, with no "Are you sure?" step — a misclick could refund money, reject a business or suspend an admin. These now open a confirmation dialog first, matching the "PROPOSED" frames in the Figma file.

**New:** `src/components/admin/confirm-submit.tsx` — a client `ConfirmSubmit` wrapper that sits inside an existing server-action `<form>`. Its button opens a dialog instead of submitting; confirming submits the same form with the same `name`/`value`, so no server action changed. It runs the form's own validation before opening (e.g. required reviewer notes), can preview what the admin typed, and closes once the action settles.

| Where | Action | Dialog |
|---|---|---|
| `/admin/verification/[id]` | Reject submission | "Reject this submission?" with reviewer-notes preview |
| `/admin/verification` | Flag (suspends the business) | "Place a fraud hold?" |
| `/admin/listings/[id]` | Reject / Approve and publish | "Reject this listing?" / "Approve and publish?" |
| `/admin/users` | Suspend (not Reactivate) | "Suspend [name]?" |
| `/admin/payments` | Approve refund | "Approve this refund?" with amount |
| `/admin/reviews` | Hide review | "Hide this review?" |
| `/admin/support/[id]` | Close | "Close this case?" |
| Admin sidebar | Sign out | "Sign out of the admin portal?" |

Lower-risk or reversible actions (approve business, request changes, start review, reactivate, publish/flag review, other case statuses) still submit on one click.

**Verified:** `tsc` and `eslint` clean; new `src/components/admin/confirm-submit.test.tsx` (3 tests: confirm submits with the chosen decision, cancel doesn't submit, empty required fields block the dialog). Not yet browser-verified against the running app.

---

## 4 November 2026 — live demo repaired: database schema sync + configuration-free demo sign-in

The Vercel deploy of `9ca40bc` built cleanly but every database-backed page showed the error screen, and sign-in returned "There was a problem with the server configuration".

**Cause 1 — schema never reached the hosted database.** The 2 Nov change removed `prisma db push && prisma db seed` from `build`, but that batch also added 3 tables (`ListingSubmission`, `ListingImageUpload`, `MessageReadReceipt`) and 11 columns. The hosted database was synced manually with `prisma db push` + `prisma db seed` (purely additive; verified with `prisma migrate diff` before and after). **Future schema changes must be pushed to the hosted database by hand** until a migration step is added to deploys.

**Cause 2 — no `AUTH_SECRET` on Vercel.** The 2 Nov fix removed the hardcoded fallback secret. Now `getAuthSecret()` (`src/lib/dev-mode.ts`) uses `AUTH_SECRET` when set, and in demo mode only falls back to a fixed public demo secret; demo mode also sets `trustHost`. Live mode (`SAFARINEXA_DEMO_MODE=false`) still requires a real secret. This is acceptable because demo mode already lets anyone sign in as any seeded account, so a forgeable session grants nothing extra.

**Demo sign-in UI:** in demo mode the customer, business and admin sign-in cards show the email and password fields prefilled (read-only) with the seeded account, and the main button ("Continue as customer/business/admin") signs straight in through the passwordless `demo` provider. Google sign-in and the separate "Quick access" box are hidden in demo mode. Live mode is unchanged.

**Verified:** tsc, lint, Jest 206 tests / 42 suites; local run with `AUTH_SECRET` unset: `/api/auth/session` no longer errors, demo admin sign-in returns a Super Admin session and `/admin/dashboard` loads.

---

## 4 November 2026 — Nile & Crater Lodges demo dataset, inbox and dashboard layout fixes

| Item | What / why |
|---|---|
| `npm run db:demo:nile` (`scripts/seed-nile-crater.ts`, `docs/nile-crater-demo.md`) | Additive demo dataset for the Nile & Crater Lodges business: 12 more properties, 36 fictional guests, ~336 bookings across every booking/payment/refund status, payouts and 82 reviews. Refuses to run unless the database host is localhost, so it can't touch the hosted database. |
| Business inbox (`message-inbox.tsx`) | The customer/booking details panel moved beside the chat as its own card and only sticks when it fits the viewport, so the bottom of a tall panel stays reachable; thread list and messages scroll independently. |
| Admin dashboard stat cards | The 12-metric grid uses a new `compact` StatCard variant (smaller icon, tighter spacing, no divider above links). |

**Verified:** tsc, lint, Jest 206 tests passing.

---

## 4 November 2026 — demo data for the admin listing review queue

`/admin/listings` was always empty on a fresh database because the seed created no `ListingSubmission` rows. `prisma/seed.ts` now seeds 9 submissions across every queue tab: 3 Submitted (Riverside Glamping draft, Nile View Terrace, Entebbe Airport Transfer), 2 Under review, 1 Needs changes, 1 Approved, 1 Rejected, 1 Withdrawn, with reviewer notes on the decided ones. Snapshots are taken from the current listing content, so the approve / request changes / reject actions work on them. Fixed IDs (`lsub-*`) make the block idempotent; re-running the seed resets the demo queue to these states.

**Verified:** tsc clean; seeded the local database and checked every queue tab and a submission detail page render as the demo admin.

---

## 4 November 2026 — pagination redesigned on the ReUI "c-pagination-15" pattern

Every paginated list (21 pages: public catalogues, customer bookings, notifications, admin and business tables) now uses the ReUI c-pagination-15 layout: "Page X of Y" on the left, Previous / numbered pages with ellipses / Next in the middle, and an optional "N / page" select on the right.

- `npx shadcn add @reui/c-pagination-15` can't install into this project: `components.json` uses the legacy `default` style, which has no `native-select`. The two shadcn primitives it depends on were added by hand in their standard shape: `src/components/ui/pagination.tsx` (links use `next/link`) and `src/components/ui/native-select.tsx` (styled with the existing `filter-select` class).
- The app's `Pagination` component (same props: `currentPage`, `totalPages`, `buildHref`) moved to `src/components/page-pagination.tsx`; all imports were updated.
- New optional `pageSize` prop shows the "N / page" select (options from `PAGE_SIZE_OPTIONS`: 9, 20, 50, 100) and keeps `?perPage` in every page link. A page must read `parsePageSize(searchParams.perPage)` for its skip/take before passing `pageSize`; **no page does yet**, so the select is hidden everywhere for now rather than shown as a control that does nothing.

**Verified:** tsc, lint, Jest 307 tests (4 new in `page-pagination.test.tsx`); `/accommodation?page=2` renders the new bar in a dev build.

---

## 4 November 2026 — ReUI / shadcn component library (library only, no page changes)

Requested ReUI items (`c-phone-input-8`, `c-progress-4/7`, `c-rating-6/8/9`, `c-select-6/13`, `c-spinner-3/5`, `c-stepper-7`, `c-table-6`) and five shadcn examples (checkbox fields, chat messages, skeleton, toast, validated form) were added as **building blocks only**; no existing component or page changed. The shadcn CLI can't install them here (legacy `default` style, Tailwind 3, Radix not Base UI) and would have overwritten the branded button/card/badge/input/select/table, so each primitive was ported by hand keeping the upstream API:

| New in `src/components/ui` | Notes |
|---|---|
| `field.tsx`, `item.tsx`, `empty.tsx`, `input-group.tsx` | shadcn layouts, Tailwind 3 syntax |
| `spinner.tsx`, `progress.tsx` | progress supports `ProgressLabel` / `ProgressValue` header |
| `message.tsx`, `bubble.tsx`, `marker.tsx` | chat bubbles; default bubble uses the brand green |
| `stepper.tsx` | ReUI API without `@base-ui/react`; read-only unless `onValueChange` is passed |
| `frame.tsx` | ReUI tray + panels; `flush` panels for tables |
| `star-rating.tsx` | ReUI Rating (partial stars); editable mode is a keyboard radio group, `name` submits with forms. Existing `Rating`/`ScoreBadge` untouched |
| `phone-input.tsx` | new dependency `react-phone-number-input`; native country select, default UG, `name` submits E.164 |
| `toast.tsx` | `toast.add()` / `toast.close()` on Radix Toast; needs `<Toaster />` mounted |

Examples adapted to SafariNexa content live in `src/components/examples/`, previewed at **`/ui-kit`** (demo mode only, `noindex`, not linked). Forms keep server actions: the pasted react-hook-form/zod/sonner form was rebuilt with Field + InputGroup and native validation — no form libraries added. Wiring these into real pages (phone fields, onboarding stepper, review form, staff tables, chat, loading states) is the next step.

**Verified:** tsc, lint, Jest 312 tests (5 new in `ui/reui-components.test.tsx`); `/ui-kit` renders all 17 sections in a dev build.

---

## 4 November 2026 — phone fields use the new PhoneInput; admin support case page restructured

**Phone fields.** All seven real phone fields now use `ui/phone-input` (country picker, default Uganda, submits E.164 such as `+256772123456` under the same field name, so no server action changed): checkout, multi-business checkout, customer profile, business personal profile (`/business/profile?edit=profile`), business settings (`?edit=profile`), business onboarding contact step, admin profile and admin settings. The demo-only mobile-money preview field in payment method selection was left as a local-format hint on purpose (it is never submitted).
- Saved numbers in other formats (`0772 123 456`, `256…`, spaces/dashes) are normalised to E.164 when the form loads (`toE164`); unreadable values load empty.
- Fixed during verification: in international mode the box always shows `+256`, which satisfied `required` with no number. Required phone inputs now stay invalid until a real number is entered.

**`/admin/support/[id]`** now follows the admin detail pattern used by bookings and verification: `max-w-6xl`, "Back to support", portal `PageHero` with the status badge, a Conversation card (messages + reply) and a 340px side column with Case details (reference, category, portal, opener, opened/updated/closed times, linked booking) and Update case status. Server actions and the close-case confirmation are unchanged.

**Verified:** tsc, lint, Jest 315 tests; production build; rendered every phone page as the demo customer, business and admin (new input present, saved number shown and submitted in E.164) and the support case page as admin.

---

## 4 November 2026 — business portal gets its own support centre

**Bug:** "Contact support" in the business portal (verification page, review menu, user menu) sent business users to the customer `/support` page, which created customer cases inside the customer account layout.

**Fix:**
- New `/business/support` (case list + "Open a new case") and `/business/support/[id]` (conversation + case details), inside the business portal shell. Cases are created with `surface: BUSINESS`, business categories (`BUSINESS_SUPPORT_CATEGORIES`), an optional related booking limited to the active business, and `authorRole: BUSINESS` messages. Admins are notified as before.
- Business links now point there (`?new=1` opens the form); "Support" added to the business sidebar; the user menu's Support link follows the portal.
- Customer `/support` lists only non-business cases; opening a business case at `/support/[id]` redirects to `/business/support/[id]`. Support notifications route by the case's surface.
- Admin case page labels business senders and lists the opener's businesses (cases have no `businessId` column — adding one would need a schema change, so it was left out).

**Verified:** tsc, lint, Jest 316 tests (new routing test in `notification-policy.test.ts`); in a dev build as the demo business user: list, new-case form (categories + 29 bookings offered), case detail, sidebar and verification links, customer list exclusion and redirect; admin case view shows the portal and businesses. Test case removed afterwards.

---

## 4 November 2026 — admin reviews moderation: compact list layout

`/admin/reviews` showed each review as a tall card in a two-column grid, every card titled "Latest reviews" with a label/value grid (Reviewer, Date, Listing, Review) and full-size action buttons — roughly a screen per four reviews. Reviews are now rows in one card:

- Line 1: star rating (`ui/star-rating`, partial stars), status badge, listing title.
- Line 2: reviewer · business · date. Line 3: the review, clamped to two lines (full text on hover). Business reply, if any, on one clamped line.
- Compact Publish / Flag / Hide buttons on the right (Hide keeps its confirmation), with accessible names that include the reviewer.
- Footer inside the card: "Showing X–Y of Z reviews" + pagination. `Pagination` gained optional `summary` and `className` props for footers like this.

Moderation logic, notifications and audit logging are unchanged.

**Verified:** tsc, lint, pagination tests; rendered as the demo admin (9 rows per page, filters work, no old cards).

---

## 18 November 2026 — Figma designs captured from the running app

The hand-built Figma plugins (`design/figma-admin-portal`, `design/figma-business-portal`) redraw each screen in code and drift from the app. Three new plugins rebuild the real screens instead:

- `npm run capture` (in `Prototype`, `scripts/capture/`) opens the running app in Chrome as the demo customer, business and admin, and records every page at full length, plus every tab and every dialog or menu a page can open. New pages are found from `src/app` automatically; `[id]` routes use the first matching link on their list page. It also replays the booking journey (customer requests a stay → business accepts → customer pays with simulated MTN → admin sees the payment), capturing each step.
- The captures are bundled per portal into `design/handoff/<portal>/<portal>-captured.json` (repeated images stored once). Pages are grouped and numbered exactly like the hand-built plugins (`scripts/capture/groups.mjs`; the customer website gets its own groups), with each page's own heading and intro line as its description.
- `design/figma-captured/{admin,business,customer}` are Figma development plugins that load that bundle from GitHub `main` and build the cover & flow map, one page per group (sections `07.1 …`, captions `07.1.2 — …`), and the journeys, in the hand-built plugins' layout, colours and type. Each run replaces the pages it made before and the hand-built plugin's cover and screen pages (matched by name); the hand-built `00 · Design system` page and any other page are kept.
- `src/capture-fresh.test.ts` fails when UI code (`src`, `public`, `tailwind.config.ts`) changed since the last capture.

Capturing creates demo bookings and a demo payment in the local database. `playwright` was added as a dev dependency (it drives the installed Chrome; no browser download).

---

## 19 November 2026 — verification, listing preview, setup guide and review screens

Requested screens for the admin, business and customer portals. Built in the app, so the Figma capture picks them up.

| Portal | Screen | What changed |
|---|---|---|
| Business | **Getting started** `/business/getting-started` (new) | Eight-step setup guide for new businesses: profile, verification, first listing, photos & prices, availability, preview & submit, go live, invite team. Each step works out done / in progress / to do from the business's real records (`src/lib/business-getting-started.ts`) and expands to a short how-to with a link. A progress card (`GettingStartedCard`) shows on the dashboard until every step is done. New sidebar item. |
| Business | **Verification outcomes** `/business/verification` (was a redirect) | The business verification decision (status, dates, reviewer notes, next action) and every listing's latest review outcome with the reviewer's notes, sorted so listings needing action come first. Listings published before reviews existed count as live. The document upload page stays at `/business/settings/verification`. New sidebar item; the dashboard's "Check status" link points here. |
| Business | **Listing preview** `/business/listings/[id]/preview` (new) | The listing laid out the way travellers see it (`components/business/listing-preview.tsx`): gallery, details, rooms, amenities, policies, location and price card, with booking turned off. Previews the draft revision when a published listing has one. A sticky bar shows status, Edit and Submit for approval, plus what's missing before submitting. Linked from the listings menu and the listing review page. |
| Admin | **Listing verification** `/admin/listings/[id]` | Rebuilt as a two-column review screen like business verification: cover photo and submitted content on the left; submission details (business and its verification status, new vs revision, submitter, readable dates), feedback, the decision form (styled checklist) and earlier submissions on the right. "Mark as under review" no longer requires notes. Approve is disabled while the business is unverified. Same form fields and `decideListing` rules. Queue rows gained a thumbnail and status badges. |
| Admin | **Business listings** `/admin/businesses/[id]` + `/admin/businesses/[id]/listings/[listingId]` (new) | Listing rows on the business page show photo, city, price, bookings and status, and open a new listing record page: traveller view or all fields, price/bookings/rating/published stats, review history, and links to the pending submission and public page. |
| Customer | **Write a review** `/reviews/new` | Star rating with labels (shared `ReviewForm`, also used on listing pages), a 20-character minimum with counter, guidelines, and a booking summary card. The server action no longer turns a missing rating into 1 star. |

Capture: new routes grouped in `scripts/capture/groups.mjs`; `run.mjs` now resolves routes with more than one `[param]`.

**Verified:** tsc and the jest suite pass; every screen rendered as the demo business, admin and customer with no browser errors.

### Follow-up, same day — admin sees every photo and document before deciding; design-system pass

**Listing verification (`/admin/listings/[id]`):** reviewers now open everything before the decision.

- **Photos** card: every submitted photo grouped as Cover, Gallery and each room, opened full size in the existing lightbox (arrow keys move between photos). Each tile shows Viewed once opened, with a progress bar.
- **Documents** card: the business's verification documents (latest verification with files) plus a restaurant's menu link. Each opens in an in-page viewer with an "Open in new tab" fallback. `/api/documents/[filename]` accepts `?view=inline` so the file can show in the same-origin frame; access checks are unchanged and the default is still a download.
- **Approval checklist** (`components/admin/listing-evidence-review.tsx`) uses the shared `Checkbox`. "I inspected every photo" stays locked until every photo has been opened; "business evidence reviewed" stays locked until every document has been opened. Server rules in `decideListing` are unchanged (all four checks still required to approve).
- **Listing details** card shows every field; photos are summarised there instead of repeated (`ListingSubmissionContent` gained `hideImages`).
- Demo data: the four approved seed businesses now have three verification documents each (`prisma/seed.ts`), matching their "Trading license and ownership ID verified" notes.

**Design-system pass on the new screens** (against `DESIGN_SYSTEM_PLAN.md` and the 2 Nov consistency rules):

| Screen | Fix |
|---|---|
| Admin business detail | Listing rows overflowed at 390px (truncated titles in a grid column without `min-w-0`); status badges were hidden on phones. Both fixed; slate/white colours in the rows replaced with tokens; rows get a focus ring. |
| Admin listing record | Pill segmented control replaced by shared `Tabs` (quiet inset style); embedded preview no longer renders a second `<h1>`. |
| Listing preview | Hand-made disabled button replaced by `Button`; section headings use `type-section`, matching the public listing pages. |
| Getting started | Expandable steps get the 2px focus ring; cards use `shadow-card` like `Card`; headings use `type-card`. |
| Verification outcomes | `shadow-card`, `type-*` headings; "Full review history" text link is now a ghost button target. |
| Write a review | Booking summary uses `Card` and the `type-eyebrow` role instead of hand-rolled all caps. |

**Verified:** tsc, lint and tests pass; in Chrome as the demo admin, the photo and evidence checks start locked, unlock after all 5 photos and 3 documents are opened, and the form posts all four checks; Escape closes the document viewer. All new screens fit 390px without horizontal scroll.

---

## 20 November 2026 — verification flows captured as journeys, documented per page; background refresh no longer wipes work

**Journeys (Figma "Journeys" pages):** six new journeys in `scripts/capture/journeys.mjs`, each performed for real across the portals with a caption per step that says what the screen shows and the next action:

| Journey | Steps | Covers |
|---|---|---|
| `business-verification` | 21 | Setup guide → upload → admin requests changes → business sees notes, uploads more → admin starts review → approves → guide step done |
| `business-verification-rejected` | 9 | Fraud-hold confirmation from the queue (not confirmed), rejection with reasons, what the business sees |
| `listing-verification` | 24 | Preview as traveller → submit → admin opens every photo (viewer) and document (viewer), checks unlock → under review → changes requested → business sees feedback, edits, resubmits → approve and publish → live on the marketplace |
| `listing-withdraw-reject` | 9 | Submit → withdraw → resubmit → reject → outcome and history |
| `customer-review` | 10 | Completed booking → write a review (validation, then five stars) → on the listing → business replies → admin Hide confirmation |
| `admin-business-listings` | 5 | Businesses → business → listing record (traveller view, all fields) → the approval that published it |

They act on a demo business, Kidepo Ridge Lodge, from the new `scripts/capture/fixtures.mjs`: each journey resets it to its starting state (with real PDF evidence the admin can open) and the run deletes it afterwards, including its uploaded files and the notifications about it. Audit log entries from the run remain.

**Documentation:** new in-app page `/docs/verification` (`content/docs/verification.md`): every page in the business verification, listing approval, admin listing browsing and review flows, each action, who can take it, its rules and what it changes, plus known gaps.

**Bug fix — portal background refresh wiped unsaved work:** `LiveRefresh` (admin, business and customer account pages) calls `router.refresh()` every 60 seconds, which re-rendered the page and cleared typed reviewer notes, other unsaved form fields and the listing review's viewed/ticked state. Found while recording the journeys; reproduced on the existing business verification review as well. The refresh now skips while any field differs from its saved value, or while an element asks it to pause (`data-live-refresh="pause"`, used by a listing review in progress). Listing review progress (opened photos and documents) is also kept per submission in session storage, so a reload keeps it.

**Accessibility:** the cover photo tile was announced as "Open cover photo photo 1"; now "Open cover photo 1".

**Found, not changed:** an approved business that uploads another verification document goes back to Submitted, which hides all its listings from travellers until it is approved again. Documented in `/docs/verification` §6; needs a product decision.

**Capture fix:** the capture's demo sign-in (`scripts/capture/lib.mjs`) moved on before the account-switch request had finished, which cancelled it on a slow dev server; the customer, whose home is the page the switch starts on, then stayed signed out and the booking-loop journey failed at checkout. It now waits for the switch response and checks the session cookie, retrying up to three times.

**Verified:** the six journeys complete; in Chrome, review progress, ticked checks and typed notes survive 70 seconds on the page and progress survives a reload.

### Follow-up, same day — first-time guides are step-by-step modals, not a page

Feedback: the guides for new businesses should be skippable step-by-step modals over the app, not a sidebar tab.

- **Added** `src/components/business/business-guides.tsx`, mounted in the business portal header: a six-step welcome tour on the Overview, and three-step guides on Verification (both pages), Listings, the listing form (new and edit) and Bookings. Each opens by itself the first time a person visits that page; Back / Next, "Skip guide", Done, × and Escape on every step; finished, skipped or closed guides don't reopen (remembered per user in `localStorage`). The header's ? button replays the current page's guide. The welcome tour's last step points to Upload documents (unverified) or Create a listing (verified).
- **Removed** `/business/getting-started`, its sidebar tab, the dashboard "Finish setting up" card and `src/lib/business-getting-started.ts` (`publicListingHref` moved to `src/lib/listing-links.ts`). **Removed** the dashboard's "Welcome to SafariNexa!" pop-up, which reopened on every visit while unverified and would have stacked on the tour; the status banner stays.
- **Bug fixed before release:** moving from the six-step tour to a page with a shorter guide (via the tour's Upload documents link) kept the step number and crashed the page; the step now belongs to the guide on screen.
- **Capture:** screen captures turn auto-opening off (`signIn` in `scripts/capture/lib.mjs`) so pages aren't captured under a modal; each guide is still captured as a dialog from the ? button. New journey `first-time-guides` (13 steps) records the tour and guides as a new business meets them. The `business-verification` journey's first and last steps, which used the removed page, now show the Overview and the listing form.

### Follow-up, same day — Figma captures: dropdowns, checkboxes, menus, Guides data, page headers

Reported from Figma ("06 · Guides" looked incomplete). Capture fixes, no app change:

| Problem in Figma | Cause | Fix |
|---|---|---|
| Dropdowns empty, no arrow | Native `<select>` paints its chosen option and arrow outside the DOM | `scripts/capture/extract.js` draws the selected option text and a chevron |
| Checkboxes missing | Native checkboxes/radios are drawn by the browser | The extractor draws the box (checked: filled with a tick; disabled: faded) |
| Business-switcher menu repeated on every page, cut off at window height, caption "Lodges4 businesses" | The sidebar is a `div[data-sidebar]`, not `<aside>`, so it wasn't treated as shared chrome; menus were captured at window size; labels used `textContent` | Sidebar menus captured once (keyed by place); menus captured at full page length (dialogs stay at window size); labels use `innerText` |
| Guides list empty ("No guides yet") | Business screens are captured as Nile & Crater Lodges, a lodge with no guides | A group can name the business it's captured as (`business` in `groups.mjs`); Guides is captured as Uganda Trails Safaris, the demo account's tour company with 12 guides |
| First-time guides only in the Journeys page | Screen captures turn auto-open off, and the ? button wasn't treated as a dialog trigger | Each page with a guide gets every step captured beside it, opened from the ? button (`--guide-1…n`) |
| The same row menu captured once per row (nine "Listing actions", one "Actions for booking BK-…" per booking) | Every trigger on a page was captured | One capture per kind of menu per page (booking references and numbers ignored when comparing) |
| Page title unreadable on a dark canvas | The plugin drew the page header straight on the canvas | The header is a white card like the cover and journey boards (`design/figma-captured/src/plugin.ts`; plugins rebuilt) |

### Follow-up, same day — feature tips beside the actions to take

Feedback: on top of the general guides, new users need prompts next to the actions they're expected to take.

- **Added** `src/components/business/feature-tips.tsx`: a card beside a specific control (with an arrow, and the control outlined) saying what to do there, on Overview, Listings, Create listing, Listing preview, Submission & feedback, Verification & documents, Verification outcomes, booking detail, Reviews and Guides (§2.1 of `/docs/verification`). One tip at a time, only after the page's guide is closed and while no dialog or menu is open; tips find their control by link target or label and skip ones that aren't on screen or are disabled. "Got it"/× marks a tip seen; "Turn off tips" stops all; the control is scrolled to the middle of the screen if needed. Works at phone width.
- **Changed** the header ? button into a help menu: "[Page] guide · n steps" and "Show tips on this page" (which turns tips back on for that page).
- **Capture:** screen captures turn tips off too, then capture every guide step and every tip of a page from the help menu (`--guide-n`, `--tip-n`). The `first-time-guides` journey (18 steps) now shows tips after a guide, Got it, Turn off tips, and turning them back on from the help menu.

## 20 November 2026 — Customer review entry point

- **My bookings** now links directly to the verified review form for completed and review-pending bookings that the customer has yet to review.

## 20 November 2026 — Figma capture coverage audit

- Added a read-only audit of route, frame, and journey coverage in the Figma bundles. The verification docs record the missing pages, fallback frames, and scenario gaps.

### Follow-up, same day — capture coverage audit: detectable gaps closed

An audit (`node scripts/capture/audit.mjs [--strict]`, added with this change; `routes()` can now include excluded patterns) compared the app's routes with the Figma bundles and found 13 gaps: no frame for `/trip-planner/[id]` or `/business/support/[id]`; not-found frames for `/checkout`, `/payments` and `/payments/receipt`; and eight pages captured without the record or token in the URL that they need. All closed:

- **Screen fixtures** (`setupScreens`/`cleanupScreens` in `scripts/capture/fixtures.mjs`, run around each portal's screen capture): a booking awaiting payment, a paid booking with a successful payment, a completed unreviewed stay, a trip plan with three items, a business support case and a customer support case with replies. Fixed ids; removed after the run.
- **URL scenarios** (`SCREEN_QUERY`): checkout for a stay, payment, receipt and success for those bookings, write-a-review for the completed stay, and a capture token for reset-password and both invitation pages (they check the token on submit).
- `run.mjs` compares landing paths without the query string, so these pages still get their tabs, menus, guides and tips captured.
- The plugin cover no longer claims every page, tab, dialog and menu is captured. `/docs/verification` §7 records what's covered and what remains (states, actions and outcomes need a scenario inventory).

### Follow-up, same day — booking and payment states and outcomes captured

Started the scenario coverage in `/docs/verification` §8 with bookings and payments across the three portals.

- **Status states** (`STATUS_VARIANTS` and `SCREEN_VARIANTS` in `scripts/capture/fixtures.mjs`, captured by `run.mjs` as `--status-*` states of each booking page): awaiting confirmation, payment required, payment failed, confirmed and paid, refund requested, refunded, cancelled by the customer, declined by the business, completed, reviewed — on the customer, business and admin booking pages (30 frames). Each shows the actions that status allows.
- **Outcome journeys** (`journeys.mjs`, on Kidepo Ridge Lodge bookings from `setup.bookingOutcomes`): the business declines a request; the customer cancels before paying; a payment is declined and retried successfully; the business cancels a paid booking, a refund is requested and an admin approves it (ending Refunded); the customer cancels a paid booking and the refund request reaches the business and admin.
- Remaining for bookings and payments: deadline expiry, pending provider confirmation, partial and rejected refunds, payouts, and multi-item orders.

- Capture baseline pages with vertical overflow at the top and after scrolling. Seed the Business Listings table with all four listing types for the capture.

### Follow-up, same day — remaining booking and payment scenarios, and three fixes they exposed

**Fixes:**
- **Business booking page, expired requests.** Accepting a request after its response deadline threw past the page into the generic "We couldn't complete that request" screen. The page now hides Accept once the deadline has passed and explains the request will be cancelled automatically (Decline still releases the dates now). If a response fails for another reason, for example the request expired while the page was open, the reason is shown on the booking (`?error=`).
- **Cancellation reason on booking pages.** Expired bookings showed only "Cancelled by admin". The customer, business and admin booking pages now show the reason and date under the status badge, for example "Payment window expired · 20 Nov 2026" (`src/components/cancellation-note.tsx`).
- **Payments & refunds messages disappeared.** Every payment operation revalidated the page, which remounted the form and wiped its result, so "Check payment with provider" showed nothing and "Send to support" never confirmed the case. `managePayment` now revalidates only when payment records changed (refunds and payment checks). Errors, reminders and escalations keep their message on screen.

**Capture:**
- **Eight more booking states** on all three booking pages (24 frames): payment waiting for the provider, payment window passed (before and after the expiry job), response deadline passed (before and after), partially refunded, refund declined, and a booking that's part of a combined order. Also captured: the payment page after its window passed, a combined order waiting for one business, and the receipt for a combined order.
- **Six journeys**: deadlines pass and the expiry job cancels both bookings; a payment waits for the provider, the business checks it and escalates to support (with the admin case); a partial refund created and approved by the business; a refund request declined by an admin; a combined order across two businesses, accepted then paid once; operations settles payouts and the business sees them in Earnings.
- The expiry step applies the change that `POST /api/jobs/expire-bookings` makes (`expireBooking` in `scripts/capture/fixtures.mjs`), because local runs don't set `CRON_SECRET`. The payout journey settles every eligible demo payment, so the fixture deletes those payouts afterwards and marks the payments unsettled again.
- **Scroll inside the page:** baseline pages also get a frame with the first wide table scrolled sideways (`--table-scrolled`) and the first panel that scrolls on its own scrolled down (`--pane-scrolled`) (`innerScrollSnapshots` in `scripts/capture/lib.mjs`).

### Follow-up, same day — provider failures, failed payouts and the cart-to-checkout order

- **Added** a failed-payout notice (`src/components/failed-payouts-notice.tsx`) to business **Revenue & payouts** and admin **Payments, refunds & payouts**: each `FAILED` payout with its amount, the provider's or bank's reason (`Payout.notes`), reference and date, with Contact support for the business. Before, a failed payout was counted as "On hold" with no explanation anywhere. There is still no live payout provider; payouts only fail when a record says so.
- **Capture:** a "refund sent, waiting for the provider" state on the three booking pages; three journeys:
  - `refund-provider-failure`: a refund on a live MTN payment (not `DEMO-`) is approved, the portal refuses to send it ("This provider needs reconciliation…"), the request stays Requested, and the business escalates to support.
  - `payout-failed`: the failed payout on the business and admin pages.
  - `cart-order`: a tour and a stay from two businesses are added to the cart, checked out once, accepted by each business (the journey switches business), and paid with one payment.
- The cart journey books two seed listings. `setup.cartOrder` saves their availability first; the run deletes the order and its bookings and restores the availability. Kidepo payouts are deleted with the fixture.

