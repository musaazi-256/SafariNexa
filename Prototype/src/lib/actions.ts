"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/business";
import { db } from "@/lib/db";
import { getRoomTypeAvailability } from "@/lib/listings";

export async function signOutAction() {
  await auth(); // or do something else if needed
  // We can't import signOut directly from @/auth if it's not exported properly, but wait, @/auth exports signOut
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/" });
}

export async function toggleSavedItem(listingId: string, path?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Sign in required.");

  const existing = await db.savedItem.findUnique({
    where: { userId_listingId: { userId: session.user.id, listingId } }
  });

  if (existing) {
    await db.savedItem.delete({ where: { id: existing.id } });
  } else {
    await db.savedItem.create({ data: { userId: session.user.id, listingId } });
  }

  if (path) revalidatePath(path);
  return { saved: !existing };
}

export async function setActiveBusiness(businessId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Sign in required.");

  // Never trust the client-picked id blindly — only switch to a business this
  // user actually belongs to.
  if (!session.user.businessIds.includes(businessId)) throw new Error("Not a member of this business.");

  cookies().set(ACTIVE_BUSINESS_COOKIE, businessId, { httpOnly: true, sameSite: "lax", path: "/" });
  revalidatePath("/business", "layout");
}

export async function getAccommodationRoomsAction(listingId: string) {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: {
      accommodation: {
        include: { roomTypes: true, addOns: true }
      }
    }
  });

  if (!listing || !listing.accommodation) {
    throw new Error("Accommodation not found");
  }

  const availabilityByRoom = await getRoomTypeAvailability(
    listing.accommodation.roomTypes.map((room) => ({ id: room.id, totalRooms: room.totalRooms }))
  );

  return {
    basePriceMinor: listing.basePriceMinor,
    maxGuests: listing.accommodation.maxGuests,
    roomTypes: listing.accommodation.roomTypes.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      images: room.images,
      priceMinor: room.priceMinor,
      maxOccupancy: room.maxOccupancy,
      breakfastIncluded: room.breakfastIncluded,
      bookedDates: availabilityByRoom[room.id] ?? []
    })),
    addOns: listing.accommodation.addOns.map((addOn) => ({
      id: addOn.id,
      name: addOn.name,
      description: addOn.description,
      priceMinor: addOn.priceMinor
    }))
  };
}
