"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireBusinessSession } from "@/lib/business";

export async function sendMessage(threadId: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const thread = await db.messageThread.findUnique({
    where: { id: threadId },
    select: { businessId: true, customerId: true }
  });

  if (!thread) throw new Error("Thread not found");

  // Verify the sender is either the customer or has access to the business
  const isCustomer = thread.customerId === session.user.id;
  
  if (!isCustomer) {
    const businessUser = await db.businessUser.findFirst({
      where: { businessId: thread.businessId, userId: session.user.id }
    });
    if (!businessUser) throw new Error("Unauthorized");
  }

  const message = await db.message.create({
    data: {
      threadId,
      senderId: session.user.id,
      content,
    }
  });

  await db.messageThread.update({
    where: { id: threadId },
    data: { updatedAt: new Date() }
  });

  revalidatePath("/business/messages");
  // Also revalidate customer routes when they exist
  return message;
}

export async function createThread(bookingId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { businessId: true, customerId: true }
  });

  if (!booking) throw new Error("Booking not found");
  
  // Verify user is customer or business owner
  const isCustomer = booking.customerId === session.user.id;
  if (!isCustomer) {
    const businessUser = await db.businessUser.findFirst({
      where: { businessId: booking.businessId, userId: session.user.id }
    });
    if (!businessUser) throw new Error("Unauthorized");
  }

  let thread = await db.messageThread.findFirst({
    where: { bookingId }
  });

  if (!thread) {
    thread = await db.messageThread.create({
      data: {
        bookingId,
        businessId: booking.businessId,
        customerId: booking.customerId
      }
    });
  }

  return thread;
}
