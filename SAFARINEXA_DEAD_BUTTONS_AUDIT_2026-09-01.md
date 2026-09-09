# SafariNexa dead-button audit

**Date:** 1 September 2026
**Scope:** every `<Button>`/`<button>` element across the customer app, business portal, and admin portal — checked for a real `onClick`, a real form submission, or real navigation. Read-only; nothing fixed this round.

## The pattern

Two different things are going on here, and they call for different responses:

1. **A systemic decorative-toolbar pattern** — "Filter", "Export", a date-range picker, and a row-level "⋮" overflow menu appear on nearly every admin and business list page, none of them wired to anything. This is the same pattern the earlier audits already flagged and the user chose to leave as demo placeholders — it's listed below for completeness (14 occurrences) but isn't new information.
2. **Genuinely new dead buttons** that don't fit that pattern — a support-chat button on the safety page, an entire non-persistent trip planner, a disabled password-reset flow, unimplemented message-composer icons on both customer and business messaging, a "Preview listing" button on the listing form, and a few others. These are the ones worth a look.

## New findings (not previously flagged)

| Where | Button | Issue |
|---|---|---|
| `src/app/safety/page.tsx:122` | "Open Support Chat" | No handler at all — the sibling emergency-call buttons above it correctly use `asChild` + `tel:` links, this one doesn't wrap anything. |
| `src/app/trip-planner/[id]/page.tsx` | "Share" (:54), "Save Itinerary" (:55), "Add Item" (:66, per day), "Edit" (:83, per item), "Add Another Day" (:91) | The entire trip-planner builder is client-side `useState` with **no persistence path at all** — every mutating/sharing action is a no-op. Only the back button (`asChild`/`Link`) works. This isn't one dead button, it's a feature that looks finished but doesn't save anything. |
| `src/app/auth/forgot-password/page.tsx:27` | "Send reset link" | Hardcoded `disabled`, and the email input above it is too. The card's own copy admits email delivery isn't connected — so this is an honest disabled state, but worth knowing a customer who forgets their password has no working recovery path today. |
| `src/components/listing-row.tsx:50` | Heart/wishlist icon | Plain `<button>` with zero `onClick` — contrast with `src/components/save-button.tsx`, which does the same job for real (optimistic UI + server action). This component doesn't appear to be imported anywhere currently, so it's latent rather than live, but it would render broken the moment something uses it. |
| `src/components/customer/message-inbox.tsx:366-367` and `src/components/business/message-inbox.tsx:576-578` | Emoji / attachment / image composer icons | Both the customer and business message composers have 2-3 toolbar icons (emoji, paperclip, image) sitting right next to the working Send button, none of them wired — attachments and emoji were never implemented on either side. |
| `src/components/business/listing-form-fields.tsx:42-44` | "Preview listing" | No handler. Shared by both the new-listing and edit-listing forms, so this is dead on every listing create/edit page in the business portal. |
| `src/components/business/verification-documents.tsx:121-123` | Per-document "⋮" menu | Not wrapped in a dropdown, no handler — looks like it should offer delete/replace on an uploaded document. |
| `src/components/business/dashboard-quick-actions.tsx` | "Create promotion", "View calendar", "Download report" | Subtler case: these route through a shared `handleAction` that only ever does something (opens a "verification required" modal) when the business is *unverified*. For an already-verified business — the normal case — `handleAction` returns and does nothing. So these three are dead regardless of verification state, just disguised as gated functionality. (The two other buttons in the same component, "Add new listing" and "Respond to reviews", are correctly wired via real links.) |
| `src/app/business/(portal)/dashboard/page.tsx:82-84` | "View business profile" | No handler, no href. |
| `src/app/business/(portal)/listings/[id]/edit/page.tsx:163-165` | "Actions ▾" | Not wrapped in a dropdown component, no handler. |
| `src/app/business/(portal)/reviews/page.tsx:129-131` region / `verification/page.tsx:129-131` | "Contact support" | No handler, no href. |
| `src/app/admin/(portal)/dashboard/page.tsx:267,294` | "Review" / "View" | These sit in the dashboard's mock-fallback rows — contrast with the real-data branch a few lines up, which correctly wraps the same button in a `Link`. The "Active Support Cases" panel specifically is *always* mock data (never queries `SupportCase`), so its "View" button can never work. |
| `src/app/admin/(portal)/verification/page.tsx:247-255` | Approve / Request more / Flag (mock-fallback cards) | The real-data verification cards were fixed today to use one form + notes textarea + named submit buttons (see the forms-fix session). The mock-fallback cards shown when the queue is empty were not updated — they're static buttons with no form at all. |
| `src/app/business/onboarding/page.tsx:55-59` | "Learn requirements" | Not dead exactly — it's a real `Link`, but the destination `/business/requirements` has no matching route, so it 404s. A broken link rather than an inert button. |

## The known decorative-toolbar pattern (reconfirmed, not new)

Same "Filter" / "Export" / date-range-picker / row "⋮" menu pattern already flagged in earlier audits as intentional-for-demo placeholders:

- Admin: `bookings/page.tsx` (date-range picker :243, "Export report" :248, "Filter" :297, "Export" :302, row menus :376 & :424), `businesses/page.tsx` ("Filter" :102, "Export" :106, row menu :181), `users/page.tsx` ("Filter" :100), `payments/page.tsx` ("Filter" :279, "Export" :283), `verification/page.tsx` ("Bulk Action" :116)
- Admin `settings/page.tsx:46,74` — "Save changes (Coming Soon)" / "Save fees (Coming Soon)", hardcoded disabled, whole page has no real persistence.
- Business: `bookings/page.tsx` ("Export" :114, "Calendar view" :117, "Filters" :248), `listings/page.tsx` ("Filters" :231), `revenue/page.tsx` (date-range picker :84, "Export" :88, 5 filter-tab pills :261-275, "Filters" :279, row menu :401), `reviews/page.tsx` ("Filters" :133, decorative "Reply" button :365 next to the real inline reply form), `settings/page.tsx:253` — "Save preferences (Coming Soon)".

## What's clean

Shared UI primitives (`dialog`, `sheet`, `dropdown-menu`, `pagination`, `table`, `tabs`), all cart/checkout/payment forms, `site-header`/`mobile-nav`/`search-bar`/`search-filters`, the room booking widgets (today's fixes), `booking-chat`/`inquiry-dialog`, `support/page.tsx`'s case-opening dialog, and essentially every admin/business form-submit and navigation button not listed above all resolve to a real handler, a real form action, or real navigation.

## Suggested next step

If you want these fixed, the new-findings table above is the actionable list — most are small (wire a handler, add a `Link`, or honestly disable-and-label like the forgot-password flow already does). The decorative-toolbar pattern is the same one already left in place by design earlier this session; happy to revisit that call if you've changed your mind, but treating it as still-intentional unless told otherwise.
