"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function sendMessage(threadId: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const thread = await db.messageThread.findUnique({
    where: { id: threadId },
    select: { id: true, businessId: true, customerId: true, bookingId: true }
  });

  if (!thread) throw new Error("Thread not found");

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
  revalidatePath("/profile/messages");
  if (thread.bookingId) {
    revalidatePath(`/bookings/${thread.bookingId}`);
    revalidatePath(`/business/bookings/${thread.bookingId}`);
  }

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

export async function sendBookingInquiryAction(bookingId: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const thread = await createThread(bookingId);
  return await sendMessage(thread.id, content);
}

export async function sendListingInquiryAction(listingId: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { title: true, businessId: true }
  });

  if (!listing) throw new Error("Listing not found");

  let thread = await db.messageThread.findFirst({
    where: {
      businessId: listing.businessId,
      customerId: session.user.id,
      bookingId: null
    }
  });

  if (!thread) {
    thread = await db.messageThread.create({
      data: {
        businessId: listing.businessId,
        customerId: session.user.id
      }
    });
  }

  const messageText = `[Inquiry regarding "${listing.title}"]\n${content}`;
  return await sendMessage(thread.id, messageText);
}

export async function markThreadAsRead(threadId: string) {
  const session = await auth();
  if (!session?.user) return;

  await db.message.updateMany({
    where: {
      threadId,
      senderId: { not: session.user.id },
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function getThreadMessages(threadId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const thread = await db.messageThread.findUnique({
    where: { id: threadId },
    select: { id: true, businessId: true, customerId: true }
  });

  if (!thread) throw new Error("Thread not found");

  const isCustomer = thread.customerId === session.user.id;
  if (!isCustomer) {
    const businessUser = await db.businessUser.findFirst({
      where: { businessId: thread.businessId, userId: session.user.id }
    });
    if (!businessUser) throw new Error("Unauthorized");
  }

  const messages = await db.message.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: { name: true, image: true }
      }
    }
  });

  return messages;
}

export async function getBusinessCustomers(businessId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const businessUser = await db.businessUser.findFirst({
    where: { businessId, userId: session.user.id }
  });
  if (!businessUser) throw new Error("Unauthorized");

  const bookings = await db.booking.findMany({
    where: { businessId },
    include: {
      customer: {
        select: { id: true, name: true, email: true, image: true, phone: true }
      },
      listing: {
        select: { title: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Deduplicate customers with their latest booking
  const map = new Map<string, { customer: any; booking: any }>();
  for (const b of bookings) {
    if (!map.has(b.customerId)) {
      map.set(b.customerId, { customer: b.customer, booking: b });
    }
  }

  return Array.from(map.values());
}

export async function createThreadWithCustomer(businessId: string, customerId: string, bookingId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const businessUser = await db.businessUser.findFirst({
    where: { businessId, userId: session.user.id }
  });
  if (!businessUser) throw new Error("Unauthorized");

  let thread = await db.messageThread.findFirst({
    where: {
      businessId,
      customerId,
      ...(bookingId ? { bookingId } : {})
    }
  });

  if (!thread) {
    thread = await db.messageThread.create({
      data: {
        businessId,
        customerId,
        ...(bookingId ? { bookingId } : {})
      }
    });
  }

  return thread;
}

