// Demo records the verification journeys act on: "Kidepo Ridge Lodge", a business owned
// by the demo business account, with one accommodation listing. Each journey puts it
// into the state it starts from, and cleanup() deletes it after the run, so replaying the
// journeys never changes the rest of the demo data (admin notifications about it are
// removed too; audit log entries stay, as they would in production).
import { PrismaClient } from "@prisma/client";
import { mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { APP } from "./config.mjs";

const db = new PrismaClient();
const DOCS = process.env.PRIVATE_DOCUMENT_DIRECTORY || path.join(APP, ".private", "verification");

export const KIDEPO = { business: "journey-kidepo", listing: "journey-kidepo-lodge", name: "Kidepo Ridge Lodge", title: "Kidepo Ridge Lodge" };
// Lets the business lane open Kidepo instead of the account's first business.
export const kidepoCookie = (base) => [{ name: "active_business", value: KIDEPO.business, url: base }];

const PHOTOS = [
  "https://images.unsplash.com/photo-1781039869379-5561fe260d26?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1744534637336-6110864236fc?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1741529460022-29bcb9eb29d7?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1760186270637-5733a4148d9c?w=1200&q=80&auto=format&fit=crop",
];

/** A one-page PDF with a heading and lines of text, standing in for a scanned document. */
export function pdf(title, lines = []) {
  const esc = (s) => s.replace(/[\\()]/g, (c) => "\\" + c);
  const text = [`BT /F1 22 Tf 60 770 Td (${esc(title)}) Tj ET`, ...lines.map((l, i) => `BT /F1 12 Tf 60 ${730 - i * 20} Td (${esc(l)}) Tj ET`)].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const at = Buffer.byteLength(out);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return at;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out);
}

const EVIDENCE = [
  ["INCORPORATION", "Certificate of Incorporation", ["Kidepo Ridge Lodge Ltd", "Registration number 80020001234567", "Uganda Registration Services Bureau", "Demo document generated for the design capture."]],
  ["LICENSES", "Tourism Operating Licence", ["Kidepo Ridge Lodge", "Uganda Tourism Board, accommodation class B", "Valid to 31 December 2027", "Demo document generated for the design capture."]],
  ["IDENTITY", "Director identification", ["Director: Akello Grace", "National ID CM900123456789", "Demo document generated for the design capture."]],
];

async function profile(status) {
  const owner = await db.user.findUniqueOrThrow({ where: { email: "business@dev.test" } });
  await db.businessProfile.create({
    data: {
      id: KIDEPO.business,
      name: KIDEPO.name,
      slug: "journey-kidepo-ridge-lodge",
      type: "Accommodation",
      description: "A small family-run lodge on the ridge above Kidepo Valley National Park, with eight stone cottages and guided game drives.",
      contactName: "Akello Grace",
      contactRole: "Director",
      contactEmail: "stay@kidepo-ridge.example",
      contactPhone: "+256772000111",
      registrationNumber: "80020001234567",
      address: "Apoka, Kidepo Valley National Park",
      city: "Kaabong",
      country: "Uganda",
      coverImageUrl: PHOTOS[0],
      verificationStatus: status,
      users: { create: { userId: owner.id, role: "OWNER" } },
    },
  });
}

async function listing() {
  await db.listing.create({
    data: {
      id: KIDEPO.listing,
      businessId: KIDEPO.business,
      type: "ACCOMMODATION",
      title: KIDEPO.title,
      slug: "journey-kidepo-ridge-lodge-cottages",
      city: "Kaabong",
      address: "Apoka, Kidepo Valley National Park",
      locationDirections: "Follow the Kotido–Kaabong road to the park gate; the lodge is signposted 4 km past Apoka.",
      description: "Stone cottages on the ridge above Kidepo Valley, looking out over the Narus plains. Each cottage has a private veranda, and game drives leave from the lodge at sunrise.",
      basePriceMinor: 380000,
      status: "DRAFT",
      bookingMode: "REQUEST",
      coverImageUrl: PHOTOS[0],
      images: PHOTOS,
      accommodation: {
        create: {
          propertyType: "Safari lodge",
          amenities: ["Breakfast included", "Game drives", "Solar power", "Airstrip transfers"],
          checkInTime: "14:00",
          checkOutTime: "10:00",
          maxGuests: 3,
          cancellationPolicy: "Free cancellation up to 7 days before check-in. 50% refund up to 48 hours before.",
          roomTypes: {
            create: [
              { name: "Ridge Cottage", description: "Stone cottage with a double bed and a veranda over the valley.", priceMinor: 380000, maxOccupancy: 2, bedType: "Double", breakfastIncluded: true, totalRooms: 6, images: [PHOTOS[1], PHOTOS[2]] },
              { name: "Family Cottage", description: "Two bedrooms sharing a veranda; sleeps three.", priceMinor: 560000, maxOccupancy: 3, bedType: "Double and single", breakfastIncluded: true, totalRooms: 2, images: [PHOTOS[3]] },
            ],
          },
        },
      },
    },
  });
}

/** Approved business evidence: three real PDFs the admin can open inline. */
async function evidence() {
  mkdirSync(DOCS, { recursive: true, mode: 0o700 });
  const documents = EVIDENCE.map(([type, title, lines], i) => {
    const name = `6b1d0e90-0000-4000-8000-00000000000${i + 1}.pdf`;
    writeFileSync(path.join(DOCS, name), pdf(title, lines), { mode: 0o600 });
    return { type, fileUrl: `/api/documents/${name}` };
  });
  await db.businessVerification.create({
    data: { businessId: KIDEPO.business, status: "APPROVED", reviewNotes: "Registration, licence and director ID checked.", reviewedAt: new Date(), documents: { create: documents } },
  });
}

/** Deletes Kidepo, everything under it, its uploaded files and the notifications about it. */
export async function cleanup() {
  const docs = await db.businessDocument.findMany({ where: { verification: { businessId: KIDEPO.business } }, select: { fileUrl: true } });
  for (const { fileUrl } of docs) {
    if (fileUrl.startsWith("/api/documents/")) {
      try {
        unlinkSync(path.join(DOCS, fileUrl.slice("/api/documents/".length)));
      } catch {}
    }
  }
  await undoPayouts();
  await undoCartOrder();
  const bookings = await db.booking.findMany({ where: { OR: [{ businessId: KIDEPO.business }, { orderId: OUTCOME.order }] }, select: { id: true } });
  const ids = bookings.map((b) => b.id);
  await db.review.deleteMany({ where: { OR: [{ businessId: KIDEPO.business }, { bookingId: { in: ids } }] } });
  await db.notification.deleteMany({ where: { OR: [{ title: { contains: "Kidepo Ridge" } }, { body: { contains: "Kidepo Ridge" } }, { relatedBookingId: { in: ids } }] } });
  await db.supportCase.deleteMany({ where: { relatedBookingId: { in: ids } } });
  await db.booking.deleteMany({ where: { id: { in: ids } } });
  await db.order.deleteMany({ where: { id: OUTCOME.order } });
  await db.listing.deleteMany({ where: { businessId: KIDEPO.business } });
  await db.businessVerification.deleteMany({ where: { businessId: KIDEPO.business } });
  await db.payout.deleteMany({ where: { businessId: KIDEPO.business } });
  await db.businessProfile.deleteMany({ where: { id: KIDEPO.business } });
}

/** Kidepo bookings the booking and payment outcome journeys act on. */
export const OUTCOME = {
  request: "jk-request", unpaid: "jk-unpaid", retry: "jk-retry", paidBusiness: "jk-paid-b", paidCustomer: "jk-paid-c",
  lateRequest: "jk-late-req", latePayment: "jk-late-pay", pending: "jk-pending", partial: "jk-partial", declineRefund: "jk-refund-no",
  order: "jk-order", orderStay: "jk-order-stay", orderTour: "jk-order-tour", payout: "jk-payout",
  liveRefund: "jk-live-refund", failedPayout: "jk-payout-failed",
};

// The cart journey places a real order on two seed listings (Murchison River Lodge and the
// 3-Day Wildlife Safari). Their availability is saved first and put back afterwards, and the
// order and its bookings are deleted.
const CART_LISTINGS = ["demo-lodge", "demo-safari"];
let cartSince = null;
let cartAvailability = [];
async function undoCartOrder() {
  if (!cartSince) return;
  const customer = await db.user.findUniqueOrThrow({ where: { email: "customer@safarinexa.test" } });
  const orders = await db.order.findMany({ where: { customerId: customer.id, createdAt: { gte: cartSince } }, select: { id: true } });
  const orderIds = orders.map((o) => o.id);
  const bookings = await db.booking.findMany({ where: { OR: [{ orderId: { in: orderIds } }, { customerId: customer.id, listingId: { in: CART_LISTINGS }, createdAt: { gte: cartSince } }] }, select: { id: true } });
  const ids = bookings.map((b) => b.id);
  await db.notification.deleteMany({ where: { relatedBookingId: { in: ids } } });
  await db.supportCase.deleteMany({ where: { relatedBookingId: { in: ids } } });
  await db.messageThread.deleteMany({ where: { bookingId: { in: ids } } });
  await db.booking.deleteMany({ where: { id: { in: ids } } });
  await db.order.deleteMany({ where: { id: { in: orderIds } } });
  const kept = new Set(cartAvailability.map((a) => a.id));
  for (const a of cartAvailability) await db.availability.update({ where: { id: a.id }, data: { remaining: a.remaining } }).catch(() => undefined);
  const added = await db.availability.findMany({ where: { listingId: { in: CART_LISTINGS }, createdAt: { gte: cartSince } }, select: { id: true } });
  await db.availability.deleteMany({ where: { id: { in: added.map((a) => a.id).filter((id) => !kept.has(id)) } } });
  cartSince = null;
  cartAvailability = [];
}

// Payouts the payout journey settles. Settling covers every eligible demo payment, so
// the run undoes it: those payouts are deleted and their payments marked unsettled again.
let payoutsSince = null;
async function undoPayouts() {
  if (!payoutsSince) return;
  const payouts = await db.payout.findMany({ where: { createdAt: { gte: payoutsSince } }, select: { id: true } });
  const ids = payouts.map((p) => p.id);
  await db.payment.updateMany({ where: { payoutId: { in: ids } }, data: { payoutId: null } });
  await db.notification.deleteMany({ where: { title: "Payout completed", createdAt: { gte: payoutsSince } } });
  await db.payout.deleteMany({ where: { id: { in: ids } } });
  payoutsSince = null;
}

/** What the scheduled expiry job (POST /api/jobs/expire-bookings) does to an unpaid
 * booking or unanswered request past its deadline. The job needs CRON_SECRET, which
 * local capture runs don't set, so the journey applies the same change directly.
 * (Fixture bookings hold no availability, so there is none to release.) */
export async function expireBooking(id) {
  const b = await db.booking.findUniqueOrThrow({ where: { id } });
  const request = b.status === "AWAITING_BUSINESS_CONFIRMATION";
  await db.booking.update({ where: { id }, data: { status: "CANCELLED_BY_ADMIN", cancelledAt: new Date(), cancelReason: request ? "Business response deadline expired" : "Payment window expired" } });
  await db.notification.create({ data: { userId: b.customerId, type: "BOOKING_UPDATE", title: "Unpaid reservation expired", body: `Booking ${b.bookingRef} expired. No payment was confirmed. You can check availability and book again.`, relatedBookingId: id } });
}

/** Starting states, one per journey. */
export const setup = {
  // A brand-new business: nothing submitted yet.
  async newBusiness() {
    await cleanup();
    await profile("NOT_STARTED");
  },
  // A verified business with a complete draft listing that has never been submitted.
  async draftListing() {
    await cleanup();
    await profile("APPROVED");
    await evidence();
    await listing();
  },
  // The listing is live and the demo customer has stayed there (booking completed, not yet reviewed).
  async completedStay() {
    await setup.draftListing();
    await db.listing.update({ where: { id: KIDEPO.listing }, data: { status: "PUBLISHED", publishedAt: new Date(Date.now() - 30 * 86400000) } });
    const customer = await db.user.findUniqueOrThrow({ where: { email: "customer@safarinexa.test" } });
    const room = await db.roomType.findFirstOrThrow({ where: { accommodationId: KIDEPO.listing, name: "Ridge Cottage" } });
    const start = new Date(Date.now() - 12 * 86400000);
    const end = new Date(Date.now() - 10 * 86400000);
    await db.booking.create({
      data: {
        id: "journey-kidepo-stay",
        bookingRef: "BK-KIDEPO01",
        customerId: customer.id,
        listingId: KIDEPO.listing,
        businessId: KIDEPO.business,
        roomTypeId: room.id,
        roomTypeName: room.name,
        startDate: start,
        endDate: end,
        participantsCount: 2,
        totalMinor: 760000,
        status: "COMPLETED",
        confirmedAt: new Date(start.getTime() - 20 * 86400000),
        completedAt: end,
      },
    });
    // The approval that published it, so the listing has a review history.
    const row = await db.listing.findUniqueOrThrow({
      where: { id: KIDEPO.listing },
      include: { accommodation: { include: { roomTypes: { orderBy: { id: "asc" } }, addOns: { orderBy: { id: "asc" } } } }, tour: true, restaurant: true, transport: true, destination: true },
    });
    const { status, publishedAt, createdAt, updatedAt, draftForm, draftSnapshot, ...content } = row;
    void status, publishedAt, createdAt, updatedAt, draftForm, draftSnapshot;
    const admin = await db.user.findUniqueOrThrow({ where: { email: "admin@safarinexa.test" } });
    const owner = await db.user.findUniqueOrThrow({ where: { email: "business@dev.test" } });
    await db.listingSubmission.create({
      data: {
        listingId: KIDEPO.listing,
        submittedBy: owner.id,
        submittedAt: new Date(Date.now() - 32 * 86400000),
        snapshot: JSON.parse(JSON.stringify(content)),
        status: "APPROVED",
        notes: "Photos, room prices and cancellation terms checked against the operating licence.",
        reviewedBy: admin.id,
        reviewedAt: new Date(Date.now() - 30 * 86400000),
      },
    });
  },
};

// Screen fixtures ----------------------------------------------------------------
// Records the screen capture (run.mjs) needs so pages that take a record from the URL,
// or that are empty in the demo data, are captured with real content. Fixed ids, so
// setupScreens() replaces them and cleanupScreens() removes them after the run.
const SCREEN = { pay: "capture-pay", paid: "capture-paid", stay: "capture-stay", trip: "capture-trip", support: "capture-support", help: "capture-help" };

const LISTING_ROWS = [
  { id: "capture-table-stay", type: "ACCOMMODATION", title: "Lakeview Eco Cottages", city: "Entebbe", basePriceMinor: 280000 },
  { id: "capture-table-tour", type: "TOUR", title: "Crater Lakes Walking Tour", city: "Fort Portal", basePriceMinor: 95000 },
  { id: "capture-table-dining", type: "RESTAURANT", title: "Lakeside Kitchen", city: "Entebbe", basePriceMinor: 45000 },
  { id: "capture-table-ride", type: "TRANSPORT", title: "Private Entebbe Airport Transfer", city: "Entebbe", basePriceMinor: 120000 },
];

export async function cleanupListingTable() {
  await db.listing.deleteMany({ where: { id: { in: LISTING_ROWS.map(({ id }) => id) } } });
}

export async function setupListingTable() {
  await cleanupListingTable();
  const lodge = await db.listing.findUniqueOrThrow({ where: { id: "demo-lodge" }, select: { businessId: true } });
  await db.listing.createMany({
    data: LISTING_ROWS.map((row) => ({
      ...row,
      businessId: lodge.businessId,
      slug: row.id,
      description: row.title,
      status: "DRAFT",
      images: [],
    })),
  });
  return lodge.businessId;
}

/** Query strings for pages that need a record or token in the URL to show their real screen.
 * The token pages only check the token when the form is submitted. */
export const SCREEN_QUERY = {
  "/checkout": "?listingId=demo-lodge&type=accommodation",
  "/payments": `?bookingId=${SCREEN.pay}`,
  "/payments/receipt": `?bookingId=${SCREEN.paid}`,
  "/payments/success": `?bookingId=${SCREEN.paid}`,
  "/reviews/new": `?bookingId=${SCREEN.stay}`,
  "/auth/reset-password": "?token=capture-demo-token",
  "/business/auth/accept": "?token=capture-demo-token",
  "/admin/auth/accept": "?token=capture-demo-token",
};

/** One booking per status that changes what the customer, business or admin can do.
 * Captured on each portal's booking page as states of that page (run.mjs). */
const STATUS_VARIANTS = [
  { key: "awaiting", name: "Awaiting confirmation", id: "capture-st-awaiting", create: true },
  { key: "pending-payment", name: "Payment required", id: SCREEN.pay },
  { key: "payment-failed", name: "Payment failed", id: "capture-st-failed", create: true },
  { key: "confirmed", name: "Confirmed and paid", id: SCREEN.paid },
  { key: "refund-requested", name: "Cancelled, refund requested", id: "capture-st-refund", create: true },
  { key: "refunded", name: "Refunded", id: "capture-st-refunded", create: true },
  { key: "cancelled", name: "Cancelled by the customer", id: "capture-st-cancelled", create: true },
  { key: "declined", name: "Declined by the business", id: "capture-st-declined", create: true },
  { key: "completed", name: "Completed, ready to review", id: SCREEN.stay },
  { key: "reviewed", name: "Reviewed", id: "capture-st-reviewed", create: true },
  { key: "processing", name: "Payment waiting for the provider", id: "capture-st-processing", create: true },
  { key: "payment-overdue", name: "Payment window passed, not yet expired", id: "capture-st-overdue", create: true },
  { key: "payment-expired", name: "Expired: payment window passed", id: "capture-st-expired", create: true },
  { key: "request-overdue", name: "Response deadline passed, not yet expired", id: "capture-st-reqlate", create: true },
  { key: "request-expired", name: "Expired: no response from the business", id: "capture-st-reqexp", create: true },
  { key: "partially-refunded", name: "Confirmed, partially refunded", id: "capture-st-partial", create: true },
  { key: "refund-declined", name: "Cancelled, refund declined", id: "capture-st-refdecl", create: true },
  { key: "order", name: "Part of a combined order", id: "capture-st-order-a", create: true },
  { key: "refund-processing", name: "Refund sent, waiting for the provider", id: "capture-st-refproc", create: true },
];
/** Bookings that belong to the combined-order fixtures but aren't status variants. */
const ORDER_EXTRA = ["capture-st-order-b", "capture-order-wait-a", "capture-order-wait-b"];
const ORDERS = ["capture-order", "capture-order-wait"];
const variantsAt = (prefix) => STATUS_VARIANTS.map((v) => ({ suffix: "status-" + v.key, name: v.name, path: prefix + v.id }));
/** Extra captures of a dynamic page, one per record, as states of that page. */
export const SCREEN_VARIANTS = {
  "/bookings/[id]": variantsAt("/bookings/"),
  "/business/bookings/[id]": variantsAt("/business/bookings/"),
  "/admin/bookings/[id]": variantsAt("/admin/bookings/"),
  "/payments": [
    { suffix: "expired", name: "Payment window passed", path: "/payments?bookingId=capture-st-overdue" },
    { suffix: "order-waiting", name: "Combined order waiting for a business", path: "/payments?orderId=capture-order-wait" },
  ],
  "/payments/receipt": [{ suffix: "order", name: "Receipt for a combined order", path: "/payments/receipt?orderId=capture-order" }],
};

export async function cleanupScreens() {
  await db.supportCase.deleteMany({ where: { id: { in: [SCREEN.support, SCREEN.help] } } });
  await db.tripPlan.deleteMany({ where: { id: SCREEN.trip } });
  const ids = [SCREEN.pay, SCREEN.paid, SCREEN.stay, ...STATUS_VARIANTS.filter((v) => v.create).map((v) => v.id), ...ORDER_EXTRA];
  await removeBookings(ids);
  await db.order.deleteMany({ where: { id: { in: ORDERS } } });
}

/** Deletes bookings and the records that point at them. */
async function removeBookings(ids) {
  await db.review.deleteMany({ where: { bookingId: { in: ids } } });
  await db.notification.deleteMany({ where: { relatedBookingId: { in: ids } } });
  await db.supportCase.deleteMany({ where: { relatedBookingId: { in: ids } } });
  await db.booking.deleteMany({ where: { id: { in: ids } } });
}

export async function setupScreens() {
  await cleanupScreens();
  const customer = await db.user.findUniqueOrThrow({ where: { email: "customer@safarinexa.test" } });
  const owner = await db.user.findUniqueOrThrow({ where: { email: "business@dev.test" } });
  const admin = await db.user.findUniqueOrThrow({ where: { email: "admin@safarinexa.test" } });
  const lodge = await db.listing.findUniqueOrThrow({ where: { id: "demo-lodge" }, include: { accommodation: { include: { roomTypes: { orderBy: { priceMinor: "asc" } } } } } });
  const room = lodge.accommodation?.roomTypes[0];
  const day = 86400000;
  const now = Date.now();
  const booking = (id, ref, status, start, extra = {}) => ({
    id, bookingRef: ref, customerId: customer.id, listingId: lodge.id, businessId: lodge.businessId,
    roomTypeId: room?.id, roomTypeName: room?.name, startDate: new Date(start), endDate: new Date(start + 2 * day),
    participantsCount: 2, totalMinor: (room?.priceMinor ?? lodge.basePriceMinor) * 2, status, ...extra,
  });
  // Accepted by the lodge, waiting for the traveller to pay.
  await db.booking.create({ data: booking(SCREEN.pay, "BK-CAPPAY01", "PENDING_PAYMENT", now + 40 * day, { paymentDueAt: new Date(now + 2 * day), confirmedAt: null }) });
  // Paid and confirmed, with its successful payment.
  await db.booking.create({
    data: booking(SCREEN.paid, "BK-CAPPAID1", "CONFIRMED", now + 60 * day, {
      confirmedAt: new Date(now - day),
      payments: { create: { provider: "MTN_MOBILE_MONEY", status: "SUCCESSFUL", amountMinor: (room?.priceMinor ?? lodge.basePriceMinor) * 2, providerReference: "DEMO-CAPTURE01", completedAt: new Date(now - day) } },
    }),
  });
  // A finished stay that hasn't been reviewed yet.
  await db.booking.create({ data: booking(SCREEN.stay, "BK-CAPSTAY1", "COMPLETED", now - 14 * day, { confirmedAt: new Date(now - 30 * day), completedAt: new Date(now - 12 * day) }) });
  // A planned trip with a stay and two plans of the traveller's own.
  await db.tripPlan.create({
    data: {
      id: SCREEN.trip, userId: customer.id, title: "Murchison and the Nile, long weekend", notes: "Pack binoculars and a rain jacket.",
      startDate: new Date(now + 40 * day), endDate: new Date(now + 43 * day),
      items: { create: [
        { listingId: lodge.id, date: new Date(now + 40 * day), notes: "Two nights, river view", position: 0 },
        { customLabel: "Boat launch to the bottom of the falls", date: new Date(now + 41 * day), notes: "Morning departure", position: 1 },
        { customLabel: "Hike to the top of Murchison Falls", date: new Date(now + 42 * day), position: 2 },
      ] },
    },
  });
  // A business support case with a reply from SafariNexa support.
  await db.supportCase.create({
    data: {
      id: SCREEN.support, caseRef: "SUP-CAPTURE1", openedByUserId: owner.id, surface: "BUSINESS", subject: "Payout for October hasn't arrived",
      category: "Payments", status: "WAITING_ON_CUSTOMER",
      messages: { create: [
        { authorUserId: owner.id, authorRole: "BUSINESS", body: "Our October payout was due on the 5th but hasn't reached our account. Can you check?", createdAt: new Date(now - 2 * day) },
        { authorUserId: admin.id, authorRole: "ADMIN", body: "Thanks for flagging this. The payout was held because the bank account name doesn't match your registration. Please confirm the account name in Settings.", createdAt: new Date(now - day) },
      ] },
    },
  });
  // The other booking statuses (see STATUS_VARIANTS).
  const amount = (room?.priceMinor ?? lodge.basePriceMinor) * 2;
  const paid = (status, extra = {}) => ({ provider: "MTN_MOBILE_MONEY", status, amountMinor: amount, providerReference: "DEMO-CAPTURE-" + Math.random().toString(36).slice(2, 8).toUpperCase(), completedAt: new Date(now - 5 * day), ...extra });
  await db.booking.create({ data: booking("capture-st-awaiting", "BK-CAPAWAIT", "AWAITING_BUSINESS_CONFIRMATION", now + 50 * day, { responseDueAt: new Date(now + 20 * 3600000) }) });
  await db.booking.create({ data: booking("capture-st-failed", "BK-CAPFAIL1", "PAYMENT_FAILED", now + 45 * day, { paymentDueAt: new Date(now + day), payments: { create: { provider: "MTN_MOBILE_MONEY", status: "FAILED", amountMinor: amount, failureReason: "The mobile money payment was declined.", completedAt: new Date(now - 3600000) } } }) });
  const refundReq = await db.booking.create({ data: booking("capture-st-refund", "BK-CAPRFND1", "REFUND_REQUESTED", now + 55 * day, { confirmedAt: new Date(now - 10 * day), cancelledAt: new Date(now - day), cancelReason: "Cancelled by customer", payments: { create: paid("SUCCESSFUL") } }), include: { payments: true } });
  await db.refund.create({ data: { paymentId: refundReq.payments[0].id, bookingId: refundReq.id, amountMinor: amount, reason: "Customer cancellation", status: "REQUESTED", requestedByUserId: customer.id } });
  const refunded = await db.booking.create({ data: booking("capture-st-refunded", "BK-CAPRFND2", "REFUNDED", now + 35 * day, { confirmedAt: new Date(now - 20 * day), cancelledAt: new Date(now - 6 * day), cancelReason: "Declined by business", payments: { create: paid("REFUNDED") } }), include: { payments: true } });
  await db.refund.create({ data: { paymentId: refunded.payments[0].id, bookingId: refunded.id, amountMinor: amount, reason: "Business declined booking", status: "COMPLETED", requestedByUserId: owner.id, reviewedByAdminId: admin.id } });
  await db.booking.create({ data: booking("capture-st-cancelled", "BK-CAPCANC1", "CANCELLED_BY_CUSTOMER", now + 30 * day, { cancelledAt: new Date(now - 2 * day), cancelReason: "Cancelled by customer" }) });
  await db.booking.create({ data: booking("capture-st-declined", "BK-CAPDECL1", "CANCELLED_BY_BUSINESS", now + 32 * day, { cancelledAt: new Date(now - 3 * day), cancelReason: "Declined by business" }) });
  const reviewed = await db.booking.create({ data: booking("capture-st-reviewed", "BK-CAPREVW1", "REVIEWED", now - 40 * day, { confirmedAt: new Date(now - 60 * day), completedAt: new Date(now - 38 * day) }) });
  await db.review.create({ data: { bookingId: reviewed.id, authorUserId: customer.id, listingId: lodge.id, businessId: lodge.businessId, rating: 4, title: "Great base for the falls", body: "Comfortable room and a very helpful team. The boat trip they arranged was the highlight of our week." } });
  // Payment started but the provider hasn't confirmed it yet.
  await db.booking.create({ data: booking("capture-st-processing", "BK-CAPPROC1", "PAYMENT_PROCESSING", now + 48 * day, { paymentDueAt: new Date(now + day), payments: { create: { provider: "MTN_MOBILE_MONEY", status: "PENDING_PROVIDER_CONFIRMATION", amountMinor: amount, providerReference: "DEMO-CAPTURE-PEND01" } } }) });
  // Deadlines that have passed: before the expiry job runs, and after it has.
  await db.booking.create({ data: booking("capture-st-overdue", "BK-CAPLATE1", "PENDING_PAYMENT", now + 36 * day, { confirmedAt: null, paymentDueAt: new Date(now - 3600000) }) });
  await db.booking.create({ data: booking("capture-st-expired", "BK-CAPEXPD1", "CANCELLED_BY_ADMIN", now + 37 * day, { paymentDueAt: new Date(now - day), cancelledAt: new Date(now - day + 3600000), cancelReason: "Payment window expired" }) });
  await db.booking.create({ data: booking("capture-st-reqlate", "BK-CAPLATE2", "AWAITING_BUSINESS_CONFIRMATION", now + 38 * day, { bookingMode: "REQUEST", responseDueAt: new Date(now - 2 * 3600000) }) });
  await db.booking.create({ data: booking("capture-st-reqexp", "BK-CAPEXPD2", "CANCELLED_BY_ADMIN", now + 39 * day, { bookingMode: "REQUEST", responseDueAt: new Date(now - 2 * day), cancelledAt: new Date(now - 2 * day + 3600000), cancelReason: "Business response deadline expired" }) });
  // Paid, with part of the amount refunded.
  const partial = await db.booking.create({ data: booking("capture-st-partial", "BK-CAPPART1", "CONFIRMED", now + 58 * day, { confirmedAt: new Date(now - 9 * day), payments: { create: paid("PARTIALLY_REFUNDED") } }), include: { payments: true } });
  await db.refund.create({ data: { paymentId: partial.payments[0].id, bookingId: partial.id, amountMinor: Math.round(amount / 2), reason: "One night refunded: the river view room was unavailable", status: "COMPLETED", requestedByUserId: owner.id } });
  // Cancelled by the traveller after the free-cancellation window: the refund was declined.
  const declined = await db.booking.create({ data: booking("capture-st-refdecl", "BK-CAPRDEC1", "CANCELLED_BY_CUSTOMER", now + 3 * day, { confirmedAt: new Date(now - 25 * day), cancelledAt: new Date(now - 2 * day), cancelReason: "Cancelled by customer", payments: { create: paid("SUCCESSFUL") } }), include: { payments: true } });
  await db.refund.create({ data: { paymentId: declined.payments[0].id, bookingId: declined.id, amountMinor: amount, reason: "Customer cancellation", status: "REJECTED", requestedByUserId: customer.id, reviewedByAdminId: admin.id } });
  // A refund approved and sent, which the provider hasn't confirmed yet.
  const processing = await db.booking.create({ data: booking("capture-st-refproc", "BK-CAPRPRO1", "REFUND_PROCESSING", now + 44 * day, { confirmedAt: new Date(now - 12 * day), cancelledAt: new Date(now - 2 * day), cancelReason: "Cancelled by customer", payments: { create: paid("SUCCESSFUL") } }), include: { payments: true } });
  await db.refund.create({ data: { paymentId: processing.payments[0].id, bookingId: processing.id, amountMinor: amount, reason: "Customer cancellation", status: "PROCESSING", requestedByUserId: customer.id, reviewedByAdminId: admin.id } });
  // Combined orders: a stay and a tour from two businesses, paid once.
  const safari = await db.listing.findUniqueOrThrow({ where: { id: "demo-safari" } });
  const tour = (id, ref, status, start, extra = {}) => ({
    id, bookingRef: ref, customerId: customer.id, listingId: safari.id, businessId: safari.businessId, startDate: new Date(start), endDate: new Date(start + 3 * day),
    participantsCount: 2, totalMinor: safari.basePriceMinor * 2, status, ...extra,
  });
  const stayMinor = amount;
  const tourMinor = safari.basePriceMinor * 2;
  await db.order.create({ data: { id: "capture-order", customerId: customer.id, totalMinor: stayMinor + tourMinor, status: "CONFIRMED", payments: { create: { provider: "AIRTEL_MONEY", status: "SUCCESSFUL", amountMinor: stayMinor + tourMinor, providerReference: "DEMO-CAPTURE-ORDER1", completedAt: new Date(now - 2 * day) } } } });
  await db.booking.create({ data: booking("capture-st-order-a", "BK-CAPORD1A", "CONFIRMED", now + 70 * day, { orderId: "capture-order", bookingMode: "REQUEST", confirmedAt: new Date(now - 2 * day) }) });
  await db.booking.create({ data: tour("capture-st-order-b", "BK-CAPORD1B", "CONFIRMED", now + 72 * day, { orderId: "capture-order", bookingMode: "REQUEST", confirmedAt: new Date(now - 2 * day) }) });
  // An order still waiting for one of its businesses to accept.
  await db.order.create({ data: { id: "capture-order-wait", customerId: customer.id, totalMinor: stayMinor + tourMinor, status: "AWAITING_BUSINESS_CONFIRMATION" } });
  await db.booking.create({ data: booking("capture-order-wait-a", "BK-CAPORD2A", "AWAITING_BUSINESS_CONFIRMATION", now + 80 * day, { orderId: "capture-order-wait", bookingMode: "REQUEST", responseDueAt: new Date(now + 20 * 3600000) }) });
  await db.booking.create({ data: tour("capture-order-wait-b", "BK-CAPORD2B", "PENDING_PAYMENT", now + 82 * day, { orderId: "capture-order-wait", bookingMode: "REQUEST", paymentDueAt: new Date(now + 2 * day) }) });
  // A traveller's support case about a booking (newest, so it's the one captured).
  await db.supportCase.create({
    data: {
      id: SCREEN.help, caseRef: "SUP-CAPTURE2", openedByUserId: customer.id, surface: "CUSTOMER", subject: "Can I add a third guest to my stay?",
      category: "Bookings", status: "IN_PROGRESS", relatedBookingId: SCREEN.paid,
      messages: { create: [
        { authorUserId: customer.id, authorRole: "CUSTOMER", body: "We'd like to bring my sister along. Can the room take a third guest, and what would it cost?", createdAt: new Date(now - 3 * day) },
        { authorUserId: admin.id, authorRole: "ADMIN", body: "We've asked Murchison River Lodge. The Garden View Room sleeps two, but they can move you to a family room. We'll reply here with the price.", createdAt: new Date(now - 2 * day) },
      ] },
    },
  });
}

// The Kidepo listing live, with a booking in each state the outcome journeys start from.
setup.bookingOutcomes = async () => {
  await setup.completedStay();
  const customer = await db.user.findUniqueOrThrow({ where: { email: "customer@safarinexa.test" } });
  const room = await db.roomType.findFirstOrThrow({ where: { accommodationId: KIDEPO.listing, name: "Ridge Cottage" } });
  const day = 86400000;
  const now = Date.now();
  const make = (id, ref, status, inDays, extra = {}) =>
    db.booking.create({
      data: {
        id, bookingRef: ref, customerId: customer.id, listingId: KIDEPO.listing, businessId: KIDEPO.business, roomTypeId: room.id, roomTypeName: room.name,
        startDate: new Date(now + inDays * day), endDate: new Date(now + (inDays + 2) * day), participantsCount: 2, totalMinor: 760000, bookingMode: "REQUEST", status, ...extra,
      },
    });
  const paid = { confirmedAt: new Date(now - 4 * day), payments: { create: { provider: "MTN_MOBILE_MONEY", status: "SUCCESSFUL", amountMinor: 760000, providerReference: "DEMO-KIDEPO-PAID", completedAt: new Date(now - 4 * day) } } };
  await make(OUTCOME.request, "BK-KIDREQ01", "AWAITING_BUSINESS_CONFIRMATION", 30, { responseDueAt: new Date(now + 20 * 3600000) });
  await make(OUTCOME.unpaid, "BK-KIDUNP01", "PENDING_PAYMENT", 34, { paymentDueAt: new Date(now + day) });
  await make(OUTCOME.retry, "BK-KIDRTY01", "PENDING_PAYMENT", 38, { paymentDueAt: new Date(now + day) });
  await make(OUTCOME.paidBusiness, "BK-KIDPDB01", "CONFIRMED", 42, paid);
  await make(OUTCOME.paidCustomer, "BK-KIDPDC01", "CONFIRMED", 46, { ...paid, payments: { create: { ...paid.payments.create, providerReference: "DEMO-KIDEPO-PAID2" } } });
  const paidAs = (ref) => ({ ...paid, payments: { create: { ...paid.payments.create, providerReference: ref } } });
  // Deadlines that have passed, before the expiry job has run.
  await make(OUTCOME.lateRequest, "BK-KIDLATE1", "AWAITING_BUSINESS_CONFIRMATION", 50, { responseDueAt: new Date(now - 2 * 3600000) });
  await make(OUTCOME.latePayment, "BK-KIDLATE2", "PENDING_PAYMENT", 52, { paymentDueAt: new Date(now - 3600000) });
  // A mobile money payment the provider hasn't confirmed yet.
  await make(OUTCOME.pending, "BK-KIDPEND1", "PAYMENT_PROCESSING", 54, { paymentDueAt: new Date(now + day), payments: { create: { provider: "MTN_MOBILE_MONEY", status: "PENDING_PROVIDER_CONFIRMATION", amountMinor: 760000, providerReference: "DEMO-KIDEPO-PEND" } } });
  // Paid bookings for a partial refund and a declined refund.
  await make(OUTCOME.partial, "BK-KIDPART1", "CONFIRMED", 56, paidAs("DEMO-KIDEPO-PART"));
  await make(OUTCOME.declineRefund, "BK-KIDRNO01", "CONFIRMED", 58, paidAs("DEMO-KIDEPO-RNO"));
  // A combined order: a Kidepo stay still waiting for the lodge, and a tour Uganda Trails has accepted.
  const safari = await db.listing.findUniqueOrThrow({ where: { id: "demo-safari" } });
  await db.order.create({ data: { id: OUTCOME.order, customerId: customer.id, totalMinor: 760000 + safari.basePriceMinor * 2, status: "AWAITING_BUSINESS_CONFIRMATION" } });
  await make(OUTCOME.orderStay, "BK-KIDORD1A", "AWAITING_BUSINESS_CONFIRMATION", 60, { orderId: OUTCOME.order, responseDueAt: new Date(now + 20 * 3600000) });
  await db.booking.create({
    data: {
      id: OUTCOME.orderTour, bookingRef: "BK-KIDORD1B", orderId: OUTCOME.order, customerId: customer.id, listingId: safari.id, businessId: safari.businessId,
      startDate: new Date(now + 62 * day), endDate: new Date(now + 65 * day), participantsCount: 2, totalMinor: safari.basePriceMinor * 2, bookingMode: "REQUEST", status: "PENDING_PAYMENT", paymentDueAt: new Date(now + 2 * day),
    },
  });
};

// Kidepo live, with a paid booking whose payment came through a live mobile money
// provider (not a DEMO- reference), so a refund can't be sent from the portal, and a
// payout to the lodge that the bank rejected.
setup.providerFailures = async () => {
  await setup.completedStay();
  const customer = await db.user.findUniqueOrThrow({ where: { email: "customer@safarinexa.test" } });
  const room = await db.roomType.findFirstOrThrow({ where: { accommodationId: KIDEPO.listing, name: "Ridge Cottage" } });
  const day = 86400000;
  const now = Date.now();
  const base = { customerId: customer.id, listingId: KIDEPO.listing, businessId: KIDEPO.business, roomTypeId: room.id, roomTypeName: room.name, participantsCount: 2, totalMinor: 760000, bookingMode: "REQUEST" };
  await db.booking.create({
    data: {
      ...base, id: OUTCOME.liveRefund, bookingRef: "BK-KIDLIVE1", status: "CONFIRMED", startDate: new Date(now + 64 * day), endDate: new Date(now + 66 * day), confirmedAt: new Date(now - 5 * day),
      payments: { create: { provider: "MTN_MOBILE_MONEY", status: "SUCCESSFUL", amountMinor: 760000, providerReference: "MTN-7731904455", completedAt: new Date(now - 5 * day) } },
    },
  });
  const payout = await db.payout.create({ data: { businessId: KIDEPO.business, amountMinor: 668800, status: "FAILED", providerReference: "PAYOUT-KIDEPO-0001", notes: "The bank rejected the transfer: the account name doesn't match the registered business name." } });
  await db.booking.create({
    data: {
      ...base, id: OUTCOME.failedPayout, bookingRef: "BK-KIDPAYF1", status: "COMPLETED", startDate: new Date(now - 12 * day), endDate: new Date(now - 10 * day), confirmedAt: new Date(now - 30 * day), completedAt: new Date(now - 10 * day),
      payments: { create: { provider: "MTN_MOBILE_MONEY", status: "SUCCESSFUL", amountMinor: 760000, providerReference: "MTN-7731900021", completedAt: new Date(now - 30 * day), payoutId: payout.id } },
    },
  });
};

// Nothing to prepare beyond Kidepo's cleanup: the cart journey books two seed listings.
// Saves their availability so the run can put it back.
setup.cartOrder = async () => {
  await cleanup();
  cartSince = new Date();
  cartAvailability = await db.availability.findMany({ where: { listingId: { in: CART_LISTINGS } }, select: { id: true, remaining: true } });
};

// Kidepo live with a paid stay that hasn't been settled to the lodge yet.
setup.payout = async () => {
  await setup.completedStay();
  const customer = await db.user.findUniqueOrThrow({ where: { email: "customer@safarinexa.test" } });
  const room = await db.roomType.findFirstOrThrow({ where: { accommodationId: KIDEPO.listing, name: "Ridge Cottage" } });
  const day = 86400000;
  const now = Date.now();
  await db.booking.create({
    data: {
      id: OUTCOME.payout, bookingRef: "BK-KIDPAY01", customerId: customer.id, listingId: KIDEPO.listing, businessId: KIDEPO.business, roomTypeId: room.id, roomTypeName: room.name,
      startDate: new Date(now - 8 * day), endDate: new Date(now - 6 * day), participantsCount: 2, totalMinor: 760000, bookingMode: "REQUEST", status: "COMPLETED", confirmedAt: new Date(now - 20 * day), completedAt: new Date(now - 6 * day),
      payments: { create: { provider: "MTN_MOBILE_MONEY", status: "SUCCESSFUL", amountMinor: 760000, providerReference: "DEMO-KIDEPO-PAYOUT", completedAt: new Date(now - 20 * day) } },
    },
  });
  payoutsSince = new Date();
};

/** The bookings of an order, for journeys that act on each business's booking. */
export const orderBookings = (orderId) => db.booking.findMany({ where: { orderId }, select: { id: true, bookingRef: true, listingId: true, businessId: true, bookingMode: true, status: true } });

export const disconnect = () => db.$disconnect();
