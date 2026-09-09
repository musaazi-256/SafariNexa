# SafariNexa forms audit

**Date:** 1 September 2026
**Scope:** every form in the codebase (41 files render a `<form>`), cross-checked field-by-field against the server action/route that handles its submit and against the Prisma model it's supposed to persist to or read from.
**Method:** four parallel deep-dive passes, each tracing a cluster of forms from rendered `name` attributes → handler's `formData.get(...)`/prop reads → actual `db.<model>.create/update` calls → `prisma/schema.prisma` column definitions. Read-only; no code changed.

## Executive summary

Most of the app's forms are correctly wired — customer account/profile/support/review forms in particular are clean end-to-end, and the listing create/edit forms (the most complex form in the app, spanning 4 listing types) have no dead fields or phantom reads. But three real bugs stand out, all involving **silent data loss**, not just cosmetic mismatches:

1. **Editing an existing accommodation listing overwrites real room data with hardcoded defaults.** The edit page only passes 8 of `RoomType`'s 14 editable columns into the room editor's initial state; the other 6 (bed type, bedrooms, room features, refundability, refund policy text, discount notice) silently reset to defaults on every save unless a business owner happens to re-type them.
2. **The business onboarding wizard collects four fields it never sends to the server** — registration number, business description, and the contact person's name/role are typed in by every new business, held in React state, and then dropped when the form actually submits. `description` is a real, meaningful `BusinessProfile` column that gets thrown away at the exact moment it's supposed to be captured.
3. **Checkout never records real participant details for a group booking.** `BookingParticipant` is schema-designed for multiple named guests with ID documents, but every checkout path (single and cart) only ever asks for the primary booker's own name/email/phone and inserts exactly one participant row, regardless of party size.

Below that tier, there's a cluster of smaller dead-field/mismatch issues (a `returnTo` field read by closure rather than by name, an unread `confirmPassword`, two divergent implementations of the review-reply form, unread card `expiry`/`cvv` fields, a `city`/`address`/`country` field-mapping hack repeated in two places, a hardcoded admin-invite role, and a few schema columns — `Guide.destinationId`, `SupportMessage.attachmentUrl`, `BusinessProfile.logoUrl`/`coverImageUrl` — that no form anywhere ever sets).

## Data-loss bugs (highest priority)

### 1. Accommodation edit silently resets room fields

`src/app/business/(portal)/listings/[id]/edit/page.tsx:198-209` builds the `RoomTypeEditor`'s `initial` prop with only `id, name, priceMinor, maxOccupancy, totalRooms, breakfastIncluded, description, images`. It omits `bedType`, `bedrooms`, `roomFeatures`, `isRefundable`, `refundPolicyText`, `discountNotice` — so the editor falls back to its own hardcoded defaults for those (`room-type-editor.tsx:29-43`: `bedType: "1 Double Bed"`, `bedrooms: "1"`, `roomFeatures: ""`, `isRefundable: true`, blank refund/discount text). The save transaction (`edit/page.tsx:101-108`) then does `tx.roomType.update({ data: row })` with the **full** parsed row — meaning every edit to an existing room silently overwrites its real persisted bed type, room features, refundability, and refund/discount text with these defaults, unless the business owner happens to re-enter the exact same values. This is real data loss on a routine, expected editing action, not an edge case.

*Fix shape:* pass the full `RoomType` row (all columns) into `RoomTypeEditor`'s `initial` prop, matching what `parseRoomTypeRows` actually persists.

### 2. Onboarding wizard drops 4 of its 8 collected fields

`src/components/business/onboarding-wizard.tsx` collects `businessName, registrationNumber, address, description` in step 1 (lines 182-227) and `contactName, contactRole, contactPhone, contactEmail` in step 2 (lines 234-281) — 8 fields into React state. But `handleSubmit` (lines 58-81) only appends `businessName`, `contactEmail`, `contactPhone`, and `city` (=`address`) to the `FormData` actually sent to `submitBusinessOnboarding`. **`registrationNumber`, `description`, `contactName`, and `contactRole` are captured, shown to the user as "saved," and then silently discarded** — `description` is a real `BusinessProfile` column (`schema.prisma:273`) that's simply never set at signup (it later gets set for the first time in Settings, so the business owner ends up typing it twice, the first time for nothing).

Separately, `registrationNumber`, `contactName`, and `contactRole` have **no backing column at all** on `BusinessProfile` — even if the wizard were fixed to send them, the schema would need a migration first.

*Fix shape:* either add the missing columns and wire the send, or (cheaper) stop asking for fields the product doesn't store yet — collecting information a form immediately discards is worse than not asking.

### 3. Checkout only ever records one participant, regardless of party size

`src/app/checkout/page.tsx` and `src/components/checkout/multi-checkout-form.tsx` both collect only `fullName`, `email`, `phone` for the person completing checkout. `src/lib/booking-service.ts:196-203` always inserts exactly **one** `BookingParticipant` row with `isPrimary: true`, no matter what `participantsCount` is. The schema's `BookingParticipant.documentType`/`documentNumber` columns (`schema.prisma:675-676`) have **zero UI coverage anywhere in the codebase** (confirmed by repo-wide grep). A family of 4 booking a room produces a booking record naming only the person who paid.

*Fix shape:* this is the most schema-work-heavy of the three — either add a repeatable per-guest name/document block to checkout (mirroring the room-type/add-on repeatable-row pattern already used elsewhere in the codebase), or consciously decide `BookingParticipant` is single-booker-only for now and consider trimming the unused document columns.

## Field-mapping and schema mismatches

| Where | Issue | Evidence |
|---|---|---|
| Business onboarding **and** Business Settings | Both forms label a field "Physical Address" but write it into `BusinessProfile.city` — there is no `address` column on the model, and `country` (defaults to "Uganda") can never be edited by anyone, anywhere. Settings' `updateBusinessProfile` even has a code comment admitting it: *"To support city/country from a single address field, we'll store it in city for now."* | `src/lib/actions/business-settings.ts:13-17,24-34`, `src/components/business/onboarding-wizard.tsx:65` |
| Business onboarding | `type` is hardcoded to `"GENERAL"` server-side (`src/lib/actions/onboarding.ts:19`) — never asked in the wizard, even though the model clearly expects a real business type. | `onboarding.ts:19` |
| Admin invite-admin | The invite form only collects an email; `inviteAdmin` hardcodes every invited admin to the "Super Admin" role (`admin.ts:86-89,117`) regardless of the `Role`/`Permission` model's actual flexibility — there is no role selector anywhere. | `src/app/admin/(portal)/users/new/page.tsx:64`, `src/lib/actions/admin.ts:77-139` |
| Search bar | The transport "Duration" select (hour counts `"2"/"4"/"6"/"8"`) and the tours-facet "Duration" checkboxes (day ranges `"1-3"/"4-7"/"8+"`) both write to the **same** `duration` query-string key, which `search/page.tsx:236-244` filters via a substring match against listing title/description — a format neither value realistically matches, so the filter is close to a no-op for both, and the shared key risks a stale value leaking across a category switch. | `src/components/search-bar.tsx:296-301`, `src/components/search-filters.tsx:49-52,140`, `src/app/search/page.tsx:236-244` |
| Payment method form | `expiry` and `cvv` inputs are rendered and validated client-side but `processPaymentAction` never reads either (`payments/actions.ts` has no `formData.get("expiry"\|"cvv")`) — harmless from a security standpoint (nothing is ever stored), but the "processing payment" UX is validating fields that do nothing server-side. | `src/components/payments/payment-method-form.tsx:122-145`, `src/app/payments/actions.ts:10-19` |

## Dead fields and orphaned/duplicated forms

- **`src/components/auth-card.tsx:94`** renders a hidden `returnTo` input, but `credentialsAction` never reads it via `formData.get("returnTo")` — it works only because the redirect target is closed over from outer scope. The input itself does nothing; low-severity but misleading to read.
- **`src/components/forms/change-password-form.tsx`** sends `confirmPassword`, but the server handler (`src/app/profile/page.tsx:59-78`) only reads `currentPassword`/`newPassword` — the confirmation check is client-side only. A crafted request could submit a mismatched-and-unconfirmed password change; low real-world risk but worth a server-side re-check.
- **`src/components/reviews/review-reply-form.tsx`** is dead code — nothing imports it (repo-wide grep confirms). The actual business review-reply UI is a second, hand-written inline `<form>` in `src/app/business/(portal)/reviews/page.tsx:331-347` with its own handler. Two implementations of the same feature now exist and can drift; the same page also has a decorative "Reply" button (lines 365-367) with no handler, though it's inert rather than broken since the real form is shown whenever one is needed.
- **`src/app/business/(portal)/verification/page.tsx`** only renders the URL-paste fallback form for document submission; the real action (`submitVerificationDocument`) also supports a genuine file upload, but no `<input type="file">` exists anywhere in the page — explicitly labeled a fallback, so likely by design, but it means there is currently no primary file-upload UX for verification documents, only paste-a-URL.

## Schema columns no form anywhere ever sets

- `Guide.destinationId` and `Guide.availabilityNote` — `guides/new/page.tsx` has no fields for either, and there is no guide-edit page at all, so neither can ever be set or corrected through the UI once a guide exists.
- `SupportMessage.attachmentUrl` — no form, customer or admin side, ever populates it.
- `BusinessProfile.logoUrl` / `coverImageUrl` — zero code in `src/app/business` or `src/components/business` ever sets these (confirmed by grep); no onboarding step or settings page offers a logo/cover upload.
- `BusinessVerification.reviewNotes` — confirmed still hardcoded to the literal string `"Processed via admin portal"` in `src/app/admin/(portal)/verification/page.tsx:60`; no textarea exists for a reviewer to write a real note. (Reconfirms the finding from the 31 August report — unchanged since.)

## Worth flagging, not a form-field bug

- **`src/components/ui/image-uploader.tsx`** (the shared uploader behind listing cover photos, gallery images, and room images) never uploads anywhere — `handleFileChange` reads the file client-side via `FileReader.readAsDataURL` and stores the raw base64 `data:` URI directly as the field's value, which then gets persisted straight into Postgres (`Listing.coverImageUrl/images`, `RoomType.images`). Every photo submitted through any listing form is stored as an inline base64 blob in the database rather than uploaded to storage with a hosted URL. Not a field-mismatch bug — the data does reach the right columns — but a storage/scalability design smell worth fixing before this handles real photo volumes.

## What's clean (verified, no action needed)

Auth/account: create-account, Google-link, edit-profile, preferences, support-case, support-reply (both sides), review submission, notifications mark-read/mark-all-read.
Checkout/payments: multi-checkout has no drift from single-checkout (same participant-count gap, but consistent rather than diverging); booking-chat and inquiry-dialog message content fields are clean.
Business: listing create/edit base + all 4 type-specific forms (the `destinationId` gap from the 16 August audit is now fixed and fully wired); add-on editor; business booking confirm/decline; business verification document submission (aside from the missing file-input UI above).
Admin: refund approval/payout processing, review moderation, support reply, admin's own profile form, the `toggleAdminUserStatus` action fixed on 31 August (still verified clean/secure).

## Recommended priority order

1. Fix the accommodation room-edit data-loss bug (#1) — this corrupts real business data on a routine action, today, for anyone editing an existing room.
2. Decide what to do with the onboarding wizard's discarded fields (#2) — either wire `description` through (cheap, the column exists) or stop collecting fields with nowhere to go.
3. Decide the scope of `BookingParticipant` (#3) — either build the real multi-guest UI or trim the unused schema columns so the model stops implying a capability that doesn't exist.
4. Give `BusinessProfile` a real `address`/`country` story instead of the `city` overload used in two separate forms.
5. Everything else in this report is low-severity and can be batched into general form cleanup whenever convenient.
