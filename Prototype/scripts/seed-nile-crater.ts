import { loadEnvConfig } from "@next/env";
import { BookingStatus, PrismaClient, type PaymentStatus, type RefundStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PLATFORM_COMMISSION_RATE } from "../src/lib/revenue";

loadEnvConfig(process.cwd());
const db = new PrismaClient();
const DAY = 86400000;
const now = new Date();
const month = now.toISOString().slice(0, 7);
const prefix = `ncl-demo-${month}`;
const at = (days: number) => new Date(now.getTime() + days * DAY);
const names = ["Amina Nakato", "James Okello", "Sarah Atim", "Daniel Kato", "Grace Namusoke", "Peter Mugisha", "Esther Achieng", "David Ssemanda", "Ruth Nambasa", "Isaac Ouma", "Mariam Nansubuga", "Joseph Tumusiime", "Alice Akello", "Samuel Kintu", "Rebecca Nabirye", "Michael Otieno", "Joan Auma", "Paul Ssekandi", "Faith Wanjiku", "Brian Mutebi", "Diana Akech", "Emmanuel Ssentongo", "Hannah Njeri", "Thomas Byaruhanga", "Lydia Nankya", "Andrew Kamau", "Agnes Apio", "Patrick Ochieng", "Stella Namatovu", "Simon Mwesigwa", "Naomi Chebet", "Robert Wasswa", "Eva Nambatya", "Mark Odongo", "Clara Nalubega", "Henry Musoke"];
const properties = [
  ["Nile Sunrise Retreat", "Jinja", "Lodge"], ["Crater Rim Hideaway", "Fort Portal", "Boutique hotel"],
  ["Mabamba Wetland Cottages", "Entebbe", "Cottage"], ["Rwenzori Foothills Lodge", "Kasese", "Lodge"],
  ["Bunyonyi Island Villas", "Kabale", "Villa"], ["Kampala Garden Suites", "Kampala", "Apartment"],
  ["Kidepo Savannah Camp", "Kaabong", "Tented camp"], ["Sipi Falls Eco Cabins", "Kapchorwa", "Cabin"],
  ["Lake Mburo Acacia Lodge", "Mbarara", "Lodge"], ["Budongo Forest Haven", "Masindi", "Eco lodge"],
  ["Crater View Family Villas", "Fort Portal", "Villa"], ["Nile Riverside Glamping", "Jinja", "Tented camp"]
];
const photo = "https://images.unsplash.com/photo-1744534637336-6110864236fc?w=1200&q=80&auto=format&fit=crop";

async function main() {
  const url = new URL(process.env.SAFARINEXA_PRISMA_DATABASE_URL ?? "");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("Demo seed is restricted to a local database.");
  const business = await db.businessProfile.findUniqueOrThrow({ where: { slug: "nile-crater-lodges" } });
  const owner = await db.businessUser.findFirstOrThrow({ where: { businessId: business.id, role: "OWNER" } });
  const passwordHash = await bcrypt.hash("Passw0rd!", 10);
  const guests = [];
  for (let i = 0; i < names.length; i++) {
    guests.push(await db.user.upsert({ where: { email: `guest.${i + 1}@nilecrater.demo.test` }, update: {}, create: {
      name: names[i], email: `guest.${i + 1}@nilecrater.demo.test`, passwordHash, role: "CUSTOMER",
      customerProfile: { create: { nationality: ["Uganda", "Kenya", "Tanzania", "United Kingdom"][i % 4], preferences: { dietary: i % 3 === 0 ? "Vegetarian" : "No restrictions", demo: true } } }
    } }));
  }
  for (let i = 0; i < properties.length; i++) {
    const [title, city, propertyType] = properties[i];
    const id = `ncl-demo-property-${i + 1}`;
    const price = 180000 + i * 35000;
    await db.listing.upsert({ where: { id }, update: {}, create: {
      id, slug: id, businessId: business.id, type: "ACCOMMODATION", title, city,
      address: `${city}, Uganda`, description: `${title} is a fictional demonstration property operated by Nile & Crater Lodges. Enjoy private rooms, locally prepared breakfast, quiet gardens, and guided excursions. Family rooms and accessible ground-floor rooms are available on request.`,
      basePriceMinor: price, currency: "UGX", status: i === 10 ? "DRAFT" : i === 11 ? "ARCHIVED" : "PUBLISHED", bookingMode: i % 2 ? "REQUEST" : "INSTANT",
      publishedAt: i < 10 ? at(-120) : null, coverImageUrl: photo, images: [photo],
      accommodation: { create: { propertyType, amenities: ["Wi-Fi", "Free parking", "Restaurant", "Breakfast", "Garden", "Airport shuttle"], maxGuests: 6, checkInTime: "14:00", checkOutTime: "10:00", cancellationPolicy: "Free cancellation until 48 hours before check-in; later cancellations incur one night's charge.",
        roomTypes: { create: [
          { id: `${id}-standard`, name: "Garden Double", priceMinor: price, totalRooms: 8, maxOccupancy: 2, breakfastIncluded: true, images: [photo], roomFeatures: ["Private bathroom", "Garden view"], bedType: "1 Double Bed" },
          { id: `${id}-family`, name: "Family Suite", priceMinor: price * 2, totalRooms: 4, maxOccupancy: 4, breakfastIncluded: true, images: [photo], bedrooms: 2, bedType: "1 Double Bed and 2 Single Beds", roomFeatures: ["Private veranda", "Living area"] },
          { id: `${id}-premium`, name: "Panorama Suite", priceMinor: price * 3, totalRooms: 2, maxOccupancy: 2, images: [photo], roomFeatures: ["Balcony", "Panoramic view"] }
        ] }, addOns: { create: [ { id: `${id}-transfer`, name: "Airport transfer", description: "Private one-way transfer for up to four guests", priceMinor: 180000 }, { id: `${id}-dinner`, name: "Three-course dinner", priceMinor: 65000 } ] }
      } }
    } });
  }
  const listings = await db.listing.findMany({ where: { businessId: business.id, status: "PUBLISHED", type: "ACCOMMODATION" }, include: { accommodation: { include: { roomTypes: true, addOns: true } } }, orderBy: { id: "asc" } });
  if (!listings.length) throw new Error("No published accommodation listings found.");
  const statuses = Object.values(BookingStatus);
  const historical: BookingStatus[] = ["COMPLETED", "REVIEWED", "REVIEW_PENDING", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "REFUNDED"];
  const summary: Record<string, number> = {};
  // Six examples of every status this month, plus six months of settled history.
  for (let i = 0; i < 336; i++) {
    const current = i < 126;
    const status = current ? statuses[i % statuses.length] : historical[i % historical.length];
    const variant = Math.floor(i / statuses.length) % 2;
    const id = `${prefix}-booking-${i + 1}`;
    let createdAt = current ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1 + (Math.floor(i / statuses.length) % now.getUTCDate()), 0, i % 60)) : at(-5 - (i - 126) % 175);
    const listing = listings[i % listings.length];
    const room = listing.accommodation?.roomTypes[i % (listing.accommodation.roomTypes.length || 1)];
    const customer = guests[(i + Math.floor(i / 36)) % guests.length];
    const ended = ["COMPLETED", "REVIEW_PENDING", "REVIEWED", "SUPPORT_CASE_OPEN", "REFUND_REQUESTED", "REFUND_PROCESSING", "REFUNDED"].includes(status);
    const nights = current && ended ? 1 : 1 + i % 4;
    if (ended && createdAt.getTime() + (nights + 0.1) * DAY > now.getTime()) createdAt = at(-nights - 1);
    const startDate = ended ? new Date(createdAt.getTime() + 3600000) : at(1 + i % 45);
    const endDate = new Date(startDate.getTime() + nights * DAY);
    const addOn = i % 4 === 0 ? listing.accommodation?.addOns[0] : undefined;
    const totalMinor = (room?.priceMinor ?? listing.basePriceMinor) * nights + (addOn?.priceMinor ?? 0);
    let paymentStatus: PaymentStatus = "SUCCESSFUL";
    if (["DRAFT", "AUTH_REQUIRED", "PENDING_TRAVELLER_DETAILS", "AWAITING_BUSINESS_CONFIRMATION", "BOOKING_CREATED"].includes(status)) paymentStatus = "NOT_STARTED";
    if (status === "PENDING_PAYMENT") paymentStatus = "METHOD_SELECTED";
    if (status === "PAYMENT_PROCESSING") paymentStatus = variant ? "PROCESSING" : "PENDING_PROVIDER_CONFIRMATION";
    if (status === "PAYMENT_FAILED") paymentStatus = "FAILED";
    if (status.startsWith("CANCELLED")) paymentStatus = "CANCELLED";
    if (status === "REFUNDED") paymentStatus = variant ? "REFUNDED" : "PARTIALLY_REFUNDED";
    const paid = ["SUCCESSFUL", "REFUNDED", "PARTIALLY_REFUNDED"].includes(paymentStatus);
    const completedAt = paid ? new Date(createdAt.getTime() + 60000) : null;
    const booking = await db.booking.upsert({ where: { id }, update: {}, create: {
      id, bookingRef: `NCL-${month.replace('-', '')}-${String(i + 1).padStart(4, '0')}`, customerId: customer.id, businessId: business.id, listingId: listing.id,
      roomTypeId: room?.id, roomTypeName: room?.name, status, startDate, endDate, participantsCount: Math.min(1 + i % 4, room?.maxOccupancy ?? 2), totalMinor,
      bookingMode: "REQUEST", createdAt, confirmedAt: paid ? createdAt : null,
      completedAt: ended ? endDate : null,
      cancelledAt: status.startsWith("CANCELLED") ? createdAt : null,
      cancelReason: status.startsWith("CANCELLED") ? "Demonstration: travel plans changed or requested room unavailable." : null,
      responseDueAt: status === "AWAITING_BUSINESS_CONFIRMATION" ? at(1) : null,
      paymentDueAt: status === "PENDING_PAYMENT" ? at(1) : null,
      notes: `[DEMO] ${status.replaceAll('_', ' ')} scenario. ${["Late arrival requested.", "Vegetarian meals requested.", "Celebrating an anniversary.", "Ground-floor room requested."][i % 4]}`,
      participants: { create: { id: `${id}-guest`, fullName: customer.name!, email: customer.email, nationality: "Uganda", isPrimary: true } },
      addOns: addOn ? { create: { id: `${id}-addon`, addOnId: addOn.id, name: addOn.name, priceMinor: addOn.priceMinor, quantity: 1 } } : undefined,
      payments: { create: { id: `${id}-payment`, provider: (["MTN_MOBILE_MONEY", "AIRTEL_MONEY", "CARD", "STRIPE"] as const)[i % 4], status: paymentStatus, amountMinor: totalMinor, providerReference: `DEMO-NCL-${month}-${i + 1}`, failureReason: paymentStatus === "FAILED" ? ["Card declined by issuer", "Mobile money authorization timed out", "Insufficient balance"][i % 3] : null, createdAt, initiatedAt: createdAt, completedAt } }
    } });
    summary[booking.status] = (summary[booking.status] ?? 0) + 1;
    let refundStatus: RefundStatus | undefined;
    if (status === "REFUND_REQUESTED") refundStatus = "REQUESTED";
    if (status === "REFUND_PROCESSING") refundStatus = "PROCESSING";
    if (status === "REFUNDED") refundStatus = "COMPLETED";
    if (status === "SUPPORT_CASE_OPEN") refundStatus = "REJECTED";
    if (refundStatus) await db.refund.upsert({ where: { id: `${id}-refund` }, update: {}, create: { id: `${id}-refund`, bookingId: id, paymentId: `${id}-payment`, amountMinor: paymentStatus === "PARTIALLY_REFUNDED" ? Math.round(totalMinor / 2) : totalMinor, status: refundStatus, requestedByUserId: customer.id, reason: refundStatus === "REJECTED" ? "Demo: request falls outside the agreed cancellation window." : "Demo: guest requested a refund following a change of travel plans.", createdAt } });
    if (["REVIEWED", "COMPLETED"].includes(status)) await db.review.upsert({ where: { bookingId: id }, update: {}, create: {
      id: `${id}-review`, bookingId: id, authorUserId: customer.id, businessId: business.id, listingId: listing.id,
      rating: [5, 4, 5, 3, 4, 5, 2][i % 7], title: ["Peaceful stay", "Great family weekend", "Helpful team", "Room for improvement"][i % 4],
      body: ["Lovely gardens and a warm welcome. Breakfast was fresh and the room was spotless.", "Our family enjoyed the spacious room. Airport pickup was easy to arrange.", "The location was beautiful, though dinner service took longer than expected.", "A relaxing stay. The team helped us arrange an early departure and packed breakfast."][i % 4],
      status: i % 13 === 0 ? "FLAGGED" : i % 17 === 0 ? "HIDDEN" : i % 11 === 0 ? "PENDING" : "PUBLISHED",
      businessReplyBody: i % 3 === 0 ? "Thank you for staying with us. We appreciate your feedback and look forward to welcoming you again." : null,
      businessRepliedAt: i % 3 === 0 ? createdAt : null, createdAt
    } });
  }
  const bookings = await db.booking.findMany({ where: { id: { startsWith: `${prefix}-booking-` } }, include: { customer: true }, orderBy: { bookingRef: "asc" } });
  const dialogue = [
    "Hello! Could you confirm whether breakfast is included with our room?",
    "Yes, breakfast is included. We serve it from 7 to 10 AM and can prepare an early breakfast on request.",
    "Thank you. We are arriving in the evening. Is late check-in possible?",
    "Certainly. Please share your expected arrival time and we will arrange a welcome with our evening team.",
    "We expect to arrive around 8 PM. One guest prefers vegetarian meals.",
    "Noted. Our kitchen can prepare vegetarian meals. Please let us know about any allergies before arrival.",
    "Can you also help us arrange a transfer and a guided walk the next morning?",
    "We can help with both. Transfers are charged separately; we will confirm the price before you agree.",
    "That sounds good. Could we have a quiet room away from the restaurant?",
    "We have added your room preference. Allocation depends on availability, but we will do our best.",
    "Thank you for the update. Could you send the check-in and cancellation details?",
    "Check-in begins at 2 PM and checkout is at 10 AM. Your booking details show the applicable cancellation policy."
  ];
  for (let i = 0; i < 30; i++) {
    const booking = bookings[i];
    const id = `${prefix}-thread-${i + 1}`;
    const count = i === 0 ? 64 : i === 1 ? 36 : 3 + i % 10;
    const messages = Array.from({ length: count }, (_, j) => ({ id: `${id}-message-${j + 1}`, senderId: j % 2 ? owner.userId : booking.customerId, content: dialogue[j % dialogue.length], createdAt: new Date(now.getTime() - ((30 - i) * 2 * 60 + count - j) * 60000), readAt: j < count - 2 ? now : null }));
    await db.messageThread.upsert({ where: { id }, update: {}, create: { id, businessId: business.id, customerId: booking.customerId, bookingId: booking.id, createdAt: messages[0].createdAt, updatedAt: messages.at(-1)!.createdAt, messages: { create: messages } } });
    // Read receipts use the same per-user model as the application.
    for (const message of messages.filter(m => m.readAt)) await db.messageReadReceipt.upsert({ where: { messageId_userId: { messageId: message.id, userId: message.senderId === owner.userId ? booking.customerId : owner.userId } }, update: {}, create: { messageId: message.id, userId: message.senderId === owner.userId ? booking.customerId : owner.userId, readAt: now } });
  }
  const caseStatuses = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"] as const;
  for (let i = 0; i < 10; i++) {
    const booking = bookings.find(b => b.status === "SUPPORT_CASE_OPEN") ?? bookings[i];
    const id = `${prefix}-support-${i + 1}`;
    await db.supportCase.upsert({ where: { id }, update: {}, create: { id, caseRef: `NCL-SC-${month}-${i + 1}`, openedByUserId: owner.userId, surface: "BUSINESS", relatedBookingId: booking.id, category: i % 2 ? "Payments" : "Booking", subject: ["Refund timing query", "Guest arrival change", "Payment verification", "Availability clarification", "Cancellation policy question"][i % 5], status: caseStatuses[i % 5], closedAt: i % 5 >= 3 ? at(-1) : null,
      messages: { create: [{ id: `${id}-message`, authorUserId: owner.userId, authorRole: "BUSINESS", body: "Demonstration support case: please review this booking and advise on the next step." }] }
    } });
  }
  for (let i = 0; i < 24; i++) await db.notification.upsert({ where: { id: `${prefix}-notification-${i}` }, update: {}, create: { id: `${prefix}-notification-${i}`, userId: owner.userId, type: (["BOOKING_UPDATE", "PAYMENT_UPDATE", "REVIEW_PROMPT", "SUPPORT_UPDATE"] as const)[i % 4], title: ["New booking request", "Payment update", "New guest review", "Support case updated"][i % 4], body: "Demo activity for Nile & Crater Lodges. Open the related booking to review its details.", relatedBookingId: bookings[i].id, isRead: i > 7, createdAt: at(-i / 24) } });
  // Group eligible demo payments into real payout relations; derive each payout
  // from retained payment value so the revenue breakdown remains reconcilable.
  const payments = await db.payment.findMany({ where: { id: { startsWith: `${prefix}-booking-` }, status: { in: ["SUCCESSFUL", "PARTIALLY_REFUNDED", "REFUNDED"] }, payoutId: null }, include: { refunds: true }, orderBy: { id: "asc" } });
  const payoutStatuses = ["COMPLETED", "PROCESSING", "PENDING", "FAILED"] as const;
  for (let group = 0; group < 4; group++) {
    const id = `${prefix}-payout-${group}`;
    if (await db.payout.findUnique({ where: { id } })) continue;
    const allocated = payments.filter((payment, i) => i % 6 === group && !payment.refunds.some(r => ["REQUESTED", "PROCESSING"].includes(r.status)));
    const retained = allocated.reduce((sum, p) => sum + p.amountMinor - p.refunds.filter(r => r.status === "COMPLETED").reduce((s, r) => s + r.amountMinor, 0), 0);
    if (!allocated.length || retained <= 0) continue;
    await db.payout.create({ data: { id, businessId: business.id, status: payoutStatuses[group], amountMinor: retained - Math.round(retained * PLATFORM_COMMISSION_RATE), providerReference: `DEMO-PAYOUT-${month}-${group}`, notes: "Fictional demonstration payout; no funds moved.", createdAt: at(-group / 4), payments: { connect: allocated.map(p => ({ id: p.id })) } } });
  }
  for (const listing of listings) {
    for (const room of listing.accommodation?.roomTypes ?? []) for (let day = 0; day < 45; day++) {
      const date = at(day); date.setUTCHours(0, 0, 0, 0);
      const id = `ncl-demo-availability-${room.id}-${date.toISOString().slice(0, 10)}`;
      const capacity = room.totalRooms;
      await db.availability.upsert({ where: { listingId_roomTypeId_date: { listingId: listing.id, roomTypeId: room.id, date } }, update: {}, create: { id, listingId: listing.id, roomTypeId: room.id, date, capacity, remaining: Math.max(0, capacity - day % (capacity + 1)), priceOverrideMinor: day % 7 >= 5 ? Math.round(room.priceMinor * 1.15) : null } });
    }
  }
  console.log("Nile & Crater Lodges demo ready:", { guests: guests.length, listings: await db.listing.count({ where: { businessId: business.id } }), demoBookings: bookings.length, conversations: 30, supportCases: 10, notifications: 24 });
  console.table(summary);
  console.log("Owner: owner.stays@safarinexa.test | Guest: guest.1@nilecrater.demo.test | Demo password: Passw0rd!");
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
