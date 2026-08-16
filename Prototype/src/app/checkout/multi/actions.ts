"use server";

import { auth } from "@/auth";
import { CartItem } from "@/lib/cart";
import { validateAndReserveBookings } from "@/lib/booking-service";

export async function createBulkOrderAction(items: CartItem[], userDetails: { fullName: string; email: string; phone: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (items.length === 0) throw new Error("Cart is empty");

  const { orderId } = await validateAndReserveBookings(session.user.id, items, userDetails, true);
  return orderId;
}
