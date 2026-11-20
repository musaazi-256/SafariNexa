// Documented journeys: performs each flow for real across the customer website and
// the business and admin portals, capturing the screen after every step, so Figma
// shows the flow exactly as it happens.  node scripts/capture/journeys.mjs [journey-id,...]
// Writes design/handoff/journeys/captures/<step>.json and journeys/journeys.json.
// Each step label says what the screen shows, then "Next:" and the action.
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { BASE, HANDOFF, VIEW } from "./config.mjs";
import { signIn, settle, snap } from "./lib.mjs";
import { KIDEPO, OUTCOME, cleanup, disconnect, kidepoCookie, pdf, setup } from "./fixtures.mjs";

const out = HANDOFF + "journeys/captures/";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

const go = (path) => async (p, c) => p.goto(BASE + (typeof path === "function" ? path(c) : path), { timeout: 180000 });
const button = (name) => async (p) => p.getByRole("button", { name }).first().click();
const link = (name) => async (p) => p.getByRole("link", { name }).first().click();
const seq = (...fns) => async (p, c) => {
  for (const f of fns) {
    await f(p, c);
    await settle(p);
  }
};
// The detail link of a booking, found by its reference (e.g. "BK-8771F184"):
// the row's own reference link, not a page-level link that merely contains it.
const bookingHref = (prefix) => async (p, c) =>
  p.evaluate(
    ([prefix, ref]) => {
      const links = [...document.querySelectorAll(`a[href^='${prefix}']`)];
      const own = links.find((a) => a.textContent.trim() === ref) || links.find((a) => a.textContent.includes(ref) && a.textContent.length < 80);
      return own ? own.getAttribute("href").split("#")[0] : null;
    },
    [prefix, c.vars.ref],
  );

// Verification journeys -------------------------------------------------------------
// They act on the Kidepo Ridge Lodge fixture (fixtures.mjs), which each journey resets
// and the run deletes afterwards.
const top = async (p) => p.evaluate(() => window.scrollTo(0, 0));
// Click a submit button and wait for the server action (and any redirect) to finish.
const press = (name, scope) => async (p) => {
  await (scope ? scope(p) : p).getByRole("button", { name, exact: true }).first().click();
  await p.waitForLoadState("networkidle", { timeout: 120000 }).catch(() => undefined);
  await p.waitForTimeout(2000);
  await top(p);
};
const dialog = (p) => p.getByRole("dialog");
const confirm = (name) => press(name, dialog);
const notes = (text, selector = "#review-notes") => async (p) => p.locator(selector).first().fill(text);
// Opens the first link under `prefix` whose own text, or its row's, mentions `text`
// (a row is the nearest ancestor holding no other link to `prefix`).
const open = (prefix, text) => async (p) => {
  const href = await p.evaluate(
    ([prefix, text]) => {
      const links = [...document.querySelectorAll(`main a[href^='${prefix}']`)];
      const row = (a) => {
        let el = a;
        while (el.parentElement && el.parentElement.tagName !== "MAIN" && [...el.parentElement.querySelectorAll(`a[href^='${prefix}']`)].every((x) => x.getAttribute("href") === a.getAttribute("href"))) el = el.parentElement;
        return el.textContent;
      };
      return (links.find((a) => a.textContent.includes(text)) || links.find((a) => row(a).includes(text)))?.getAttribute("href");
    },
    [prefix, text],
  );
  if (!href) throw new Error(`No link to ${prefix}… mentioning ${text}`);
  await p.goto(BASE + href, { timeout: 180000 });
};
const upload = (type, file, title, lines) => async (p) => {
  await p.locator("#verification-type").selectOption(type);
  await p.locator("#verification-file").setInputFiles({ name: file, mimeType: "application/pdf", buffer: pdf(title, lines) });
};
// Admin listing review: open photos / documents one by one, as the reviewer does.
const photoTiles = (p) => p.locator("main button[aria-label^='Open '][aria-label*=' photo ']");
const docButtons = (p) => p.locator("main").getByRole("button", { name: "View", exact: true });
const viewAll = (tiles, from = 0) => async (p) => {
  const count = await tiles(p).count();
  for (let i = from; i < count; i++) {
    // A click before the page has hydrated opens nothing: retry until the viewer shows.
    for (let tries = 0; tries < 5; tries++) {
      await tiles(p).nth(i).click();
      if (await dialog(p).waitFor({ timeout: 4000 }).then(() => true, () => false)) break;
    }
    await p.waitForTimeout(500);
    await p.keyboard.press("Escape");
    await dialog(p).waitFor({ state: "detached", timeout: 10000 }).catch(() => undefined);
  }
};
const tick = (...keys) => async (p) => {
  for (const k of keys) await p.locator(`#check-${k}`).click();
};
const LISTING = `/business/listings/${KIDEPO.listing}`;
// First-time guides: step through the open guide dialog.
const guideButton = (name) => async (p) => {
  await p.getByRole("dialog").getByRole("button", { name, exact: true }).click();
  await p.waitForTimeout(700);
};
const guideNext = guideButton("Next");
// Feature tips: buttons on the tip beside a control.
const tipButton = (name) => async (p) => {
  await p.locator("[data-feature-tip]").getByRole("button", { name, exact: true }).click();
  await p.waitForTimeout(1200);
};

// Booking and payment outcome journeys -------------------------------------------------
const cust = (id) => "/bookings/" + id;
const biz = (id) => "/business/bookings/" + id;
const adm = (id) => "/admin/bookings/" + id;
// Pick a payment method and the demo simulation result on /payments, ready to Pay.
const choosePayment = (outcome) => async (p) => {
  await p.locator("input[name=method][value=mtn]").check({ force: true });
  await p.locator("select[name=outcome]").selectOption(outcome);
};
const pay = async (p) => {
  await p.getByRole("button", { name: /^Pay UGX/ }).click();
  await p.waitForURL((u) => !/\/payments$/.test(u.pathname) || u.search.includes("status"), { timeout: 120000 }).catch(() => undefined);
  await p.waitForTimeout(3000);
  await top(p);
};
// The refund row for a Kidepo booking on the admin Payments page.
const refundRow = (p, reason) => p.locator("tr").filter({ hasText: "Kidepo Ridge Lodge" }).filter({ hasText: reason }).first();

const OUTCOME_JOURNEYS = [
  {
    id: "booking-declined",
    fixture: "bookingOutcomes",
    title: "The business declines a booking request",
    summary: "Grace asks to stay at Kidepo Ridge Lodge. The lodge can't host her and declines the request before the deadline. Nothing was charged; Grace sees the booking as declined, and so does operations.",
    steps: [
      { lane: "customer", act: go(cust(OUTCOME.request)), label: "Customer · My booking: Awaiting confirmation, with the lodge's response deadline. She can still cancel. Next: the lodge responds." },
      { lane: "business", act: go(biz(OUTCOME.request)), label: "Business · Booking: the request with Accept request — ask customer to pay, and Decline booking. Next: Decline booking." },
      { lane: "business", act: press("Decline booking"), label: "Business · Booking: Cancelled by business. No actions remain." },
      { lane: "system", label: "The booking is cancelled by the business, its dates are released, and the customer is notified. Nothing was paid, so there is no refund." },
      { lane: "customer", act: go(cust(OUTCOME.request)), label: "Customer · My booking: Cancelled by business, and it can no longer be cancelled here." },
      { lane: "admin", act: go(adm(OUTCOME.request)), label: "Admin · Booking: Cancelled by business, with no payment." },
    ],
  },
  {
    id: "booking-cancelled-unpaid",
    fixture: "bookingOutcomes",
    title: "A customer cancels a booking before paying",
    summary: "The lodge accepted Grace's request and is waiting for payment. She changes her plans and cancels; nothing was paid, so the booking is simply cancelled and the dates are freed.",
    steps: [
      { lane: "customer", act: go(cust(OUTCOME.unpaid)), label: "Customer · My booking: Payment required, with Complete payment and Cancel booking. Next: Cancel booking." },
      { lane: "customer", act: press("Cancel booking"), label: "Customer · My booking: Cancelled by you." },
      { lane: "system", label: "The dates are released and the lodge is notified. No payment was taken, so no refund is needed." },
      { lane: "business", act: go(biz(OUTCOME.unpaid)), label: "Business · Booking: Cancelled by customer." },
    ],
  },
  {
    id: "payment-failed-retry",
    fixture: "bookingOutcomes",
    title: "A payment is declined, then retried successfully",
    summary: "Grace's mobile money payment is declined (simulated). The booking shows Payment failed and keeps Complete payment, so she tries again and the booking is confirmed.",
    steps: [
      { lane: "customer", act: go(cust(OUTCOME.retry)), label: "Customer · My booking: Payment required. Next: Complete payment." },
      { lane: "customer", act: seq(link("Complete payment"), choosePayment("failed")), label: "Complete payment: MTN Mobile Money with the simulation set to Payment is declined. Next: Pay." },
      { lane: "customer", act: pay, label: "Payment not completed: the declined result and what to do next." },
      { lane: "customer", act: go(cust(OUTCOME.retry)), label: "Customer · My booking: Payment failed, with Complete payment to try again. Next: Complete payment." },
      { lane: "customer", act: seq(link("Complete payment"), choosePayment("success")), label: "Complete payment again, this time set to Payment succeeds. Next: Pay." },
      { lane: "customer", act: pay, label: "Payment successful: the receipt." },
      { lane: "customer", act: go(cust(OUTCOME.retry)), label: "Customer · My booking: Confirmed and paid; both payment attempts are listed." },
      { lane: "business", act: go(biz(OUTCOME.retry)), label: "Business · Booking: Confirmed, with the successful payment under Payments & refunds." },
    ],
  },
  {
    id: "refund-business-cancel",
    fixture: "bookingOutcomes",
    title: "The business cancels a paid booking and the customer is refunded",
    summary: "Kidepo Ridge Lodge has to cancel a paid booking. Cancelling creates a refund request; operations approves it in the admin portal and the booking ends as refunded.",
    steps: [
      { lane: "business", act: go(biz(OUTCOME.paidBusiness)), label: "Business · Booking: Confirmed and paid, with Cancel booking. Next: Cancel booking." },
      { lane: "business", act: async (p) => p.getByRole("button", { name: "Cancel booking" }).first().click(), label: "Cancel this booking? The customer will be notified, and as it's paid a refund request is created. Next: Cancel booking." },
      { lane: "business", act: confirm("Cancel booking"), label: "Business · Booking: Refund requested, with the request under Payments & refunds." },
      { lane: "system", label: "The booking moves to Refund requested; a refund for the full amount waits for approval. Customer and lodge are notified." },
      { lane: "customer", act: go(cust(OUTCOME.paidBusiness)), label: "Customer · My booking: Refund requested; the refund isn't complete yet." },
      { lane: "admin", act: seq(go("/admin/payments"), async (p) => refundRow(p, "Business declined").scrollIntoViewIfNeeded()), label: "Admin · Payments, refunds & payouts: the Kidepo refund request with Approve refund. Next: Approve refund." },
      { lane: "admin", act: async (p) => refundRow(p, "Business declined").getByRole("button", { name: "Approve refund" }).click(), label: "Approve this refund? The amount goes back to the traveller through the payment provider and can't be undone. Next: Approve refund." },
      { lane: "admin", act: confirm("Approve refund"), label: "Admin · Payments: the refund is Completed." },
      { lane: "customer", act: go(cust(OUTCOME.paidBusiness)), label: "Customer · My booking: Refunded." },
      { lane: "admin", act: go(adm(OUTCOME.paidBusiness)), label: "Admin · Booking: Refunded, with the payment and the completed refund." },
    ],
  },
  {
    id: "refund-customer-cancel",
    fixture: "bookingOutcomes",
    title: "A customer cancels a paid booking and asks for a refund",
    summary: "Grace cancels a confirmed, paid stay with free cancellation. The booking moves to Refund requested; the lodge sees the request and operations can approve it.",
    steps: [
      { lane: "customer", act: go(cust(OUTCOME.paidCustomer)), label: "Customer · My booking: Confirmed and paid, with Cancel booking. Next: Cancel booking." },
      { lane: "customer", act: press("Cancel booking"), label: "Customer · My booking: Refund requested." },
      { lane: "system", label: "A refund request for the full amount is created (the room is refundable); the lodge is notified." },
      { lane: "business", act: go(biz(OUTCOME.paidCustomer)), label: "Business · Booking: Refund requested, with the request under Payments & refunds." },
      { lane: "admin", act: seq(go("/admin/payments"), async (p) => refundRow(p, "Customer cancellation").scrollIntoViewIfNeeded()), label: "Admin · Payments, refunds & payouts: the request waiting for approval, as in the previous journey." },
    ],
  },
];

const VERIFICATION_JOURNEYS = [
  {
    id: "first-time-guides",
    fixture: "newBusiness",
    guides: true,
    title: "A new business is guided through the portal: welcome tour, screen guides and feature tips",
    summary:
      "The first time Kidepo Ridge Lodge's owner opens the business portal, a welcome tour explains verification, listings, bookings, messages and payments, one step at a time, and ends with the next thing to do. Key screens (Verification, Listings, the listing form, Bookings) have their own short guide the first time they are opened. After a guide, feature tips appear one at a time beside the controls to use next. Guides and tips can be skipped, dismissed or turned off, and replayed from the ? help menu in the header.",
    steps: [
      { lane: "business", act: go("/business/dashboard"), label: "Welcome tour, step 1 of 6: opens by itself on the first visit, over the Overview. Skip guide, Next, and close (× or Escape) are on every step. Next: Next." },
      { lane: "business", act: guideNext, label: "Step 2: Get your business verified first, and where the decision and notes appear. Next: Next." },
      { lane: "business", act: guideNext, label: "Step 3: Create listings, preview them, submit them for approval. Next: Next." },
      { lane: "business", act: guideNext, label: "Step 4: Respond to booking requests before the deadline; accepting asks the traveller to pay. Next: Next." },
      { lane: "business", act: guideNext, label: "Step 5: Messages, Reviews, Earnings and Payments & refunds. Next: Next." },
      { lane: "business", act: guideNext, label: "Step 6: You're ready. For an unverified business the next step is Upload documents (a verified one gets Create a listing). Done closes the tour. Next: Upload documents." },
      { lane: "business", act: async (p) => { await p.getByRole("dialog").getByRole("link", { name: "Upload documents" }).click(); await p.waitForURL(/\/business\/settings\/verification/, { timeout: 120000 }); await settle(p); await p.getByRole("dialog").waitFor({ timeout: 30000 }); }, label: "Verification & documents, with its guide opening for the first time: what to upload. Next: Next." },
      { lane: "business", act: guideNext, label: "Verification guide, step 2: what happens after uploading, and Needs changes. Next: Skip guide." },
      { lane: "business", act: guideButton("Skip guide"), label: "Guide skipped. A feature tip now appears beside Document type: \"1. Pick the document type\", with Got it and Turn off tips; the field is highlighted. Next: Got it." },
      { lane: "business", act: tipButton("Got it"), label: "Tip 2 of 3 beside the file field: what to attach. Next: Got it." },
      { lane: "business", act: tipButton("Got it"), label: "Tip 3 of 3 beside Submit for review: what happens after sending. Next: Got it." },
      { lane: "business", act: tipButton("Got it"), label: "All of this page's tips seen: the page as it is. Tips don't come back once dismissed." },
      { lane: "business", act: go("/business/listings"), label: "Listings, with its guide opening for the first time: statuses and the row menu. Next: close it with ×." },
      { lane: "business", act: async (p) => { await p.keyboard.press("Escape"); await p.locator("[data-feature-tip]").waitFor({ timeout: 15000 }); await p.waitForTimeout(500); }, label: "Guide closed (closing counts as seen). A tip points at Create listing. Next: Turn off tips." },
      { lane: "business", act: tipButton("Turn off tips"), label: "Tips turned off: no more tips on any page. Next: the ? help menu in the header." },
      { lane: "business", act: async (p) => { await p.locator("header button[aria-label='Help for this page']").click(); await p.getByRole("menu").waitFor(); await p.waitForTimeout(400); }, label: "Help menu: replay this page's guide (Listings guide · 3 steps), or Show tips on this page. Next: Show tips on this page." },
      { lane: "business", act: async (p) => { await p.getByRole("menuitem", { name: "Show tips on this page" }).click(); await p.locator("[data-feature-tip]").waitFor({ timeout: 15000 }); await p.waitForTimeout(500); }, label: "Tips are back on, starting again from Create listing." },
      { lane: "business", act: seq(tipButton("Got it"), go("/business/dashboard"), async (p) => { await p.locator("[data-feature-tip]").waitFor({ timeout: 15000 }).catch(() => undefined); await p.waitForTimeout(500); }), label: "Back on the Overview: the welcome tour doesn't open again; this page's tips point at the verification status and Add a listing." },
    ],
  },
  {
    id: "business-verification",
    fixture: "newBusiness",
    title: "A new business gets verified: upload, changes requested, resubmit, approval",
    summary:
      "Kidepo Ridge Lodge has just joined; the owner uploads a registration certificate. An admin reviews it and asks for the tourism licence too. The owner sees the request on Verification, uploads the licence, and the admin starts the review and approves the business, which can then submit listings.",
    steps: [
      { lane: "business", act: go("/business/dashboard"), label: "Business · Overview: a new business with no bookings yet. The welcome tour (see the first-time guides journey) points it to Verification first. Next: Verification." },
      { lane: "business", act: go("/business/verification"), label: "Business · Verification outcomes: the business decision (Not submitted yet, Upload documents), counts of listing outcomes and every listing's review status. Next: Upload documents." },
      { lane: "business", act: go("/business/settings/verification"), label: "Business · Verification & documents: status Not started, the review timeline, documents on file (none) and Add a document. Next: choose a document type and file." },
      { lane: "business", act: upload("INCORPORATION", "certificate-of-incorporation.pdf", "Certificate of Incorporation", ["Kidepo Ridge Lodge Ltd", "Registration number 80020001234567"]), label: "Add a document: type Incorporation and a PDF chosen (PDF, JPEG or PNG up to 5 MB). Next: Submit for review." },
      { lane: "business", act: press("Submit for review"), label: "Submitted: the status is Submitted, the timeline moves to review and the certificate is listed under documents on file." },
      { lane: "system", label: "The business moves to Submitted. Admins with the businesses permission get a notification; the profile as it is now is saved with the submission." },
      { lane: "admin", act: go("/admin/verification"), label: "Admin · Verification queue (Submitted): Kidepo Ridge Lodge at the top with its documents, a notes box and quick Approve, Request more and Flag. Next: open the submission." },
      { lane: "admin", act: open("/admin/verification/", "Kidepo Ridge Lodge"), label: "Admin · Verification review: the business information saved with the submission, each supporting document (View document), submission details and the decision form. Next: write notes and Request changes." },
      { lane: "admin", act: notes("Thanks for the registration certificate. Please also upload your Uganda Tourism Board operating licence."), label: "Reviewer notes filled in. Notes are required for every decision and are shown to the business. Next: Request changes." },
      { lane: "admin", act: press("Request changes"), label: "Needs changes: the status badge updates and the notes stay on the record." },
      { lane: "system", label: "The business owners get a notification: Business verification: needs changes, with the reviewer notes." },
      { lane: "business", act: go("/business/verification"), label: "Business · Verification outcomes: Changes requested, with the dates, the reviewer's notes and Update documents. Next: upload the licence." },
      { lane: "business", act: seq(go("/business/settings/verification"), upload("LICENSES", "tourism-operating-licence.pdf", "Tourism Operating Licence", ["Kidepo Ridge Lodge", "Uganda Tourism Board"])), label: "Verification & documents: Needs changes with the reviewer notes; Licences & permits and the PDF chosen. Next: Submit for review." },
      { lane: "business", act: press("Submit for review"), label: "Resubmitted: back to Submitted, now with two documents on file. Adding a document always moves the business back into review." },
      { lane: "admin", act: seq(go("/admin/verification"), open("/admin/verification/", "Kidepo Ridge Lodge"), notes("Licence received. Checking it against the Uganda Tourism Board register.")), label: "Admin · Verification review: both documents, the earlier notes replaced with new ones. Next: Start review." },
      { lane: "admin", act: press("Start review"), label: "Under review: the business sees that someone is checking it. Next: approve." },
      { lane: "admin", act: notes("Registration certificate and tourism licence verified. Welcome to SafariNexa."), label: "Approval notes written. Approving is refused if the business profile changed after it submitted. Next: Approve business." },
      { lane: "admin", act: press("Approve business"), label: "Approved: the business is verified." },
      { lane: "system", label: "The business is Approved: its owners are notified, and it can now submit listings for approval and receive payouts." },
      { lane: "business", act: go("/business/verification"), label: "Business · Verification outcomes: Verified, with the approval notes. Listings can now be submitted." },
      { lane: "business", act: go("/business/listings/new"), label: "Business · Create listing: now verified, the business can create listings and submit them for approval." },
    ],
  },
  {
    id: "business-verification-rejected",
    fixture: "newBusiness",
    title: "Business verification rejected, and the fraud hold an admin can place",
    summary:
      "Kidepo Ridge Lodge uploads a registration certificate that doesn't check out. From the queue an admin can place a fraud hold (shown, not confirmed). The admin rejects the submission instead, with reasons; the business sees the rejection and can start again with new documents.",
    steps: [
      { lane: "business", act: seq(go("/business/settings/verification"), upload("INCORPORATION", "certificate.pdf", "Certificate of Incorporation", ["Kidepo Ridge Lodge Ltd"]), press("Submit for review")), label: "Business · Verification & documents: the certificate submitted; status Submitted." },
      { lane: "admin", act: go("/admin/verification"), label: "Admin · Verification queue: Kidepo Ridge Lodge with Approve, Request more and Flag. Next: Flag." },
      { lane: "admin", act: async (p) => p.locator("main div.shadow-card").filter({ has: p.getByRole("link", { name: KIDEPO.name, exact: true }) }).getByRole("button", { name: "Flag" }).click(), label: "Place a fraud hold? The business would be suspended and its listings taken off the marketplace until the hold is lifted; the notes typed in the row are shown. Cancel keeps things as they are. Next: Cancel, and open the submission instead." },
      { lane: "admin", act: seq(async (p) => p.keyboard.press("Escape"), open("/admin/verification/", "Kidepo Ridge Lodge"), notes("The registration number on the certificate does not match the URSB register.")), label: "Admin · Verification review with the reasons written. Next: Reject submission." },
      { lane: "admin", act: async (p) => p.getByRole("button", { name: "Reject submission" }).first().click(), label: "Reject this submission? Confirms the business name and shows the notes that will be sent. Next: Reject submission." },
      { lane: "admin", act: confirm("Reject submission"), label: "Rejected: the status badge shows Rejected." },
      { lane: "system", label: "The owners are notified: Business verification: rejected, with the notes. The business cannot submit listings." },
      { lane: "business", act: go("/business/verification"), label: "Business · Verification outcomes: Rejected, with the reviewer's reasons and Upload documents." },
      { lane: "business", act: go("/business/settings/verification"), label: "Business · Verification & documents: Rejected with the notes. Adding a new document starts a fresh submission." },
    ],
  },
  {
    id: "listing-verification",
    fixture: "draftListing",
    title: "A listing is checked and approved: preview, submit, evidence review, changes, approval",
    summary:
      "Verified Kidepo Ridge Lodge previews its new listing as travellers will see it and submits it. An admin opens every photo and document (the approval checks stay locked until they have), marks it under review and asks for changes. The business sees the feedback, resubmits, and the admin approves and publishes it.",
    steps: [
      { lane: "business", act: go("/business/listings"), label: "Business · Listings: Kidepo Ridge Lodge is a Draft that has not been submitted. The row menu has Preview as traveller. Next: preview it." },
      { lane: "business", act: go(`${LISTING}/preview`), label: "Business · Listing preview: the listing exactly as travellers will see it (photos, rooms, amenities, policies, location, price), booking turned off, and a bar with its status, Edit and Submit for approval. Next: Submit for approval." },
      { lane: "business", act: press("Submit for approval"), label: "Business · Submission & feedback: Submitted, waiting for review, with Withdraw to make changes." },
      { lane: "system", label: "A submission is saved with a copy of the listing as submitted; admins are notified. Approval publishes exactly this copy." },
      { lane: "admin", act: go("/admin/listings"), label: "Admin · Listing reviews (Submitted): Kidepo Ridge Lodge with its cover photo, business and submission status. Next: open it." },
      { lane: "admin", act: open("/admin/listings/", "Kidepo Ridge"), label: "Admin · Review listing: every photo (cover, gallery, each room) and the business's documents, then all listing details. The decision panel's photo and evidence checks are locked: Open the remaining photos first. Next: open the cover photo." },
      { lane: "admin", act: async (p) => photoTiles(p).first().click(), label: "Photo viewer: the photo full size, with arrows through every photo of the listing. Opening a photo marks it Viewed. Next: close and open the rest." },
      { lane: "admin", act: seq(async (p) => p.keyboard.press("Escape"), viewAll(photoTiles, 1), top), label: "Every photo Viewed (progress full); the photo check is now unlocked. Next: open the documents." },
      { lane: "admin", act: async (p) => docButtons(p).first().click(), label: "Document viewer: the business's certificate shown inside the page, with Open in new tab. Next: close and open the others." },
      { lane: "admin", act: seq(async (p) => p.keyboard.press("Escape"), viewAll(docButtons, 1), top), label: "Every document Opened; all four approval checks are now available. Next: Mark as under review." },
      { lane: "admin", act: press("Mark as under review"), label: "Under review: the business sees someone is checking its listing. Next: ask for changes." },
      { lane: "admin", act: notes("The second gallery photo is blurry. Please replace it, and add the airstrip transfer price to the description."), label: "Reasons written; they are sent to the business. Next: Request changes." },
      { lane: "admin", act: press("Request changes"), label: "Needs changes: the decision and reasons are recorded on the submission." },
      { lane: "system", label: "Owners and managers are notified: Listing: needs changes, with the reasons. The listing stays a draft." },
      { lane: "business", act: go("/business/verification"), label: "Business · Verification outcomes: Kidepo Ridge Lodge Needs changes, with the feedback and Edit and resubmit. Next: edit." },
      { lane: "business", act: go(`${LISTING}/edit`), label: "Business · Edit listing: where the business replaces photos and updates the description. Next: save, then submit again from Submission & feedback." },
      { lane: "business", act: go(`${LISTING}/review`), label: "Business · Submission & feedback: the admin's reasons, the submission history and Submit listing and photos for approval. Next: submit again." },
      { lane: "business", act: press("Submit listing and photos for approval"), label: "Resubmitted: a new submission is Submitted; the earlier one keeps its feedback." },
      { lane: "admin", act: seq(go("/admin/listings"), open("/admin/listings/", "Kidepo Ridge"), viewAll(photoTiles), viewAll(docButtons), tick("photos", "accuracy", "pricing", "policies"), notes("Gallery photo replaced. Details, prices and cancellation terms are clear."), top), label: "Admin · Review listing (new submission): every photo and document opened, all four checks ticked and approval notes written. Next: Approve and publish." },
      { lane: "admin", act: async (p) => p.getByRole("button", { name: "Approve and publish" }).first().click(), label: "Approve and publish? The listing goes live and can be booked straight away; the notes are shown. Next: Approve and publish." },
      { lane: "admin", act: confirm("Approve and publish"), label: "Approved: the listing is published." },
      { lane: "system", label: "The listing is Published from the submitted copy; owners and managers are notified; the decision and the ticked checks go to the audit trail." },
      { lane: "business", act: go("/business/verification"), label: "Business · Verification outcomes: Kidepo Ridge Lodge Live, with View live listing." },
      { lane: "customer", act: go(`/accommodation/${KIDEPO.listing}`), label: "Customer · Listing page: Kidepo Ridge Lodge is live on the marketplace." },
    ],
  },
  {
    id: "listing-withdraw-reject",
    fixture: "draftListing",
    title: "A listing is withdrawn, resubmitted and rejected",
    summary:
      "Kidepo Ridge Lodge submits its listing, withdraws it to make a change, and submits again. The admin rejects it with reasons; the business sees the rejection and can submit again after fixing it.",
    steps: [
      { lane: "business", act: go(`${LISTING}/review`), label: "Business · Submission & feedback: not submitted yet, with Preview and Submit listing and photos for approval. Next: submit." },
      { lane: "business", act: press("Submit listing and photos for approval"), label: "Submitted, with Withdraw to make changes. Next: withdraw." },
      { lane: "business", act: press("Withdraw to make changes"), label: "Withdrawn: the submission leaves the admin queue and the listing can be edited and submitted again. Next: submit again." },
      { lane: "business", act: press("Submit listing and photos for approval"), label: "Submitted again." },
      { lane: "admin", act: seq(go("/admin/listings"), open("/admin/listings/", "Kidepo Ridge"), notes("Kidepo Ridge Lodge's operating licence covers camping only, not lodge rooms. Update the licence before listing rooms.")), label: "Admin · Review listing: reasons written. Rejecting doesn't need the checks. Next: Reject." },
      { lane: "admin", act: async (p) => p.getByRole("button", { name: "Reject" }).first().click(), label: "Reject this listing? It will not be published and the business will see the reasons shown. Next: Reject listing." },
      { lane: "admin", act: confirm("Reject listing"), label: "Rejected: the decision and reasons are recorded." },
      { lane: "business", act: go("/business/verification"), label: "Business · Verification outcomes: Kidepo Ridge Lodge Rejected, with the reasons." },
      { lane: "business", act: go(`${LISTING}/review`), label: "Business · Submission & feedback: the rejection and full history (withdrawn, rejected). The listing stays a draft and can be submitted again." },
    ],
  },
  {
    id: "customer-review",
    fixture: "completedStay",
    title: "A customer rates and reviews a stay; the business replies; admins moderate",
    summary:
      "Grace's stay at Kidepo Ridge Lodge is complete. She opens the booking, writes a review (too short at first, so the form says what's missing), and it appears on the listing straight away. The lodge replies from the business portal, and admins can flag or hide it.",
    steps: [
      {
        lane: "customer",
        act: async (p) => {
          await p.goto(BASE + "/bookings/journey-kidepo-stay", { timeout: 180000 });
          // The demo sign-in sometimes hasn't settled yet: finish it from the sign-in page.
          if (/sign-in/.test(p.url())) {
            await p.getByRole("button", { name: "Continue as customer" }).click();
            await p.waitForURL(/\/bookings\/journey-kidepo-stay/, { timeout: 120000 });
          }
        },
        label: "Customer · My booking: Completed, with Write a review. Next: Write a review." },
      { lane: "customer", act: async (p) => p.getByRole("link", { name: "Write a review" }).click(), label: "Write a review: the stay summary, a 1 to 5 star rating, optional title, the review (20 to 2,000 characters) and the posting guidelines. Next: try to submit with too little." },
      { lane: "customer", act: seq(async (p) => p.locator("#body").fill("Lovely place."), async (p) => p.getByRole("button", { name: "Submit review" }).click()), label: "Not sent: the form asks for a star rating and at least 20 characters, and keeps what was typed. Next: complete it." },
      { lane: "customer", act: seq(async (p) => p.getByRole("radio", { name: "5 stars" }).click(), async (p) => p.locator("#title").fill("Sunrise over the Narus valley"), async (p) => p.locator("#body").fill("The cottage veranda looks straight over the valley. Our guide found lions on the first morning drive, and the staff packed breakfast for the road.")), label: "Five stars, a title and the review written, with the character count. Next: Submit review." },
      { lane: "customer", act: press("Submit review"), label: "Customer · My booking: Reviewed. The review is published straight away." },
      { lane: "customer", act: go(`/accommodation/${KIDEPO.listing}`), label: "Customer · Listing page: the new review and rating appear on the listing." },
      { lane: "business", act: go("/business/reviews"), label: "Business · Reviews: Grace's five-star review with a reply box. Next: reply." },
      { lane: "business", act: seq(async (p) => p.locator("textarea[name=businessReplyBody]").first().fill("Thank you, Grace! We're glad the lions showed up for you. Come back in the green season."), press("Post reply")), label: "The reply is posted and shown under the review, on the listing too." },
      { lane: "admin", act: go("/admin/reviews"), label: "Admin · Reviews: the review is Published, with Flag and Hide. Next: Hide." },
      { lane: "admin", act: async (p) => p.getByRole("button", { name: /^Hide review by/ }).first().click(), label: "Hide this review? It would leave the listing and its rating until published again. Cancel keeps it published." },
    ],
  },
  {
    id: "admin-business-listings",
    fixture: "completedStay",
    title: "An admin looks through a business's listings",
    summary: "From a business's page an admin opens any of its listings to see it as travellers do, every saved field, its bookings, rating and review history.",
    steps: [
      { lane: "admin", act: go("/admin/businesses"), label: "Admin · Businesses: every business with verification status. Next: open Kidepo Ridge Lodge." },
      { lane: "admin", act: go(`/admin/businesses/${KIDEPO.business}`), label: "Admin · Business: profile, verification, team and Listings, each row with photo, city, price, bookings, status and its latest review. Next: open Kidepo Ridge Lodge." },
      { lane: "admin", act: open(`/admin/businesses/${KIDEPO.business}/listings/`, KIDEPO.title), label: "Admin · Listing: base price, confirmed bookings, rating and publish date; the listing as travellers see it; and the review history. Next: All fields." },
      { lane: "admin", act: async (p) => p.getByRole("tab", { name: "All fields" }).click(), label: "All fields: every saved field of the listing, rooms included." },
      { lane: "admin", act: open("/admin/listings/", "Submitted"), label: "Admin · Review listing: the approved submission that published it, with the decision, notes and the checks recorded." },
    ],
  },
];

const JOURNEYS = [
  {
    id: "booking-loop",
    title: "A customer books a stay, the business accepts and the customer pays",
    summary:
      "Grace finds a lodge on the customer website, picks a room and dates, and sends a booking request with her traveller details. The lodge accepts it in the business portal, which asks her to pay; she pays with mobile money (simulated) and the booking is confirmed. Operations sees the payment in the admin portal, where it waits to be settled to the business.",
    steps: [
      { lane: "customer", act: seq(go("/accommodation"), async (p) => p.reload()), label: "Accommodation: verified stays with location, rating, availability and price per night. Next: open Murchison River Lodge." },
      { lane: "customer", act: go("/accommodation/demo-lodge"), label: "Listing page: photos, rooms with price and cancellation terms, amenities, policies and reviews. Next: Reserve a room." },
      { lane: "customer", act: button("Reserve"), label: "Reserve selects that room in the booking panel beside the listing: room type, guests, an availability calendar (booked nights are disabled) and add-ons. Next: choose check-in and check-out." },
      {
        lane: "customer",
        label: "Dates chosen: the panel shows the stay and total, with Add to cart, Save to favourites and Continue to checkout. Next: Continue to checkout.",
        // Check-in and check-out on two consecutive free days, from two months ahead.
        act: async (p) => {
          for (let month = 0; month < 14; month++) {
            await p.getByRole("button", { name: "Next month" }).first().click();
            await p.waitForTimeout(400);
            if (month < 1) continue;
            const days = await p.locator("main button[aria-label]:not([disabled])").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")).filter((l) => /^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(l)));
            const t = days.map((d) => Date.parse(d));
            const i = t.findIndex((x, k) => k + 1 < t.length && t[k + 1] - x === 86400000);
            if (i < 0) continue;
            await p.getByRole("button", { name: days[i], exact: true }).click();
            await p.getByRole("button", { name: days[i + 1], exact: true }).click();
            await p.getByRole("button", { name: "Continue to checkout" }).first().scrollIntoViewIfNeeded();
            return;
          }
          throw new Error("No two consecutive free nights in the next 14 months");
        },
      },
      {
        lane: "customer",
        label: "Checkout · Complete your booking: special requests and traveller details (prefilled from the profile; phone required), with the estimated total. Next: Continue to payment.",
        act: async (p) => {
          // The panel sometimes swallows the first click while it re-renders: try twice.
          for (let tries = 0; tries < 2 && !/\/checkout/.test(p.url()); tries++) {
            await p.getByRole("button", { name: "Continue to checkout" }).first().click();
            await p.waitForURL(/\/checkout/, { timeout: 30000 }).catch(() => undefined);
          }
          if (!/\/checkout/.test(p.url())) throw new Error("Checkout did not open");
          await settle(p);
          await p.locator("main input[type=tel]:visible").first().fill("+256772123456");
        },
      },
      {
        lane: "customer",
        label: "Booking status: the request is sent and awaits the business (with a response deadline). No payment is taken yet. Next: the business responds.",
        act: async (p, c) => {
          await button("Continue to payment")(p);
          await p.waitForURL(/\/payments/, { timeout: 120000 });
          await settle(p);
          c.vars.ref = (await p.locator("main").innerText()).match(/BK-[A-Z0-9]+/)[0];
        },
      },
      { lane: "system", label: "Booking created as Awaiting confirmation; the business is notified and has until the response deadline to accept or decline." },
      { lane: "business", act: go("/business/bookings"), label: (c) => `Business · Bookings: ${c.vars.ref} is listed as Awaiting confirmation, payment Not started. Next: open it.` },
      {
        lane: "business",
        label: "Business · Booking page: dates, room, traveller and customer details, the response deadline, Accept request — ask customer to pay, and Decline booking. Next: accept.",
        act: async (p, c) => {
          c.vars.business = await bookingHref("/business/bookings/")(p, c);
          await p.goto(BASE + c.vars.business, { timeout: 180000 });
        },
      },
      { lane: "business", act: button(/Accept request/), label: "Business · Accepted: the booking now shows Payment required with a payment deadline; the customer is asked to pay." },
      { lane: "customer", act: go((c) => c.vars.business.replace("/business", "")), label: "Customer · My booking: Payment required, the outstanding amount, Complete payment and Cancel booking. Next: Complete payment." },
      {
        lane: "customer",
        label: "Complete payment: MTN Mobile Money, Airtel Money, Visa / Mastercard or international card, an optional number for the prompt preview, the simulation result and the total due. MTN and Payment succeeds are selected. Next: Pay.",
        act: async (p) => {
          await link("Continue to payment")(p);
          await settle(p);
          await p.locator("input[name=method][value=mtn]").check({ force: true });
          await p.locator("select[name=outcome]").selectOption("success");
        },
      },
      {
        lane: "customer",
        label: "Payment successful: confirmation with a DEMO- payment reference; the booking is confirmed.",
        act: async (p) => {
          await p.getByRole("button", { name: /^Pay UGX/ }).click();
          await p.waitForURL((u) => !/\/payments$/.test(u.pathname) || u.search.includes("status"), { timeout: 120000 }).catch(() => undefined);
          await p.waitForTimeout(3000);
          await p.evaluate(() => window.scrollTo(0, 0));
        },
      },
      { lane: "system", label: "Payment recorded as Successful; the booking moves to Confirmed and the business's share becomes unsettled earnings." },
      { lane: "customer", act: go((c) => c.vars.business.replace("/business", "")), label: "Customer · My booking: confirmed and paid, with the payment in Payments & refunds." },
      { lane: "business", act: go((c) => c.vars.business), label: "Business · Booking page: confirmed and paid; refunds can be issued from Payments & refunds." },
      { lane: "admin", act: go("/admin/payments"), label: "Admin · Payments, refunds & payouts: the new payment at the top, and Settle payouts for eligible payments to verified businesses." },
      {
        lane: "admin",
        label: (c) => `Admin · Booking page for ${c.vars.ref}: customer, business, dates, traveller details, status, and the payment with its DEMO- reference.`,
        act: async (p, c) => {
          await p.goto(BASE + "/admin/bookings", { timeout: 180000 });
          await settle(p);
          const href = await bookingHref("/admin/bookings/")(p, c);
          if (href) await p.goto(BASE + href, { timeout: 180000 });
        },
      },
    ],
  },
  ...VERIFICATION_JOURNEYS,
  ...OUTCOME_JOURNEYS,
];

async function run(j) {
  const ctx = { vars: {} };
  const pages = {};
  if (j.fixture) await setup[j.fixture]();
  const page = async (lane) => {
    if (!pages[lane]) {
      const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });
      // Journeys on the Kidepo fixture show that business in the business portal.
      if (j.fixture) await context.addCookies(kidepoCookie(BASE));
      pages[lane] = await signIn(context, lane, { guides: Boolean(j.guides) });
    }
    return pages[lane];
  };
  const steps = [];
  let n = 0;
  for (const st of j.steps) {
    const label = typeof st.label === "function" ? st.label(ctx) : st.label;
    try {
      if (st.lane === "system") {
        steps.push({ lane: "system", label });
      } else {
        const p = await page(st.lane);
        if (st.act) await st.act(p, ctx);
        await settle(p);
        const id = `j-${j.id}-${String(++n).padStart(2, "0")}`;
        const tree = await snap(p, false);
        writeFileSync(out + id + ".json", JSON.stringify({ id, ...tree }));
        if (process.env.CAPTURE_SHOTS) await p.screenshot({ path: process.env.CAPTURE_SHOTS + "/" + id + ".png" });
        steps.push({ lane: st.lane, label: typeof st.label === "function" ? st.label(ctx) : label, screen: id, route: new URL(p.url()).pathname });
      }
      console.log("  ✓", j.id, steps.length, steps[steps.length - 1].label.slice(0, 90));
    } catch (e) {
      console.log("  ✗", j.id, "step", steps.length + 1, `"${label.slice(0, 60)}"`, String(e.message || e).split("\n").slice(0, 8).join(" | "));
      break;
    }
  }
  for (const p of Object.values(pages)) await p.context().close();
  return { id: "j-" + j.id, title: j.title, summary: j.summary, steps, complete: steps.length === j.steps.length };
}

const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
const file = HANDOFF + "journeys/journeys.json";
const prev = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
const result = [];
let failed = false;
try {
  for (const j of JOURNEYS) {
    const old = prev.find((x) => x.id === "j-" + j.id);
    if (only && !only.has(j.id)) {
      if (old) result.push(old);
      continue;
    }
    console.log("▶", j.title);
    const r = await run(j);
    // A journey that stopped early keeps its last complete version in Figma.
    if (r.complete || !old) result.push(r);
    else {
      failed = true;
      result.push(old);
      console.log(`  ! stopped at step ${r.steps.length + 1}; keeping the previous complete version.`);
    }
    if (!r.complete) failed = true;
  }
} finally {
  // The Kidepo fixture is only for the journeys: remove it so other captures never see it.
  await cleanup();
  await disconnect();
}
writeFileSync(file, JSON.stringify(result.map(({ complete, ...r }) => r), null, 1));
await browser.close();
if (failed) process.exitCode = 1;
