# UI consistency and data sources — November 3, 2026

Follow-up to the app walkthrough. Reused the established PageHero, Card, Button, status badge, form and inbox patterns. No schema migration, database reset, real payment, deployment or GitHub push was performed.

## Page and conversation updates

- Business verification detail uses grouped business fields, document cards, submission metadata and a review-decision panel. It reads the submitted profile when one exists and explicitly identifies current-profile fallback when it does not. Internal IDs are not presented as business information. Review actions retain their existing permission and snapshot checks.
- Document pages use the same visual language and load actual BusinessDocument and BusinessVerification records. Links carry document IDs. The old type-only URL lists matching submissions instead of choosing a business arbitrarily. Missing seed files show an unavailable-file state and a path back to review/uploads. No document contents are invented.
- Admin booking details, business listing submission history, traveller/service summaries, invitation acceptance and password reset now use the existing card/form treatments.
- Customer/business inboxes, booking conversations, listing inquiries and support replies share conversation bubbles, date separators and a composer. Long messages wrap; send failures retain the draft and show an error. Business messages remain accessible on mobile with back navigation.
- Business colleague replies use the recorded thread/customer relationship for outgoing alignment and retain the actual author name. Colleague messages do not claim a customer read receipt from the current viewer's read state. Receipts refresh from persisted data even when message count is unchanged.
- Removed the duplicated business Messages heading. Reopening a closed customer support case via a reply now updates its saved status to match the existing UI promise.
- Removed demo/simulation wording from interface copy while preserving the existing simulation actions, outcome controls, quick account access and server flags.

## Display-to-source trace

| Displayed information | Collection / source | Persistence and use |
| --- | --- | --- |
| Business overview cover | Business Settings → Cover photo → existing image uploader | POST /api/images records the upload; updateBusinessProfile checks upload ownership and writes BusinessProfile.coverImageUrl; the overview reads this field. A missing cover uses the plain existing background. |
| Business logo | Business Settings → Business logo | Same upload/ownership path; BusinessProfile.logoUrl supplies conversation identity. Approved business branding can be displayed publicly; unpublished branding remains restricted to authorised users. |
| Registration/contact information | Onboarding and Business Settings registration number, contact name, role, address, email, phone and location fields | BusinessProfile; businessReviewSnapshot captures the submitted verification fields. Absent values are shown as Not provided. |
| Verification documents | Private document upload form | BusinessDocument.type/fileUrl/uploadedAt and linked verification/business. File availability is not assumed merely because a record exists. |
| Reviews and rating distribution | Customer review form and published Review rows | ReviewSummary uses supplied average/count/star breakdown. Removed the invented Guide/Transportation/Value/Safety sub-scores because no such scores are collected. |
| Dashboard trend chart | Recorded successful/refunded/partially refunded Payment rows for the month | Daily payment amounts and recorded dates produce the revenue path. Removed decorative metric curves with no historical data source. |
| Pending verification count | BusinessVerification rows awaiting review | No longer combines listing review submissions under a business-verification label. |
| Business payout card | Completed Payout rows for the month | Labelled payouts to match the value actually shown. |
| Customer context value in messaging | Recorded confirmed/completed/review-state Booking amounts for this business | Labelled confirmed booking value, rather than asserting that every booked amount was spent. |
| Messages, sender names and times | Existing conversation actions and Message records | Message.senderId/content/createdAt and related User data. Pending booking messages show Sending until persisted. |
| Read receipts | markThreadAsRead and getThreadMessages | MessageReadReceipt data; failed saves do not create a local read timestamp. |
| Commission display | Shared PLATFORM_COMMISSION_RATE used by revenue and settlement logic | Displays the configured 12% rate read-only; removed the pretend editable per-category fee previews. |

## Checks and limits

- TypeScript, ESLint, whitespace checks and 158 tests across 28 suites passed. New tests cover branding persistence, upload ownership, clear/preserve behavior, authorised image access, message errors/pending state, team reply attribution and persisted read receipts.
- Production build verified in an isolated temporary source copy; the running development server was preserved.
- Visually inspected the requested verification detail, the old document-type URL, Business Settings upload controls and the standardised business inbox in an isolated Arc tab. Screenshots are in `/tmp/safarinexa-ui-polish/`.
- No replacement certificate or business photograph was supplied. Existing example.com file references remain unavailable until replaced by an actual upload. Business profile data was not filled with invented addresses or phone numbers during checks.
- General admin preferences still use device-local storage; they do not change public platform configuration. Commission is an explicit backend configuration value, not a rate collected separately for each category. Historical submission snapshots without a saved profile remain identified as such.
- The audit covers the displayed fields and workflows above; it is not an exhaustive certification of every data field across all 100 routes or every device/browser state. Mobile chat behavior has shared component/type/test coverage; final visual screenshots were desktop.
