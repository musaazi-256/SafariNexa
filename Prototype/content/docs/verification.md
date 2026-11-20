# Verification & review flows

How a business gets verified, how each listing is approved before it goes live, and how customers rate and review a stay. For each flow: the pages involved, every action on each page, who can take it, what it changes, and what the other side sees.

Each flow is also a captured journey in Figma (the **Journeys** page of each portal's file), recorded from the running app by `scripts/capture/journeys.mjs`. The journey id is given under each flow heading. The journeys act on a demo business, **Kidepo Ridge Lodge** (`scripts/capture/fixtures.mjs`): each journey creates it in the state it starts from, and the run deletes it afterwards.

Last updated: 20 November 2026.

---

## 1. Statuses at a glance

### Business verification (`BusinessProfile.verificationStatus`, mirrored on the latest `BusinessVerification`)

| Status | Meaning | Business can submit listings? | Listings visible to travellers? |
|---|---|---|---|
| Not started | No documents submitted yet | No | No |
| Submitted | Documents sent, waiting for an admin | No | No |
| Under review | An admin has started checking | No | No |
| Needs changes | The admin asked for more; notes say what | No | No |
| Approved | Verified | **Yes** | **Yes** (published listings) |
| Rejected | Not approved; notes say why | No | No |
| Suspended | Fraud hold placed from the admin queue | No | No |

Travellers only see a listing when it is Published **and** its business is Approved (every public list, search and detail page checks both).

### Listing submissions (`ListingSubmission.status`)

| Status | Meaning | Set by |
|---|---|---|
| Not submitted | No submission yet (shown when a listing has none) | — |
| Submitted | Waiting in the admin queue | Business: Submit |
| Under review | An admin has started checking | Admin: Mark as under review |
| Needs changes | Admin asked for changes, with reasons | Admin: Request changes |
| Approved | Approved; the submitted copy is published | Admin: Approve and publish |
| Rejected | Not approved, with reasons | Admin: Reject |
| Withdrawn | The business pulled it back before a decision | Business: Withdraw to make changes |

A listing has at most one Submitted or Under review submission at a time. Earlier submissions stay as history with their decision and notes.

### Reviews (`Review.status`)

Published (default, visible on the listing and counted in its rating), Flagged, Hidden (removed from the listing and rating), Pending.

---

## 2. Flow: business verification

Journeys: `business-verification` (changes requested, resubmitted, approved) and `business-verification-rejected` (fraud-hold dialog, rejection).

```
Business uploads documents ─► Submitted ─► (admin) Under review ─► Approved
                                   │                 │
                                   │                 ├─► Needs changes ─► business uploads more ─► Submitted …
                                   │                 └─► Rejected ─► business uploads new documents ─► new submission
                                   └─► (admin, from queue) Suspended (fraud hold)
```

### 2.1 Business · First-time guides (all business portal pages)
New businesses are guided by step-by-step modals, not a separate page (`src/components/business/business-guides.tsx`). Journey: `first-time-guides`.

| Guide | Opens on | Steps |
|---|---|---|
| Welcome tour | Overview (`/business/dashboard`) | 6: welcome; get verified first; create listings and submit them; respond to booking requests; messages, reviews and payments; you're ready (Upload documents if unverified, Create a listing if verified) |
| Verification guide | `/business/verification`, `/business/settings/verification` | 3: what to upload; what happens next (Needs changes); track every decision |
| Listings guide | `/business/listings` | 3: statuses and row menu; create a listing; get it approved |
| Listing form guide | `/business/listings/new`, `/business/listings/[id]/edit` | 3: the basics; photos and prices; save, preview, submit |
| Bookings guide | `/business/bookings` | 3: booking requests; accept or decline; after payment |

| Action | Result |
|---|---|
| (first visit to the page) | The page's guide opens by itself at step 1 |
| Next / Back | Moves between steps; dots and "Step n of N" show progress |
| Skip guide, Done, ×, Escape | Closes the guide and marks it seen: it won't open by itself again |
| A step's action link (e.g. Upload documents) | Marks the guide seen and opens that page (whose own guide then opens, if unseen) |
| Help menu (? in the header) → *[Page] guide · n steps* | Replays the current page's guide from step 1 |

**Feature tips** (`src/components/business/feature-tips.tsx`): after a page's guide is closed, small cards appear one at a time beside the control a new user should use next, with that control outlined.

| Page | Tips, in order (each shown only when its control is on screen and enabled) |
|---|---|
| Overview | Verification status (unverified only) · Add a listing |
| Listings | Create listing · the row's Listing actions menu |
| Create listing | Choose the listing type · Create draft listing |
| Listing preview | Submit for approval |
| Submission & feedback | Submit listing and photos for approval · Withdraw to make changes |
| Verification & documents | 1. Document type · 2. File · 3. Submit for review |
| Verification outcomes | Upload/Update documents · Edit and resubmit |
| Booking (detail) | Accept request · Decline booking |
| Reviews | The reply box |
| Guides | Add guide |

| Action on a tip | Result |
|---|---|
| Got it, or × | That tip is marked seen; the next one on the page appears |
| Turn off tips | No tips on any page until turned back on |
| Help menu (? in the header) → Show tips on this page | Turns tips back on and replays this page's tips from the first |
| Help menu → *[Page] guide · n steps* | Replays the page's step-by-step guide |

"Seen" is remembered per person in the browser (`localStorage`), so a new browser or device shows the guides again. While a guide or tip is open, the portal's background refresh pauses. The earlier dashboard pop-up "Welcome to SafariNexa!", which opened on every visit while unverified, was replaced by the welcome tour; the dashboard's status banner remains.

### 2.2 Business · Verification outcomes — `/business/verification`
One place for every review decision: the business verification (status, dates, document count, the reviewer's notes) and each listing's latest review outcome with its feedback, plus counts of approved / awaiting review / needing action. Listings are sorted so the ones needing action come first.

| Action | Who | Result |
|---|---|---|
| Upload documents / Update documents | Any member (upload itself is owner/manager) | Opens Verification & documents |
| Per listing: Edit and resubmit, Preview, View live listing, Review history | Any member | Opens the listing editor, preview, public page or Submission & feedback |

### 2.3 Business · Verification & documents — `/business/settings/verification`
Status badge with status-specific copy and the reviewer's notes, the review timeline, documents on file, and Add a document.

| Action | Who | Rules | Result |
|---|---|---|---|
| Add a document → Submit for review | Owner or manager | Type required; PDF, JPEG or PNG, 1 byte to 5 MB, checked by content not extension | The file is stored privately. If a submission is Submitted, Under review or Needs changes, the document is added to it; otherwise a new submission starts. Either way the business becomes **Submitted**, the current profile is saved with the submission, and admins with the businesses permission are notified. |
| Delete a document | Owner or manager | Not allowed once the submission is Under review or Approved | The document is removed from the submission |

> **Note:** adding a document always moves the business back to Submitted, **including an already-approved business**. Until an admin approves it again its listings are hidden from travellers. The page says "Submitting moves your business back into review" but not that listings go offline.

### 2.4 Admin · Verification queue — `/admin/verification`
Submissions filtered by stage (Submitted by default, also All, Under review, Needs changes, Approved, Rejected, Suspended), each with the business, its documents, a notes box and quick actions.

| Action | Who | Result |
|---|---|---|
| Open the business name / Review submitted profile and documents | Any admin | Opens the verification review |
| Approve | Admins with `businesses.manage` | Business → Approved (notes optional here; "No notes provided by reviewer." is used when empty) |
| Request more | Same | Business → Needs changes |
| Flag → confirm "Place fraud hold" | Same | Business → **Suspended**; its listings leave the marketplace. A confirmation dialog shows the notes being sent. |
| View a document | Any admin | Opens the file in a new tab |

### 2.5 Admin · Verification review — `/admin/verification/[id]`
The business information as it was when submitted (or the current profile, labelled as such, for older submissions), every supporting document, submission details and the decision form.

| Action | Who | Rules | Result |
|---|---|---|---|
| Approve business | `businesses.manage` | Notes required (1–5,000 characters). Only the latest submission can be decided. Refused if the business profile changed after it submitted. | Approved |
| Start review | Same | Notes required | Under review |
| Request changes | Same | Notes required | Needs changes |
| Reject submission → confirm | Same | Notes required; the dialog shows them | Rejected |
| View document | Any admin | — | Opens the file |
| View business profile | Any admin | — | Opens the business record |

**Every decision:** updates the submission (status, notes, reviewer, time) and the business status in one transaction, and notifies the business **owners** ("Business verification: …" with the notes). Approval lets the business submit listings and receive payouts.

---

## 3. Flow: listing approval

Journeys: `listing-verification` (preview, submit, evidence review, under review, changes, resubmit, approval, live) and `listing-withdraw-reject` (withdraw, resubmit, rejection).

```
Draft ─► (business) Submit ─► Submitted ─► (admin) Under review ─► Approve and publish ─► Published
             ▲                   │                 │
             │                   │                 ├─► Needs changes ─► business edits ─► Submit again
             │                   │                 └─► Rejected ─► business fixes ─► Submit again
             └── Withdrawn ◄─────┘ (business: Withdraw to make changes)
```

A **published** listing is changed the same way: the business saves a draft revision, submits it, and the live listing keeps showing the old content until the revision is approved.

### 3.1 Business · Listings — `/business/listings`
Each listing with its publication status and latest submission status. The row menu has Preview as traveller, Edit, and Submission & feedback.

### 3.2 Business · Listing preview — `/business/listings/[id]/preview`
The listing exactly as travellers will see it (photos, rooms, amenities, policies, location, price) with booking turned off. For a published listing with a saved revision, the revision is previewed. A bar on top shows the status badges and, when submission isn't possible yet, a "Before you can submit" list.

| Action | Who | Rules | Result |
|---|---|---|---|
| Edit | Owner or manager | — | Opens the editor |
| Submit for approval | Owner or manager | Business must be Approved; listing must pass the submission checks (title; description of 30+ characters; city and address; cover photo; price above zero; at least one room type for stays); no submission already pending | A submission is created with a copy of the listing; admins are notified; opens Submission & feedback |
| Awaiting review | — | Shown instead while a submission is pending | Opens Submission & feedback |

### 3.3 Business · Submission & feedback — `/business/listings/[id]/review`
The current status, the admin's reasons, every earlier submission, and the next action.

| Action | Who | Rules | Result |
|---|---|---|---|
| Submit listing and photos for approval | Owner or manager | Same as 3.2. Shown when there is no pending submission (draft, or published with a saved revision) | New submission, Submitted |
| Withdraw to make changes | Owner or manager | Only while Submitted or Under review | Submission → Withdrawn; it leaves the admin queue |
| Preview as travellers will see it | Any member | — | Opens the preview |

### 3.4 Admin · Listing reviews — `/admin/listings`
Submissions by stage (Submitted by default; also Under review, Approved, Needs changes, Rejected, Withdrawn), each with its cover photo, business, submission status and, when the business isn't verified, its verification status.

### 3.5 Admin · Review listing — `/admin/listings/[id]`
Everything submitted, in the order a reviewer checks it:

1. **Photos**: every photo of the submitted copy in one grid (cover, gallery, then each room). Each opens full size in a viewer with arrows through all photos; opened photos are marked Viewed, with progress.
2. **Documents**: the business's verification documents (registration, licences, ID, …) from its latest verification with documents, plus a restaurant's menu link. Files open inside the page (Open in new tab is also offered); opened documents are marked Opened.
3. **Listing details**: every submitted field (photos are listed as counts, since they're shown above).
4. **Decision panel**: submission details, a warning when the business isn't verified, the business's feedback history, the approval checklist and the decision buttons.

Review progress is kept for the browser tab, so a reload doesn't lose it, and the portal's background refresh pauses while a review is in progress.

| Action | Who | Rules | Result |
|---|---|---|---|
| Open a photo / arrows in the viewer | Any admin | — | Marks the photo Viewed |
| View a document / Open a link | Any admin | — | Marks it Opened |
| Approval checklist: photos | `businesses.manage` | Locked until every photo has been opened ("Open the N remaining photos first") | — |
| Approval checklist: accuracy, pricing | Same | — | — |
| Approval checklist: policies & evidence | Same | Locked until every document has been opened | — |
| Mark as under review | Same | Only while Submitted; notes not needed | Under review ("Review started.") |
| Request changes | Same | Reasons required (1–5,000 characters) | Needs changes |
| Approve and publish → confirm | Same | Reasons required; all four checks ticked (enforced on the server too); business Approved; listing content unchanged since submission; submitted copy passes the submission checks | The listing is Published from the submitted copy (a revision is applied to the live listing). The button is disabled while the business isn't verified. |
| Reject → confirm | Same | Reasons required; the dialog shows them | Rejected; the listing is not published |
| View listing record | Any admin | — | Opens the listing under its business (§4.2) |

**Every decision:** notifies the business's owners and managers ("Listing: …" with the reasons) and is written to the audit trail with the checks that were ticked. If the listing was edited after it was submitted, the decision is refused: the business must withdraw and resubmit.

---

## 4. Flow: an admin looks through a business's listings

Journey: `admin-business-listings`.

### 4.1 Admin · Business — `/admin/businesses/[id]`
Profile, verification, team, and **Listings**: each row shows the cover photo, title, type, city, base price, booking count, publication status and the latest submission status, and opens the listing record.

### 4.2 Admin · Listing record — `/admin/businesses/[id]/listings/[listingId]`
Read-only. Stats (base price and room types, confirmed bookings and their value, rating and review count, published and last-updated dates), the listing content in two tabs, and its review history.

| Action | Who | Result |
|---|---|---|
| As travellers see it / All fields tabs | Any admin | Switch between the traveller view and every saved field |
| Review pending submission | Any admin (shown when one is pending) | Opens the review (§3.5) |
| Open public page | Any admin (shown when published) | Opens the live listing in a new tab |
| A review history entry | Any admin | Opens that submission's review page |
| Back to the business | Any admin | Returns to §4.1 |

---

## 5. Flow: customer rating and review

Journey: `customer-review`.

```
Booking Completed ─► Write a review ─► Published on the listing ─► business replies
                                                 └─► admin can Flag or Hide (and publish again)
```

### 5.1 Customer · My booking — `/bookings/[id]`
**Write a review** appears when the booking is Completed (or Review pending), belongs to the signed-in customer and has no review yet.

### 5.2 Customer · Write a review — `/reviews/new?bookingId=…`
The stay summary (listing, dates, guests), a 1–5 star rating, an optional title (up to 120 characters), the review (20 to 2,000 characters, with a counter) and posting guidelines.

| Action | Rules | Result |
|---|---|---|
| Submit review | Rating must be a whole number 1–5; review at least 20 characters; only for the customer's own eligible booking, once | The review is **published straight away** under the customer's account name; the booking becomes Reviewed; opens the booking |
| Submit with something missing | — | The form says what's missing and keeps what was typed; nothing is sent |

### 5.3 Business · Reviews — `/business/reviews`
Reviews of the business's listings with rating, text and booking.

| Action | Who | Result |
|---|---|---|
| Post reply | Any member of the business | The reply is saved and shown under the review, including on the public listing |

### 5.4 Admin · Reviews — `/admin/reviews`
All reviews by moderation status.

| Action | Who | Result |
|---|---|---|
| Publish / Flag | Admins with `reviews.moderate` | Status changes; the author and the business owners are notified ("Review Moderated") |
| Hide → confirm | Same | The review leaves the listing and its rating until published again |

---

## 6. Known gaps

- **Re-verification hides listings.** Uploading a document as an Approved business sets it back to Submitted, which hides all its listings until re-approved (§2.3).
- **No reminder or deadline** for admins on waiting submissions; the queue is sorted newest first.
- **Notifications are in-app only.** Business owners (verification) and owners/managers (listings) get in-app notifications; email isn't sent for these decisions.
- **Demo documents.** Seeded demo businesses have placeholder documents that open a "Document unavailable" page; real uploads (and the journey's Kidepo documents) display.
- **Review edits.** Customers can't edit or delete a review once posted; moderation is the only way to remove it.

## 7. Figma capture coverage audit · 20 November 2026

Run `node scripts/capture/audit.mjs` from `Prototype` to compare the app's page inventory, capture indexes, and plugin bundles. Add `--strict` to fail on a detected gap. The audit reads existing files and does not open a browser or change demo records. The UI fingerprint checks freshness of source files. Coverage of states and actions requires explicit scenarios.

| Surface | Indexed page patterns | Page and state frames | Journeys shown in plugin |
|---|---:|---:|---:|
| Customer | 42 of 43 | 55 | 3 |
| Business | 29 of 30 | 92 | 7 |
| Admin | 25 of 25 | 47 | 7 |

These counts describe the checked-in bundles, generated on 20 November 2026. The same journey can appear in several plugins. There are eight distinct journeys with 114 steps, including 105 UI frames and nine system steps described in text. The captured branches are stay booking and simulated payment success, first-time business guides, business verification approval and rejection, listing approval and withdrawal/rejection, customer review and business reply with the admin hide confirmation open, and admin inspection of a business listing.

### Coverage gaps and fixture progress

| Screen or feature | Baseline or newer fixture capture | Additional coverage needed |
|---|---|---|
| Trip planner | List and itinerary detail with three items (capture fixture) | Add/reorder/remove items, delete and failure states |
| Business support | Queue, open-case dialog, and case detail with a two-message conversation (capture fixture) | Reply, status transitions, empty queue, and access denied |
| Checkout and payments | Checkout for a stay, Complete payment for a booking awaiting payment, and the receipt for a paid booking; Payment success passes through to that receipt. The stay journey covers a successful single-item path. | Cart-to-checkout cases, failed, cancelled, retry, refund, and payout outcomes |
| Cart | Empty cart | Populated cart, multi-item combinations, quantity or add-on changes where supported, and invalid or unavailable items |
| Customer review | Write a review for a completed, unreviewed stay. The review journey covers validation, writing, submitting, business reply, and opening the admin hide confirmation. | Entry from My bookings and from each listing type, already reviewed, ineligible booking, completed moderation, and republication |
| Authentication and invitations | Basic account pages; the reset-password and both invitation forms with a token in the URL (the pages check the token only on submit) | Valid, expired, and invalid links, wrong account, accepted invitations, and password reset completion |
| Business team and saved items | Team and saved-item aliases land on settings and profile saved items | Record aliases as redirects while capturing their destination states under the canonical route |
| Booking, verification, listing, and moderation queues | One example record per dynamic route and selected overlay frames | Separate empty and populated fixtures, zero matching filters, each status that changes available actions, role permissions, and confirm/cancel/result states |
| Shared states | A desktop snapshot after the page settles | Mobile, tablet, loading, recoverable error, permission variants, and long or scrollable sections |

The runner resolves dynamic routes from links in one demo account per portal. It opens visible ARIA tabs and first-level menus and dialogs, with caps of 10 tabs and 12 overlays per page. Similar row menus and shared header/sidebar controls are deduplicated. That approach cannot establish coverage of differing row actions, menu items that open a second dialog, non-ARIA controls, disabled controls, form submissions, or data and permission variants. The route scan explicitly excludes 12 page patterns for OAuth, demo tools, docs, and the UI kit. Shared loading, error, and not-found files are outside the page scan.

The Figma plugins fetch the committed bundles from GitHub main. They render static editable frames, with journey previews clipped to the captured desktop viewport. The plugin can omit content below the viewport or unsupported SVG elements even when the route has a frame. A route, state, or journey only appears in Figma if its frame is in the published bundle.

### Capture runner changes on 20 November 2026

The runner addresses the original route-context gaps by creating records the affected pages need (`setupScreens` in `scripts/capture/fixtures.mjs`: a booking awaiting payment, a paid booking with its payment, a completed unreviewed stay, a trip plan with items, a business and a customer support case with replies), passes the URL each page expects (`SCREEN_QUERY`), and removes the records afterwards. The two remaining redirects (`/saved`, `/business/team`) are aliases by design. The checked-in bundles still predate those changes. The strict audit reports 17 findings against the bundles and current indexes, including four indexed frames absent from the bundles.

### Coverage required for a complete handoff

Maintain a scenario inventory with a stable ID, actor and permission, fixture, start route, action, expected result, viewport, and frame IDs. Give each route its applicable empty, populated, loading, failure, and access states. For each available action, record the state before it, any nested menu or confirmation, validation, the outcome, and the next action. Cover equivalent inputs with representative cases and treat distinct UI outcomes as separate cases. Exercise cross-portal flows on isolated fixtures so results are reproducible.

Expand first through account and invitation flows, each bookable listing type, single and multi-item checkout, the booking/payment/refund lifecycle, business onboarding and verification, listing and availability management, staff and admin role management, messaging and support, review moderation, notifications, and trip planning. Then make missing required frames, mismatched landings, skipped steps, and stale fallbacks fail publication. Compare scenario results against the actual bundles the plugin reads and mark intentional exclusions by name.

### Live Figma file check · 20 November 2026

- [New customer SafariNexa](https://www.figma.com/design/tWZEUdZ2nYqvhDRrENS8x3) is the customer target documented by the capture plugin. It contains only an empty Page 1. Customer frames in the repository bundle do not establish coverage in this file.
- [Business Support](https://www.figma.com/design/BCRiYfkzt8djvVAXAvPj1h?node-id=44-214120) lists both support routes in its header but contains two frames, the support queue and the new-case dialog. There is no case detail or reply frame on that page.
- [Business Bookings](https://www.figma.com/design/BCRiYfkzt8djvVAXAvPj1h?node-id=44-196998) contains 11 frames. They include one status menu, one row-action menu, three guide steps, one booking detail, and one calendar. There are no separate frames on that page for empty or filtered results, alternative booking statuses, or action outcomes.
- [Business Journeys](https://www.figma.com/design/BCRiYfkzt8djvVAXAvPj1h?node-id=44-214531) contains seven boards. The booking board follows one successful stay and simulated payment. The review board ends at the admin hide confirmation.
- The [Admin portal](https://www.figma.com/design/OBOzr94yZV2n0egJ3jx3IY) has no Journeys page in its live page inventory, despite the admin bundle containing seven journeys. Its existing [review moderation page](https://www.figma.com/design/OBOzr94yZV2n0egJ3jx3IY?node-id=148-17299) has All, Flagged, empty, and hide-confirmation frames. Its [payments page](https://www.figma.com/design/OBOzr94yZV2n0egJ3jx3IY?node-id=148-11609) includes demo, simulated payout, live, and empty views. Retain those variants in the scenario inventory when replacing legacy pages with plugin-generated captures.
- The separate [Customer App design](https://www.figma.com/design/NNar1EsoBEKuH93WLUV5HF/Customer-App) contains seven pages, including responsive screens at 390, 768, and 1440 widths and a demo journeys page. It is a reference for variants to preserve when populating the documented customer target.

## 8. Route-by-route Figma coverage checklist

This is the inventory of cases to verify or add. A row can contain both an existing frame and additional capture requirements. Mark a case covered only after locating the frame or journey step and checking that it shows the stated outcome. Record the fixture, role, viewport, and frame ID alongside each verified case. The live file observations in §7 are a separate snapshot. New captures in a working tree become visible in Figma only after bundling, publishing, and importing them.

### Checks that apply across routes

- **Lists and queues.** Capture the populated baseline, genuinely empty data, zero matches, reset to results, first and later pages, sort and column controls, and each row status that changes the available actions.
- **Details and forms.** Capture a valid record or default form, edited values, required and invalid fields, submission in progress where visible, success, recoverable error, stale or missing record, and unauthorized access where implemented. Include nested dialogs, back and cancel paths, and confirm and dismiss outcomes.
- **Layout and shell.** Record 390px, 768px, and 1440px layouts where materially different, including mobile menus, account and business switchers, collapsed sidebar, long content, and overflowing tables. Show focus, selected and disabled controls, and toast or inline feedback where the app renders them. Include long pages or scrolled frames when an action falls below a journey thumbnail.
- **Actors and data.** Exercise visitors, signed-in customers, business staff with different grants or workspaces, and admins with and without the relevant permission. Use separate fixtures for UI-changing statuses and controller outcomes. Use demo records and mock external providers where supported.

### Customer · 43 route patterns

| Route | States and actions to verify in Figma |
|---|---|
| `/` | Signed-out and signed-in shell, search entry and suggestions, category and destination navigation, featured results and links. |
| `/explore` | Populated discovery, category and filter changes, search entry, listing navigation, no matches. |
| `/search` | Keyword and category searches, applied and reset filters, no matches, pagination, quick-view open and close, listing selection. |
| `/destinations` | Destination list and detail navigation, empty data where supported. |
| `/destinations/[slug]` | Destination with listings, sparse destination, listing quick view and navigation, invalid slug. |
| `/accommodation` | Stay results, filters and no matches, listing selection. |
| `/accommodation/[id]` | Photo and room details, room and date selection, unavailable dates, guest count, add-ons, cart and checkout, save, inquiry, reviews and eligible review entry. |
| `/tours` | Tour results, filters and no matches, listing selection. |
| `/tours/[id]` | Gallery, itinerary, inclusions and guide, date and party size, availability, cart and checkout, save, inquiry, reviews and eligible review entry. |
| `/restaurants` | Restaurant results, filters and no matches, listing selection. |
| `/restaurants/[id]` | Gallery and restaurant details, date, time and party size, reservation and checkout, save, inquiry, reviews and eligible review entry. |
| `/transport` | Transport results, filters and no matches, listing selection. |
| `/transport/[id]` | Gallery and vehicle details, booking inputs, availability and checkout, save, inquiry, reviews and eligible review entry. |
| `/guides` | Guide results, no results, guide and tour navigation. |
| `/guides/[id]` | Guide details and linked published tours, tour selection, sparse or unavailable record. |
| `/auth/sign-in` | Valid credentials, invalid credentials, Google handoff, password reset and registration links, return to protected destination. |
| `/auth/create-account` | Empty, invalid and valid form, duplicate account, submission, verification handoff. |
| `/auth/verify` | Check-email instructions, resend where available, valid, expired and invalid verification link outcomes. |
| `/auth/success` | Signed-in confirmation and continuation to the intended destination. |
| `/auth/forgot-password` | Email entry, invalid input, request result and reset-email handoff. |
| `/auth/reset-password` | Email request form without a token, valid token form, mismatched password, expired or invalid token, successful reset and sign-in. |
| `/cart` | Empty, single item, multiple items or listing types, removal and resulting totals, unavailable items, proceed to checkout. |
| `/checkout` | Valid listing inputs for each checkout variant, traveller data and add-ons where applicable, validation, submission and next screen, unavailable or missing context. |
| `/checkout/multi` | Empty and populated cart, mixed items, traveller details, costs, validation, submission, partial failure where implemented and order payment handoff. |
| `/payments` | Booking and order context, awaiting confirmation, payable, no charge, provider or method selection, successful, pending, failed, cancelled and retry paths where supported. |
| `/payments/cancelled` | Cancellation, return to the originating booking or order, retry and abandonment. |
| `/payments/success` | Booking or order context forwarding to the receipt, missing context forwarding to bookings. Record the redirect as a flow step. |
| `/payments/receipt` | Booking and order receipts, amount and status details, links back, missing or inaccessible record. |
| `/bookings` | Empty and populated history, pagination, different statuses, open details, eligible **Write a review**, already-reviewed booking. |
| `/bookings/[id]` | Request, payment due or failed, confirmed, cancelled, completed and reviewed views, payment and refund history, cancel and pay actions, chat, review entry. |
| `/reviews/new` | Eligible form for each bookable listing type, missing rating, short text, filled form, submission and published result, already reviewed, incomplete or inaccessible booking. |
| `/profile` | Populated and sparse profile, edit and save, validation, change password and errors, sign-in method differences where visible. |
| `/profile/preferences` | Default and configured preferences, notification toggles, save result and persistence. |
| `/profile/payment-settings` | Empty and configured preferences where supported, control changes and save states, unavailable or informational controls. |
| `/profile/messages` | Empty inbox, selected conversation, unread and read, write and send, validation or failure, navigation to booking or listing where linked. |
| `/profile/saved` | Empty and populated lists, open listing, remove and last-item empty transition. |
| `/saved` | Alias to `/profile/saved`. Record the redirect and link to the canonical frames. |
| `/notifications` | New and read notifications, categories and status filters, zero matches, mark read and follow links to related records. |
| `/support` | Empty and populated cases, new-case dialog, category and booking selection, validation, submit, newly created case. |
| `/support/[id]` | Open, in-progress and resolved cases where applicable, history, reply submission and failure, inaccessible case. |
| `/trip-planner` | Empty and populated plans, create, open plan and post-create result. |
| `/trip-planner/[id]` | Empty and populated itinerary, edit plan or items, reorder and remove where supported, save and delete outcomes, invalid plan. |
| `/safety` | Support and advisory tabs, emergency and support links, advisory detail and empty data where applicable. |

### Business · 30 route patterns

| Route | States and actions to verify in Figma |
|---|---|
| `/business` | Partner landing, onboarding and sign-in entries, signed-in continuation. |
| `/business/auth/sign-in` | Valid and invalid credentials, Google handoff, signed-in account with and without workspace access. |
| `/business/auth/accept` | Signed-out entry, signed-in invitation form, valid, expired, invalid and wrong-recipient outcomes. |
| `/business/onboarding` | Initial business profile, required fields and validation, submission, existing membership or profile continuation. |
| `/business/onboarding/setup` | Partner setup entry and completion, next steps, already-onboarded or restricted states where applicable. |
| `/business/dashboard` | New, populated and restricted workspaces, business switch, quick actions, first-time guide, dismiss and reopen guidance and tips. |
| `/business/listings` | Empty and populated, filters by type and publication state, row menus per status, create, edit, preview and publication actions with their results. |
| `/business/listings/new` | Type picker and forms for accommodation, tour, restaurant and transport, media and repeatable fields, validation, saved draft and next step, verification gate. |
| `/business/listings/[id]/edit` | Each listing type, draft and published revision, field and image edits, room and add-on changes where applicable, validation, saved changes and protected access. |
| `/business/listings/[id]/preview` | Saved draft and pending revision, listing type variants, edit and submit controls, unavailable preview. |
| `/business/listings/[id]/review` | Draft, submitted, changes requested, withdrawn, rejected and approved, decision history, submit, withdraw and resubmit outcomes. |
| `/business/listings/[id]/availability` | Room selection, available and sold-out dates, edits and save result, invalid values, no rooms or listing without availability controls. |
| `/business/guides` | Empty and populated guide list and add-guide entry. |
| `/business/guides/new` | Blank and filled profile, validation, submit and return to populated list. |
| `/business/bookings` | Empty and populated, dates and status filters with results or zero matches, different row menus, open details, guide states. |
| `/business/bookings/[id]` | Awaiting response, accepted, declined, payment due, paid, cancelled, completed and reviewed where applicable. Capture accept, decline, complete, chat and refund actions and their outcomes. |
| `/business/bookings/calendar` | Empty and populated time ranges, calendar navigation and upcoming-booking selection. |
| `/business/customers` | Empty and populated, filters and columns, customer or message actions currently offered. |
| `/business/messages` | Empty, unread and selected thread, new-message dialog, customer selection, write and send, resulting conversation. |
| `/business/reviews` | Empty and populated, review filters, action menu, reply entered, posted and visible on listing, permission or failure outcomes where supported. |
| `/business/payments` | Empty and populated booking payments and refunds, filters, pending and completed outcomes, booking links and supported actions. |
| `/business/revenue` | Empty and populated earnings, outcome filters, settlement and payout indicators, available navigation and actions. |
| `/business/notifications` | Empty and populated, unread and read, category filters, follow related action links. |
| `/business/profile` | Profile and account settings, editable values and save or validation states where available. |
| `/business/settings` | Main and team settings tabs, save workspace profile, staff invitation, permission assignments, removal and restrictions where implemented. |
| `/business/team` | Alias to the team settings tab. Record the redirect and verify team states in settings. |
| `/business/settings/verification` | No documents, upload, view and manage documents, invalid upload, submit, changes requested, resubmission, approval and rejection. |
| `/business/verification` | Verification outcomes and history, outstanding requirements, notices and return to documents, guide and tip states. |
| `/business/support` | Empty queue and new-case dialog already visible in Figma. Add populated queue, category and related-booking selection, validation, submit and case link. |
| `/business/support/[id]` | Case detail, message history, reply, closed case, access from another workspace and missing record. |

### Admin · 25 route patterns

| Route | States and actions to verify in Figma |
|---|---|
| `/admin/login` | Signed-out entry, invalid and valid credentials, Google handoff, unauthorized account, redirect to permitted destination. |
| `/admin/auth/accept` | Signed-out and signed-in invitation, valid, expired, invalid and wrong-recipient outcomes and new role access. |
| `/admin/auth/access-denied` | Denied entry, navigation back, restricted role with and without a permitted destination. |
| `/admin/dashboard` | Populated and sparse overview, permission-dependent navigation, drill-down into each linked queue. |
| `/admin/businesses` | Empty and populated directory, filters and statuses, restricted access, open business. |
| `/admin/businesses/[id]` | Different verification and business statuses, empty and populated listings, navigate to listing record and available business actions. |
| `/admin/businesses/[id]/listings/[listingId]` | Listing details and all-fields tab, submissions and history, listing type variants and missing record. |
| `/admin/verification` | Empty and populated queue, status filters, start review, flag or hold confirmation, cancel and committed result where implemented. |
| `/admin/verification/[id]` | Documents and evidence, review notes, request changes, approve, reject, confirmation, submit results and gated access. |
| `/admin/listings` | Empty and populated review queue, status filters and navigate to submission. |
| `/admin/listings/[id]` | Existing and revised content, evidence and checklist, request changes, reject, approve and publish, confirm and cancel, final history. |
| `/admin/bookings` | Empty and populated, filters by status and date, columns and pagination, different rows and detail navigation. |
| `/admin/bookings/[id]` | Status variants, travellers, payment attempts, refund history and available operations, inaccessible or missing records. |
| `/admin/payments` | Payments, refunds and payouts. Retain empty, demo, simulated payout and live views. Add filtered states, refund approval and results, permission restrictions and failure cases. |
| `/admin/users` | Users and invitations, pending and active states, filters, suspension and reactivation with feedback and permission boundaries. |
| `/admin/users/new` | Choose permission level, invite with valid or invalid data, duplicate or pending invitation, success and return. |
| `/admin/roles` | Existing permission levels, grant details, access restrictions and supported management actions. |
| `/admin/roles/new` | Create permission level, select grants, required fields, duplicate and submission result. |
| `/admin/reviews` | Retain All, Flagged, empty and hide confirmation. Add publication, flag and hide outcomes, cancel, republication and customer-visible effect. |
| `/admin/support` | Empty and populated queues, status filters, columns and pagination, case selection. |
| `/admin/support/[id]` | Open, pending and resolved cases where applicable, reply history, reply submission, change status, result and permission denial. |
| `/admin/audit` | Empty and populated events, filters, pagination and column changes, audit records created by admin actions. |
| `/admin/notifications` | Empty and populated categories, unread and read, follow related record links. |
| `/admin/settings` | Current configuration, permission-dependent controls, save and validation where exposed. |
| `/admin/profile` | View profile, edit and save, validation, sign out and resulting login screen. |

### Routes and states outside the automatic scan

| Routes or files | Document separately |
|---|---|
| `/auth/google`, `/auth/google/callback`, `/auth/google/link` | Customer redirect to provider, return, cancelled or failed authorization, account-link prompt and outcomes. Use redacted or simulated provider screens. |
| `/business/auth/google`, `/business/auth/google/callback` | Business provider handoff and return, authorized workspace and no-access branches. |
| `/admin/auth/google`, `/admin/auth/google/callback` | Admin provider handoff and return, permission allowed and denied. |
| `/demo/document`, `/demo/inbox` | Demo document preview and message list where relevant to recorded demo journeys. |
| `/docs`, `/docs/[slug]`, `/ui-kit` | Engineering docs index and article, UI kit component states. These remain explicitly excluded from the automated portal capture. |
| `loading.tsx`, `error.tsx`, `not-found.tsx` | Shared loading UI, error boundary with retry and recovery, missing or invalid resource with escape route. |
| API and system transitions | Label the visible before and after states. Include callbacks, notifications, expiry, and other background effects as system steps when they change a flow. |

### End-to-end flow coverage

| Flow | Branches to document in addition to existing cards |
|---|---|
| Customer access | Registration and verification, reset, invitation handoffs, OAuth success and cancellation, return to a protected entry point. |
| Discovery and booking | Each listing type from search to selection, availability and form validation, saved-item and inquiry paths, single item and populated multi-item cart. |
| Booking and payment lifecycle | Request and response, decline and expiry, success, pending, failure, cancel and retry, receipt, refund and payout, with customer, business and admin views. |
| Business and listing lifecycle | First-time and returning onboarding, switch workspace, upload and resubmit verification, reject and hold outcomes, draft, preview, revision, approval, withdrawal and rejection. |
| Reviews | From My bookings, booking detail and eligible listing, validation and submit, business reply, flag or hide with cancel and confirm, republication and effect on listing feedback. |
| Messaging and support | Customer inquiry, booking chat, business-initiated message, notifications, open case, reply, resolve and follow-up across the applicable surfaces. |
| Staff and admin access | Invite, accept, wrong recipient, expire, sign in with assigned access, deny a restricted action, suspend and reactivate where implemented. |
| Personal tools | Save and remove listing, edit profile and preferences, create and manage a trip itinerary, open safety resources and follow notification links. |
