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
| ? button in the header | Replays the current page's guide from step 1 (shown on pages that have one) |

"Seen" is remembered per person in the browser (`localStorage`), so a new browser or device shows the guides again. While a guide is open, the portal's background refresh pauses. The earlier dashboard pop-up "Welcome to SafariNexa!", which opened on every visit while unverified, was replaced by the welcome tour; the dashboard's status banner remains.

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
