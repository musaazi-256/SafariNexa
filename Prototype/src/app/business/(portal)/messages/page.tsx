import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { MessageInbox } from "@/components/business/message-inbox";
import { getBusinessCustomers } from "@/lib/actions/messages";

export default async function BusinessMessagesPage({
  searchParams,
}: {
  searchParams?: { bookingId?: string; threadId?: string };
}) {
  const { session, businessId } = await requireBusinessSession();

  if (!businessId) return null;

  let targetThreadId = searchParams?.threadId;

  if (!targetThreadId && searchParams?.bookingId) {
    const booking = await db.booking.findUnique({
      where: { id: searchParams.bookingId },
      select: { businessId: true, customerId: true }
    });
    if (booking && booking.businessId === businessId) {
      let thread = await db.messageThread.findFirst({
        where: { bookingId: searchParams.bookingId }
      });
      if (!thread) {
        thread = await db.messageThread.create({
          data: {
            bookingId: searchParams.bookingId,
            businessId,
            customerId: booking.customerId
          }
        });
      }
      targetThreadId = thread.id;
    }
  }

  // Fetch all threads for this business
  const threads = await db.messageThread.findMany({
    where: { businessId },
    include: {
      customer: {
        select: { 
          id: true, 
          name: true, 
          image: true,
          email: true,
          phone: true,
          bookings: {
            where: { businessId },
            select: { totalMinor: true, status: true }
          }
        }
      },
      booking: {
        select: { 
          id: true, 
          bookingRef: true, 
          startDate: true,
          participantsCount: true,
          status: true,
          listing: { select: { title: true, coverImageUrl: true } } 
        }
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { name: true, image: true } }
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  const businessCustomers = await getBusinessCustomers(businessId);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      <MessageInbox 
        initialThreads={threads as any} 
        businessUserId={session.user.id} 
        businessId={businessId}
        initialActiveThreadId={targetThreadId}
        businessCustomers={businessCustomers as any}
      />
    </div>
  );
}
