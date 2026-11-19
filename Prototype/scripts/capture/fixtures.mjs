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
  const bookings = await db.booking.findMany({ where: { businessId: KIDEPO.business }, select: { id: true } });
  const ids = bookings.map((b) => b.id);
  await db.review.deleteMany({ where: { OR: [{ businessId: KIDEPO.business }, { bookingId: { in: ids } }] } });
  await db.notification.deleteMany({ where: { OR: [{ title: { contains: "Kidepo Ridge" } }, { body: { contains: "Kidepo Ridge" } }] } });
  await db.booking.deleteMany({ where: { id: { in: ids } } });
  await db.listing.deleteMany({ where: { businessId: KIDEPO.business } });
  await db.businessVerification.deleteMany({ where: { businessId: KIDEPO.business } });
  await db.businessProfile.deleteMany({ where: { id: KIDEPO.business } });
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

export const disconnect = () => db.$disconnect();
