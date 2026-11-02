"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projectMessageReadState } from "@/lib/message-read-state";

export async function sendMessage(threadId: string, content: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  content = content.trim();
  if (!content || content.length > 5000) throw new Error("Messages must contain 1–5,000 characters.");

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

  const message = await db.$transaction(async tx => {
    const created = await tx.message.create({ data: { threadId, senderId: session.user.id, content } });
    await tx.messageThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
    const members = isCustomer ? await tx.businessUser.findMany({ where: { businessId: thread.businessId }, select: { userId: true } }) : [];
    const recipients = isCustomer ? members.map(m => m.userId) : [thread.customerId];
    await tx.notification.createMany({ data: [...new Set(recipients)].filter(id => id !== session.user.id).map(userId => ({
      userId, type: "SYSTEM" as const, title: "New message", body: "You have a new message. Open your account messages to reply.", relatedBookingId: thread.bookingId
    })) });
    return created;
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
  const thread = await db.messageThread.findUnique({ where: { id: threadId } });
  if (!thread) throw new Error("Thread not found");
  if (thread.customerId !== session.user.id) {
    const membership = await db.businessUser.findFirst({
      where: { businessId: thread.businessId, userId: session.user.id }
    });
    if (!membership) throw new Error("Unauthorized");
  }

  const messages = await db.message.findMany({ where: { threadId, senderId: { not: session.user.id } }, select: { id: true } });
  await db.messageReadReceipt.createMany({ data: messages.map(message => ({ messageId: message.id, userId: session.user.id })), skipDuplicates: true });

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
      readReceipts: true,
      sender: {
        select: { name: true, image: true }
      }
    }
  });

  return projectMessageReadState(messages, session.user.id, thread.customerId);
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
  const booking = await db.booking.findFirst({where:{businessId,customerId,...(bookingId?{id:bookingId}:{})},select:{id:true}});
  if (!booking) throw new Error("A booking with this customer is required.");

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
