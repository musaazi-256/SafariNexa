# SafariNexa demo: form capture, reporting and approval review

Scope: local `Prototype` code and local PostgreSQL demo database. Figma was not changed. This is a source-level form-family trace plus targeted automated regression and database checks, not a claim that every UI action has been manually exercised.

## Main fixes in this pass

- Separate listing review from business verification. Businesses can no longer publish directly.
- Capture immutable listing submissions containing base information, cover/gallery photos, accommodation rooms and their photos, add-ons, and tour/restaurant/transport details.
- Add admin listing queue and full submission detail, approval checklist, reviewer reasons, authorisation, review audit events and notifications to actual owner/manager accounts.
- Return submission history, status, exact submitted content and reviewer feedback to the business listing. Requests for changes can be edited and resubmitted; pending submissions must first be withdrawn.
- Keep uploaded local images private before publication, accessible to the uploader, business members referencing the image and active admins. Public image access requires a published cover/gallery/room reference. Do not cache private responses.
- Lock published catalogue editing. For this demo, unpublish → edit → resubmit → admin approval. Existing approved content is NOT retained live while a draft is edited; parallel live/draft revisions remain a later enhancement.
- Capture business-profile snapshots on new onboarding and document submissions. Admin business verification now exposes those fields, not only document links. If the profile changes after submission, the approval check asks for resubmission. Legacy records explicitly disclose missing historical snapshots.
- Preserve reviewed business documents against deletion; return reviewer notes for approved/under-review states as well as negative decisions.
- Connect saved nationality/emergency contact and phone to checkout. Optional details are visible and editable before submission, with an explicit sharing notice. Snapshot them onto the booking participant and display them in customer, booked-business and admin booking details.
- Apply notification-category preferences to the default notification-centre feed; individual category tabs retain history. Clarify that these controls do not configure email/SMS delivery.
- Correct misleading business contact/address explanations and fake fallback contact values; surface inquiry-send failures; align document-upload copy with the enforced 5 MB limit; validate map coordinates.
- Fix empty optional fields being sent as `undefined` (which silently retained old database values). Room/add-on descriptions, refund/discount text, accommodation times/policy, tour guide/difficulty, restaurant menu/capacity and transport duration/pricing now clear explicitly to `null`.

## Capture → storage → reporting → return map

“Source traced” below means the producer and consumer were found in code. It does not imply a successful browser or external-provider test in this pass.

| Form / action family | Captures / source | Storage and consumer | Returned to submitter / status |
|---|---|---|---|
| Account creation and credentials sign-in | Account identity, email, password | User/password hash; authenticated sessions | Account/auth result and signed-in account. External Google flow not re-tested. |
| Password reset / email verification / Google linking | Email, single-use token, confirmed credentials | Hashed expiring token; User/account association | Confirmation/error through account-email form. Actual email delivery requires configured provider. |
| Customer profile | Name, phone, date of birth | User + CustomerProfile | Profile reads saved fields. Phone now also prefills both checkouts. DOB remains private profile data, not silently shared with merchants. |
| Customer preferences | Notification categories, nationality, emergency contact | CustomerProfile.preferences and traveller defaults | Saved confirmation; default feed filtering; both checkout forms prefill optional traveller details. |
| Search and portal filters | Keywords, category, dates, guests, status, pagination | URL/query parameters, not submission records | Filtered results / selected parameters. Not every filter combination was manually tested. |
| Saved listings | Listing ID and signed-in customer | SavedItem | Save state and saved-listings page. Draft room-detail action now rejects unpublished listings. |
| Trip planner | Title, activities, dates and notes | TripPlan + ordered TripPlanItem | Owned list/editor reloads persisted itinerary. Does not create bookings. |
| Listing inquiry | Listing ID and message | MessageThread + Message + notifications | Business inbox receives message; customer Messages receives replies. Send failures now visible instead of console-only. |
| Booking chat / inbox reply | Author, thread/booking and body | Message with per-user read receipts | Both participant inboxes; read status is per viewer. |
| Support case | Subject, category, body | SupportCase + initial SupportMessage | Customer case detail and admin support queue. |
| Support reply/status | Case, author, message or admin decision | SupportMessage / SupportCase + notifications | Customer/admin case thread and status. Source traced. |
| Direct and cart checkout | Listing/room, dates/time, participants, add-ons, traveller contacts | Order where applicable; Booking; BookingParticipant; BookingAddOn; inventory | Payment handoff and booking details in all three portals. New optional traveller defaults are persisted, not merely displayed in the form. |
| Hosted payment initiation | Owned payable order/booking | Payment attempt; Stripe Checkout | Hosted checkout; verified payment/receipt state. No raw card storage. Live provider acceptance not re-tested. |
| Cancel / refund request | Owned booking and cancellation context | Booking status, inventory release, Refund where needed | Customer and business booking state; admin refund work queue. Actual funds move only through configured provider. |
| Business booking response/completion | Booking and confirm/decline/complete | Booking lifecycle + notifications | Customer booking status; completion enables review eligibility. |
| Customer review | Eligible completed booking, rating, title, body | Review linked to listing/business/booking | Booking review state; business reviews; admin moderation; public review display subject to moderation. Source traced. |
| Business review reply | Review ID and reply | Review.businessReply | Business review page and public review component. Source traced. |
| Admin review moderation | Review and moderation decision | Review status + notifications | Public visibility and author/business notification. Moderation reason collection can be improved beyond status-only controls. |
| Business onboarding wizard | Name, registration, address, description, contact name/role/email/phone, documents | BusinessProfile, owner membership, BusinessVerification, private BusinessDocument | Business verification state; admin sees profile snapshot and documents. City/country use initial defaults and can be refined in business settings. |
| Business document submission | Document type and file | Private file + BusinessDocument + updated verification/profile snapshot | Verification documents, status and admin review. Files are not listing photos. |
| Business verification decision | Status and reviewer notes | BusinessVerification + BusinessProfile status + notifications/audit | Business verification banner now shows notes for all reviewed outcomes. Latest-record guard prevents approving an older submission. |
| Business settings | Name, support email/phone, address, city/country and description | BusinessProfile | Settings/profile and admin business details. Business address is not the listing location. Pending snapshot mismatch blocks approval; automatic re-verification of identity changes after an existing approval remains a policy gap. |
| Team invite / accept / cancel / remove | Email, permitted role, invitation token/member | BusinessInvitation / BusinessUser | Settings/team membership and invitation state. Real invitation email requires configuration. |
| Guide creation | Name, bio, photo URL, destination, languages, experience, specialisation, rate, vehicle, availability note | Guide | Business guide management, customer guide detail, tour guide selection. No separate guide moderation/revision workflow was added. |
| Listing draft creation/edit | Common listing fields + category-specific fields, cover/gallery/room photos | Listing + Accommodation/RoomType/AddOn, Tour, Restaurant or Transport | Business editor and submission preview. New drafts are never published by upload/save. |
| Listing submit/withdraw | Saved listing and authenticated owner/manager | ListingSubmission with exact content snapshot, author and time | Business submission/history page and admin queue. Pending submission locked; withdraw before changing. |
| Listing admin decision | Complete snapshot, photos, checklist, status, reason | ListingSubmission + audit event; approval publishes Listing | Business history/reasons + owner/manager in-app notifications; customer catalogue sees published content. |
| Listing unpublish/archive | Listing and authenticated owner/manager | Listing.status | Listing disappears from published catalogue. Archive is not permanent deletion. Restore/archive UX can be expanded. |
| Operational availability/date prices | Listing/room/date, capacity, price override | Availability; validated against reservations | Calendar and booking availability/quote calculation. These remain live operational updates, separate from catalogue/photo approval. |
| Admin user invite/status | Email, assigned role, active/suspended state | AdminInvitation / AdminUser | Admin user list and acceptance flow. Does not grant blanket super-admin access. |
| Admin profile | Display name and phone | AdminUser / User via existing action | Admin profile reloads saved identity. Email is explicitly read-only. |
| Notification read actions | Owned notification/all read | Notification.isRead | Notification centre state; no deletion of history. |
| CSV export | Currently rendered rows | Client-generated CSV only | Download request status. File saving in the in-app browser remains unverified from the earlier pass. |
| Sign-out / active-business selector | Current session / authorised business | Session/cookie | Appropriate portal and active-business context; selection checks actual membership. |

## Photo lifecycle and basis for approval

1. Owner/manager uploads cover, gallery and room images while creating/editing a draft. Local uploads record the uploader and remain non-public while unreferenced by a published listing.
2. Saving keeps catalogue content in draft; it is not a submission or approval.
3. “Submission & feedback” previews the saved information. Submission requires a cover photo, meaningful description, location, positive price and accommodation rooms where applicable.
4. Submit freezes the exact content/photos in a review record. A database partial unique index allows only one pending submission per listing.
5. Admin reviews the full snapshot and original photo links. Approval requires explicit photo, information/location, pricing/booking and policy/evidence checks, plus a written reason.
6. Approval and publication are committed together. Requests for changes/rejections keep the listing off the public catalogue; feedback returns to the business.
7. Changed catalogue content invalidates review matching. Editing published or pending content is blocked server-side as well as in the page.
8. To change approved photos in this demo: unpublish, edit and save, then submit a new review. Historical submissions retain their original photo references.

Approval is a human content review, not automatic proof of image ownership, location authenticity or regulatory compliance. The platform must define its category-specific policies. Historical external photo URLs are references, not immutable copies of third-party bytes; locally uploaded files use unique filenames and are not overwritten.

## Verification evidence

- Current automated result: **85 tests passed across 11 suites**; TypeScript check and ESLint passed without warnings/errors; `git diff --check` passed.
- Final production build passed with `AUTH_DEV_MODE=false`. Demo restarted on `http://localhost:3002` with the updated build and local database.
- Automated tests cover content fingerprinting, snapshot completeness, eligibility, cross-business access, duplicate pending submissions, approval checklists, decision replay, rejection/changes, withdrawal scoping and feedback recipients.
- Image route tests cover anonymous/unrelated-user denial before publication, uploader/admin previews, published cover/gallery/room references, invalid filenames and no-store responses.
- Booking regression confirms confirmed traveller defaults reach the saved participant.
- Rollback-only local PostgreSQL integration test verifies snapshot persistence, draft visibility, feedback, resubmission history, upload ownership table and new traveller/business-profile columns. It leaves no synthetic records.
- Two additive local migrations applied; schema comparison reports no difference. Existing published listings/bookings were not removed or bulk reclassified.
- Browser interaction was blocked by the browser-control URL policy during this pass. No new mobile/desktop visual or end-to-end browser success is claimed here. The earlier responsive audit is separate evidence for earlier code, not a substitute for testing these new screens.

## Remaining work / limits

- Run the manual walkthrough below on desktop and mobile once browser access is restored. Server actions have automated coverage, but these new controls still need visual and keyboard QA.
- Existing seeded/published listings predate this workflow. They have no retrospective approval record; unchanged visibility must not be represented as proof they passed the new review.
- Retaining a live approved version during draft edits is not implemented. Unpublishing temporarily removes the listing from customers.
- Define whether post-approval legal business-profile changes automatically reopen business verification; currently the new snapshot guard protects pending approvals, not this later identity-change policy.
- Guide profiles have their own creation/display path, not the new listing photo approval queue.
- Operational date-price/capacity updates are not queued for content approval. Define approval thresholds if dynamic pricing also needs moderation.
- Email/SMS operational delivery, mobile-money collection, payouts and live provider acceptance remain external integration work. Form persistence or in-app notification must not be presented as proof that an external email/payment/transfer occurred.
- Some forms use framework error boundaries for server failures rather than preserving all values with inline field-specific feedback. This remains a UX hardening task; do not equate a connected storage path with fully polished form UX.

## Manual demo acceptance walkthrough

1. Sign in as an existing business owner and create a draft with distinct cover/gallery photos (and room photos for accommodation).
2. Open Submission & feedback. Confirm every captured field and image appears; submission is disabled with a readable missing-information checklist if incomplete.
3. Submit. Confirm the listing stays off customer browse/detail; editing is locked and withdrawal is offered.
4. Sign in as an authorised admin. Open Listing reviews and inspect the full submission, including original room photos.
5. Request changes with a concrete reason. Return to business submission history; confirm the same reason appears and the listing is editable.
6. Save corrections and resubmit. Confirm separate historical snapshots, one pending submission and unchanged customer visibility.
7. Approve with every checklist completed. Confirm customer publication and business notification/history. A second decision against the same submission must be refused.
8. Attempt published-photo editing. Confirm unpublish/resubmit is required; no new unapproved image becomes public via the listing.
9. Save traveller defaults. Check direct and cart checkout prefill them; clear optional data if unwanted. Confirm the submitted values appear consistently in all three booking detail views.
10. Change notification preferences; confirm the default feed follows those categories and explicit category tabs retain history.
