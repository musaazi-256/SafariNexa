import { db } from "@/lib/db";
import { generateBookingRef, nightsBetween, parseFirstUgxAmount } from "@/lib/booking";
import { CartItem } from "@/lib/cart";

export async function validateAndReserveBookings(
  customerId: string,
  items: CartItem[],
  userDetails: { fullName: string; email: string; phone: string },
  createOrder: boolean = false
) {
  if (items.length === 0) throw new Error("No items provided for booking.");

  // Use a transaction to create everything atomically and prevent race conditions
  return await db.$transaction(async (tx) => {
    const resolvedBookings = [];

    for (const item of items) {
      const listing = await tx.listing.findUnique({
        where: { id: item.listingId },
        include: { 
          business: true,
          accommodation: { include: { roomTypes: true, addOns: true } }, 
          restaurant: true,
          tour: true,
          transport: true
        }
      });

      if (!listing) throw new Error(`Listing not found for ID: ${item.listingId}`);
      if (listing.status !== "PUBLISHED") throw new Error(`Listing "${listing.title}" is not currently published.`);
      if (listing.business.verificationStatus !== "APPROVED") throw new Error(`Business for "${listing.title}" is not fully verified.`);
      
      const type = (item.type || listing.type).toUpperCase();
      if (listing.type !== type) throw new Error(`Listing type mismatch for "${listing.title}".`);

      const participantsCount = Math.max(1, item.participants || 1);
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let roomTypeId: string | undefined;
      let addOns: { id: string; name: string; priceMinor: number }[] = [];
      let totalMinor: number = 0;

      if (type === "ACCOMMODATION") {
        startDate = item.startDate ? new Date(item.startDate) : undefined;
        endDate = item.endDate ? new Date(item.endDate) : undefined;
        
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error(`Invalid dates for "${listing.title}".`);
        }
        
        // Normalize dates to UTC midnight for inventory matching
        const normalizedStart = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
        const normalizedEnd = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));

        if (normalizedStart < new Date(new Date().setUTCHours(0,0,0,0))) {
          throw new Error(`Check-in date cannot be in the past for "${listing.title}".`);
        }

        const nights = nightsBetween(normalizedStart.toISOString(), normalizedEnd.toISOString());
        if (nights <= 0) throw new Error(`Check-out must be after check-in for "${listing.title}".`);

        const room = listing.accommodation?.roomTypes.find((r) => r.id === item.roomTypeId);
        if (!room) throw new Error(`Selected room type is invalid for "${listing.title}".`);
        if (participantsCount > room.maxOccupancy) {
          throw new Error(`Maximum occupancy for "${room.name}" is ${room.maxOccupancy}.`);
        }

        // Atomic Inventory Decrement per night
        for (let i = 0; i < nights; i++) {
          const currentNight = new Date(normalizedStart);
          currentNight.setUTCDate(currentNight.getUTCDate() + i);
          
          const availability = await tx.availability.upsert({
            where: { 
              listingId_roomTypeId_date: { 
                listingId: listing.id, 
                roomTypeId: room.id, 
                date: currentNight 
              } 
            },
            update: { remaining: { decrement: 1 } },
            create: {
              listingId: listing.id,
              roomTypeId: room.id,
              date: currentNight,
              capacity: room.totalRooms,
              remaining: room.totalRooms - 1
            }
          });

          if (availability.remaining < 0) {
            throw new Error(`"${room.name}" at "${listing.title}" is fully booked for ${currentNight.toISOString().split('T')[0]}.`);
          }
        }

        roomTypeId = room.id;
        const roomRate = room.priceMinor ?? listing.basePriceMinor;

        const requestedAddOnIds = item.addOnIds || [];
        addOns = (listing.accommodation?.addOns ?? [])
          .filter((addOn) => requestedAddOnIds.includes(addOn.id))
          .map((addOn) => ({ id: addOn.id, name: addOn.name, priceMinor: addOn.priceMinor }));
        
        const addOnsRate = addOns.reduce((sum, addOn) => sum + addOn.priceMinor, 0);
        totalMinor = (roomRate + addOnsRate) * nights;

      } else if (type === "TOUR") {
        startDate = item.startDate ? new Date(item.startDate) : undefined;
        if (!startDate || isNaN(startDate.getTime()) || startDate < new Date(new Date().setHours(0,0,0,0))) {
          throw new Error(`Invalid or past date provided for "${listing.title}".`);
        }
        if (listing.tour && participantsCount > listing.tour.groupSizeMax) {
           throw new Error(`Participants exceed maximum group size of ${listing.tour.groupSizeMax} for "${listing.title}".`);
        }
        
        // Decrement for single day inventory
        const normalizedStart = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
        const capacity = listing.tour?.groupSizeMax || 10;
        
        const availability = await tx.availability.upsert({
          where: { listingId_roomTypeId_date: { listingId: listing.id, roomTypeId: "", date: normalizedStart } },
          update: { remaining: { decrement: participantsCount } },
          create: {
            listingId: listing.id,
            roomTypeId: "", // Use empty string to satisfy unique constraint for non-accommodations
            date: normalizedStart,
            capacity: capacity,
            remaining: capacity - participantsCount
          }
        });

        if (availability.remaining < 0) {
          throw new Error(`"${listing.title}" does not have enough capacity for ${participantsCount} participants on this date.`);
        }

        totalMinor = listing.basePriceMinor * participantsCount;
        
      } else if (type === "TRANSPORT") {
        startDate = item.startDate ? new Date(`${item.startDate}T${item.time || "12:00"}`) : undefined;
        if (!startDate || isNaN(startDate.getTime()) || startDate < new Date()) {
          throw new Error(`Invalid or past date/time provided for "${listing.title}".`);
        }
        if (listing.transport && participantsCount > listing.transport.capacity) {
           throw new Error(`Passengers exceed vehicle capacity of ${listing.transport.capacity} for "${listing.title}".`);
        }
        totalMinor = listing.basePriceMinor * participantsCount;

      } else {
        // Restaurant
        startDate = item.startDate ? new Date(`${item.startDate}T${item.time || "12:00"}`) : undefined;
        if (!startDate || isNaN(startDate.getTime()) || startDate < new Date()) {
          throw new Error(`Invalid or past date/time provided for "${listing.title}".`);
        }
        const unitPrice = listing.basePriceMinor > 0 ? listing.basePriceMinor : parseFirstUgxAmount(listing.restaurant?.priceRange ?? "0");
        totalMinor = unitPrice * participantsCount;
      }

      resolvedBookings.push({
        listingId: listing.id,
        businessId: listing.businessId,
        roomTypeId,
        startDate,
        endDate,
        participantsCount,
        totalMinor,
        addOns
      });
    }

    let orderId: string | undefined;
    
    if (createOrder) {
      const orderTotalMinor = resolvedBookings.reduce((sum, b) => sum + b.totalMinor, 0);
      const order = await tx.order.create({
        data: { customerId, totalMinor: orderTotalMinor, status: "PENDING_PAYMENT" }
      });
      orderId = order.id;
    }

    const createdBookings = [];
    for (const booking of resolvedBookings) {
      const created = await tx.booking.create({
        data: {
          bookingRef: generateBookingRef(),
          orderId,
          customerId,
          listingId: booking.listingId,
          businessId: booking.businessId,
          roomTypeId: booking.roomTypeId,
          status: "PENDING_PAYMENT",
          startDate: booking.startDate,
          endDate: booking.endDate,
          participantsCount: booking.participantsCount,
          totalMinor: booking.totalMinor,
          currency: "UGX",
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
      createdBookings.push(created);
    }

    return { orderId, bookings: createdBookings };
  });
}
