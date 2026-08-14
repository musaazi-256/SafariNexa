"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateBookingRef, nightsBetween, parseFirstUgxAmount } from "@/lib/booking";
import { CartItem } from "@/lib/cart";

export async function createBulkOrderAction(items: CartItem[], userDetails: { fullName: string; email: string; phone: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (items.length === 0) throw new Error("Cart is empty");

  // Every line's price is recomputed from the DB listing/room/add-on data here — item.totalMinor
  // is client (Zustand cart) state and must never be trusted directly, the same way the
  // single-item checkout in src/app/checkout/page.tsx recomputes totalMinor server-side.
  const resolvedBookings: Array<{
    listingId: string;
    businessId: string;
    roomTypeId?: string;
    startDate?: Date;
    endDate?: Date;
    participantsCount: number;
    totalMinor: number;
    addOns: { id: string; name: string; priceMinor: number }[];
  }> = [];

  for (const item of items) {
    const listing = await db.listing.findUnique({
      where: { id: item.listingId },
      include: { accommodation: { include: { roomTypes: true, addOns: true } }, restaurant: true }
    });
    if (!listing) continue;

    const participantsCount = Math.max(1, item.participants || 1);
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    let roomTypeId: string | undefined;
    let addOns: { id: string; name: string; priceMinor: number }[] = [];
    let totalMinor: number;

    if (item.type === "accommodation") {
      startDate = item.startDate ? new Date(item.startDate) : undefined;
      endDate = item.endDate ? new Date(item.endDate) : undefined;
      const nights = item.startDate && item.endDate ? nightsBetween(item.startDate, item.endDate) : 1;

      const room = listing.accommodation?.roomTypes.find((r) => r.id === item.roomTypeId);
      roomTypeId = room?.id;
      const roomRate = room?.priceMinor ?? listing.basePriceMinor;

      addOns = (listing.accommodation?.addOns ?? [])
        .filter((addOn) => item.addOnIds.includes(addOn.id))
        .map((addOn) => ({ id: addOn.id, name: addOn.name, priceMinor: addOn.priceMinor }));
      const addOnsRate = addOns.reduce((sum, addOn) => sum + addOn.priceMinor, 0);

      totalMinor = (roomRate + addOnsRate) * nights;
    } else if (item.type === "tour") {
      startDate = item.startDate ? new Date(item.startDate) : undefined;
      totalMinor = listing.basePriceMinor * participantsCount;
    } else {
      startDate = item.startDate ? new Date(`${item.startDate}T${item.time || "12:00"}`) : undefined;
      const unitPrice = listing.basePriceMinor > 0 ? listing.basePriceMinor : parseFirstUgxAmount(listing.restaurant?.priceRange ?? "0");
      totalMinor = unitPrice * participantsCount;
    }

    resolvedBookings.push({
      listingId: listing.id,
      businessId: listing.businessId,
      roomTypeId,
      startDate: startDate && !Number.isNaN(startDate.getTime()) ? startDate : undefined,
      endDate: endDate && !Number.isNaN(endDate.getTime()) ? endDate : undefined,
      participantsCount,
      totalMinor,
      addOns
    });
  }

  if (resolvedBookings.length === 0) throw new Error("None of the items in your cart are available anymore.");

  const totalMinor = resolvedBookings.reduce((sum, booking) => sum + booking.totalMinor, 0);

  const order = await db.order.create({
    data: {
      customerId: session.user.id,
      totalMinor,
      status: "PENDING_PAYMENT"
    }
  });

  for (const booking of resolvedBookings) {
    await db.booking.create({
      data: {
        bookingRef: generateBookingRef(),
        orderId: order.id,
        customerId: session.user.id,
        listingId: booking.listingId,
        businessId: booking.businessId,
        roomTypeId: booking.roomTypeId,
        status: "PENDING_PAYMENT",
        startDate: booking.startDate,
        endDate: booking.endDate,
        participantsCount: booking.participantsCount,
        totalMinor: booking.totalMinor,
        participants: {
          create: {
            fullName: userDetails.fullName,
            email: userDetails.email,
            phone: userDetails.phone,
            isPrimary: true
          }
        },
        addOns: {
          create: booking.addOns.map((addOn) => ({
            addOnId: addOn.id,
            name: addOn.name,
            priceMinor: addOn.priceMinor
          }))
        }
      }
    });
  }

  return order.id;
}
