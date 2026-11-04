import { isDemoMode } from "@/lib/dev-mode";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { dateKeyUTC, generateBookingRef, nightsBetween, parseFirstUgxAmount } from "@/lib/booking";
import { CartItem } from "@/lib/cart";
import { dailyOpeningWindow, transportIsPerPerson } from "@/lib/category-booking-rules";
import { parseFulfilment, RESPONSE_HOURS, PAYMENT_MINUTES } from "@/lib/booking-operations";

/** Undoes the per-night/per-date `tx.availability.upsert` decrement made when a booking
 * was created. Nothing previously restored this on cancellation, so `remaining` only ever
 * ratcheted downward — a room could read "fully booked" from stale cancelled bookings even
 * though the customer-facing calendar (which counts live bookings directly) correctly showed
 * it as free. Call this from every path that cancels a booking. Must run inside the same
 * transaction as the status update so the release can't be lost or double-applied. */
export async function releaseAvailabilityForBooking(tx: Prisma.TransactionClient, bookingId: string) {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { select: { type: true } } }
  });
  if (!booking || !booking.startDate) return;
  const nonBlocking = ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN", "REFUNDED", "PAYMENT_FAILED"] as const;

  if (booking.listing.type === "ACCOMMODATION" && booking.roomTypeId && booking.endDate) {
    const start = new Date(Date.UTC(booking.startDate.getUTCFullYear(), booking.startDate.getUTCMonth(), booking.startDate.getUTCDate()));
    const end = new Date(Date.UTC(booking.endDate.getUTCFullYear(), booking.endDate.getUTCMonth(), booking.endDate.getUTCDate()));
    const nights = nightsBetween(start.toISOString(), end.toISOString());

    for (let i = 0; i < nights; i++) {
      const night = new Date(start);
      night.setUTCDate(night.getUTCDate() + i);
      const row = await tx.availability.findFirst({where:{listingId:booking.listingId,roomTypeId:booking.roomTypeId,date:night}});
      if (row) {
        const occupied = await tx.booking.count({where:{roomTypeId:booking.roomTypeId,status:{notIn:[...nonBlocking]},startDate:{lte:night},endDate:{gt:night}}});
        await tx.availability.update({where:{id:row.id},data:{remaining:Math.max(0,row.capacity-occupied)}});
      }
    }
  } else if (booking.listing.type === "TOUR") {
    const date = new Date(Date.UTC(booking.startDate.getUTCFullYear(), booking.startDate.getUTCMonth(), booking.startDate.getUTCDate()));
    const row = await tx.availability.findFirst({where:{listingId:booking.listingId,roomTypeId:null,date}});
    if(row){
      const tomorrow=new Date(date);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
      const occupied=await tx.booking.aggregate({where:{listingId:booking.listingId,status:{notIn:[...nonBlocking]},startDate:{gte:date,lt:tomorrow}},_sum:{participantsCount:true}});
      await tx.availability.update({where:{id:row.id},data:{remaining:Math.max(0,row.capacity-(occupied._sum.participantsCount??0))}});
    }
  }
}

export async function validateAndReserveBookings(
  customerId: string,
  items: CartItem[],
  userDetails: { fullName: string; email: string; phone: string; nationality?: string; emergencyContact?: string },
  createOrder: boolean = false,
  transaction?: Prisma.TransactionClient
) {
  if (items.length === 0) throw new Error("No items provided for booking.");
  if (items.length > 20) throw new Error("Please check out at most 20 items at a time.");
  if ((userDetails.nationality?.length || 0) > 100 || (userDetails.emergencyContact?.length || 0) > 250) throw new Error("Traveller details are too long.");
  if (!userDetails.fullName.trim() || userDetails.fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userDetails.email) || !/^[+\d\s()-]{7,30}$/.test(userDetails.phone)) {
    throw new Error("Enter a valid traveller name, email and phone number.");
  }

  // Use a transaction to create everything atomically and prevent race conditions
  const reserve = async (tx:Prisma.TransactionClient) => {
    const resolvedBookings = [];
    const reserved = new Map<string, number>();
    const nonBlocking = ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN", "REFUNDED", "PAYMENT_FAILED"] as const;

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
      const fulfilment = parseFulfilment(item.fulfilment, type);
      const bookingMode = type === "RESTAURANT" ? "RESERVATION" : isDemoMode() ? "INSTANT" : listing.bookingMode ?? "INSTANT";
      let policySnapshot: Record<string, string | boolean | null> = {listingTitle:listing.title,type,bookingMode,cancellationPolicy:listing.accommodation?.cancellationPolicy ?? "Cancellation is subject to the terms agreed with the business. Contact support for assistance."};

      const participantsCount = item.participants ?? 1;
      if (!Number.isInteger(participantsCount) || participantsCount < 1 || participantsCount > 1000) {
        throw new Error("Please enter a valid number of participants.");
      }
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let roomTypeId: string | undefined;
      let roomTypeName: string | undefined;
      let addOns: { id: string; name: string; priceMinor: number }[] = [];
      let totalMinor: number = 0;

      if (type === "ACCOMMODATION") {
        startDate = item.startDate ? new Date(item.startDate) : undefined;
        endDate = item.endDate ? new Date(item.endDate) : undefined;
        
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error(`Invalid dates for "${listing.title}".`);
        }
        
        // Normalize dates to UTC midnight for inventory matching
        const normalizedStart = new Date(`${dateKeyUTC(startDate)}T00:00:00.000Z`);
        const normalizedEnd = new Date(`${dateKeyUTC(endDate)}T00:00:00.000Z`);

        if (normalizedStart < new Date(new Date().setUTCHours(0,0,0,0))) {
          throw new Error(`Check-in date cannot be in the past for "${listing.title}".`);
        }

        const nights = nightsBetween(normalizedStart.toISOString(), normalizedEnd.toISOString());
        if (nights <= 0) throw new Error(`Check-out must be after check-in for "${listing.title}".`);
        if (nights > 365) throw new Error("Stays cannot exceed 365 nights.");
        startDate = normalizedStart;
        endDate = normalizedEnd;

        const room = listing.accommodation?.roomTypes.find((r) => r.id === item.roomTypeId);
        if (!room) throw new Error(`Selected room type is invalid for "${listing.title}".`);
        policySnapshot = {...policySnapshot,isRefundable:room.isRefundable,roomName:room.name,refundPolicyText:room.refundPolicyText ?? null};
        if (participantsCount > room.maxOccupancy) {
          throw new Error(`Maximum occupancy for "${room.name}" is ${room.maxOccupancy}.`);
        }

        // Atomic Inventory Decrement per night
        for (let i = 0; i < nights; i++) {
          const currentNight = new Date(normalizedStart);
          currentNight.setUTCDate(currentNight.getUTCDate() + i);
          
          const key = `${room.id}:${dateKeyUTC(currentNight)}`;
          const existing = await tx.availability.findUnique({ where: { listingId_roomTypeId_date: { listingId: listing.id, roomTypeId: room.id, date: currentNight } } });
          const occupied = await tx.booking.count({ where: {
            roomTypeId: room.id, status: { notIn: [...nonBlocking] },
            startDate: { lte: currentNight }, endDate: { gt: currentNight }
          } });
          const capacity = Math.min(room.totalRooms, existing?.capacity ?? room.totalRooms);
          const quantity = (reserved.get(key) ?? 0) + 1;
          reserved.set(key, quantity);
          const availability = await tx.availability.upsert({
            where: { listingId_roomTypeId_date: { listingId: listing.id, roomTypeId: room.id, date: currentNight } },
            update: { remaining: capacity - occupied - quantity, capacity },
            create: { listingId: listing.id, roomTypeId: room.id, date: currentNight, capacity, remaining: capacity - occupied - quantity }
          });

          if (availability.remaining < 0) {
            throw new Error(`"${room.name}" at "${listing.title}" is fully booked for ${currentNight.toISOString().split('T')[0]}.`);
          }
          totalMinor += availability.priceOverrideMinor ?? room.priceMinor ?? listing.basePriceMinor;
        }

        roomTypeId = room.id;
        roomTypeName = room.name;

        const requestedAddOnIds = item.addOnIds || [];
        addOns = (listing.accommodation?.addOns ?? [])
          .filter((addOn) => requestedAddOnIds.includes(addOn.id))
          .map((addOn) => ({ id: addOn.id, name: addOn.name, priceMinor: addOn.priceMinor }));
        
        const addOnsRate = addOns.reduce((sum, addOn) => sum + addOn.priceMinor, 0);
        totalMinor += addOnsRate * nights;

      } else if (type === "TOUR") {
        startDate = item.startDate ? new Date(item.startDate) : undefined;
        if (!startDate || isNaN(startDate.getTime()) || startDate < new Date(new Date().setHours(0,0,0,0))) {
          throw new Error(`Invalid or past date provided for "${listing.title}".`);
        }
        if (listing.tour && participantsCount > listing.tour.groupSizeMax) {
           throw new Error(`Participants exceed maximum group size of ${listing.tour.groupSizeMax} for "${listing.title}".`);
        }
        if (listing.tour && participantsCount < listing.tour.groupSizeMin) {
          throw new Error(`Minimum group size is ${listing.tour.groupSizeMin}.`);
        }
        
        // Decrement for single day inventory
        const normalizedStart = new Date(`${dateKeyUTC(startDate)}T00:00:00.000Z`);
        startDate = normalizedStart;
        const capacity = listing.tour?.groupSizeMax || 10;
        endDate = new Date(normalizedStart);
        endDate.setUTCDate(endDate.getUTCDate() + (listing.tour?.durationDays ?? 1));
        
        const resourceId = `tour:${listing.id}:${dateKeyUTC(normalizedStart)}`;
        const existing = await tx.availability.findUnique({ where: { id: resourceId } });
        const tomorrow = new Date(normalizedStart); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        const occupied = await tx.booking.aggregate({ where: { listingId: listing.id, status: { notIn: [...nonBlocking] }, startDate: { gte: normalizedStart, lt: tomorrow } }, _sum: { participantsCount: true } });
        const quantity = (reserved.get(resourceId) ?? 0) + participantsCount;
        reserved.set(resourceId, quantity);
        const effectiveCapacity = Math.min(capacity, existing?.capacity ?? capacity);
        const remaining = effectiveCapacity - (occupied._sum.participantsCount ?? 0) - quantity;
        const availability = await tx.availability.upsert({
          where: { id: resourceId },
          update: { remaining, capacity: effectiveCapacity },
          create: { id: resourceId, listingId: listing.id, roomTypeId: null, date: normalizedStart, capacity: effectiveCapacity, remaining }
        });

        if (availability.remaining < 0) {
          throw new Error(`"${listing.title}" does not have enough capacity for ${participantsCount} participants on this date.`);
        }

        totalMinor = (availability.priceOverrideMinor ?? listing.basePriceMinor) * participantsCount;
        
      } else if (type === "TRANSPORT") {
        startDate = item.startDate ? new Date(`${item.startDate}T${item.time || "12:00"}:00+03:00`) : undefined;
        if (!startDate || isNaN(startDate.getTime()) || startDate < new Date()) {
          throw new Error(`Invalid or past date/time provided for "${listing.title}".`);
        }
        if (listing.transport && participantsCount > listing.transport.capacity) {
           throw new Error(`Passengers exceed vehicle capacity of ${listing.transport.capacity} for "${listing.title}".`);
        }
        const duration = listing.transport?.estimatedDurationMinutes ?? 60;
        endDate = new Date(startDate.getTime() + duration * 60 * 1000);
        const perPerson = transportIsPerPerson(listing.transport?.pricingModel);
        const occupied = await tx.booking.findMany({where:{listingId:listing.id,status:{notIn:[...nonBlocking]},startDate:{lt:endDate},OR:[{endDate:{gt:startDate}},{endDate:null,startDate:{gt:new Date(startDate.getTime()-duration*60000)}}]}});
        const localKey = `transport:${listing.id}:${startDate.toISOString()}`;
        const inCart = resolvedBookings.filter(b => b.listingId === listing.id && b.startDate && b.endDate && b.startDate < endDate! && b.endDate > startDate!).reduce((sum,b) => sum+b.participantsCount,0);
        if ((!perPerson && (occupied.length || inCart)) || perPerson && occupied.reduce((sum,b)=>sum+b.participantsCount,0)+inCart+participantsCount>(listing.transport?.capacity??1)) throw new Error("This vehicle is unavailable for the selected time.");
        reserved.set(localKey,inCart+participantsCount);
        totalMinor = listing.basePriceMinor * (perPerson ? participantsCount : 1);

      } else {
        // Restaurant
        if (!listing.restaurant?.acceptsReservationRequests) throw new Error("This restaurant is not accepting reservations.");
        if (listing.restaurant.seatingCapacity && participantsCount > listing.restaurant.seatingCapacity) {
          throw new Error("Your party exceeds this restaurant's seating capacity.");
        }
        startDate = item.startDate ? new Date(`${item.startDate}T${item.time || "12:00"}:00+03:00`) : undefined;
        if (!startDate || isNaN(startDate.getTime()) || startDate < new Date()) {
          throw new Error(`Invalid or past date/time provided for "${listing.title}".`);
        }
        const window = dailyOpeningWindow(listing.restaurant.openingHours);
        const time = (item.time || "12:00").split(":").map(Number);
        const minutes = time[0]*60+time[1];
        if (!window || minutes < window.open || minutes >= window.close) throw new Error("Choose a time within the restaurant's configured daily opening hours.");
        const hours = listing.restaurant.openingHours as { reservationDurationMinutes?: number };
        const duration = hours.reservationDurationMinutes ?? 90;
        if (minutes + duration > window.close) throw new Error("Choose an earlier time so your reservation ends before closing.");
        endDate = new Date(startDate.getTime()+duration*60000);
        const occupied = await tx.booking.findMany({where:{listingId:listing.id,status:{notIn:[...nonBlocking]},startDate:{lt:endDate},OR:[{endDate:{gt:startDate}},{endDate:null,startDate:{gt:new Date(startDate.getTime()-duration*60000)}}]}});
        const localKey = `restaurant:${listing.id}:${startDate.toISOString()}`;
        const inCart = resolvedBookings.filter(b => b.listingId === listing.id && b.startDate && b.endDate && b.startDate < endDate! && b.endDate > startDate!).reduce((sum,b) => sum+b.participantsCount,0);
        if (!listing.restaurant.seatingCapacity || occupied.reduce((sum,b)=>sum+b.participantsCount,0)+inCart+participantsCount>listing.restaurant.seatingCapacity) throw new Error("This restaurant does not have enough seats for the selected time.");
        reserved.set(localKey,inCart+participantsCount);
        const unitPrice = listing.basePriceMinor > 0 ? listing.basePriceMinor : parseFirstUgxAmount(listing.restaurant?.priceRange ?? "0");
        totalMinor = 0; // Table reservation only: menu/meal prices are not a payable reservation charge.
        void unitPrice;
      }

      resolvedBookings.push({
        listingId: listing.id,
        businessId: listing.businessId,
        roomTypeId,
        roomTypeName,
        startDate,
        endDate,
        participantsCount,
        totalMinor,
        fulfilment,
        bookingMode,
        policySnapshot,
        addOns
      });
    }

    let orderId: string | undefined;
    
    if (createOrder) {
      const orderTotalMinor = resolvedBookings.reduce((sum, b) => sum + b.totalMinor, 0);
      const order = await tx.order.create({
        data: { customerId, totalMinor: orderTotalMinor, status: resolvedBookings.some(b=>b.totalMinor > 0 && b.bookingMode !== "INSTANT") || !resolvedBookings.some(b=>b.totalMinor > 0) ? "AWAITING_BUSINESS_CONFIRMATION" : "PENDING_PAYMENT" }
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
          roomTypeName: booking.roomTypeName,
          status: booking.bookingMode !== "INSTANT" ? "AWAITING_BUSINESS_CONFIRMATION" : "PENDING_PAYMENT",
          bookingMode: booking.bookingMode,
          responseDueAt: booking.bookingMode !== "INSTANT" ? new Date(Math.min(Date.now()+RESPONSE_HOURS*3600000,booking.startDate?.getTime() ?? Infinity)) : null,
          paymentDueAt: booking.bookingMode === "INSTANT" ? new Date(Date.now()+PAYMENT_MINUTES*60000) : null,
          fulfilment: booking.fulfilment,
          policySnapshot: booking.policySnapshot,
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
              nationality: userDetails.nationality?.trim() || null,
              emergencyContact: userDetails.emergencyContact?.trim() || null,
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
      const members = await tx.businessUser.findMany({where:{businessId:booking.businessId,role:{in:["OWNER","MANAGER"]}},select:{userId:true}});
      await tx.notification.createMany({data:[...new Set([customerId,...members.map(m=>m.userId)])].map(userId=>({userId,type:"BOOKING_UPDATE" as const,title:booking.bookingMode === "INSTANT" ? "Reservation awaiting payment" : "New booking request — response needed",body:`Booking ${created.bookingRef}: ${booking.bookingMode === "INSTANT" ? "payment is required before confirmation" : "no payment collected; the business must accept first"}.`,relatedBookingId:created.id}))});
    }

    return { orderId, bookings: createdBookings };
  };
  return transaction ? reserve(transaction) : db.$transaction(reserve, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
}
