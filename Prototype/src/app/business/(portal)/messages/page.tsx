import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { MessageInbox } from "@/components/business/message-inbox";
import { Button } from "@/components/ui/button";
import { SquarePen } from "lucide-react";

export default async function BusinessMessagesPage() {
  const { session, businessId } = await requireBusinessSession();

  if (!businessId) return null;

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
            where: { businessId }, // only count bookings at this business? The mockup implies total. Let's just do all for this business.
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

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B4928] mb-1">BUSINESS PORTAL</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Messages</h1>
          <p className="text-sm text-slate-500">Communicate directly with your customers regarding their bookings.</p>
        </div>
        
        <Button className="bg-[#1e613c] hover:bg-[#164a2e] text-white gap-2 font-bold h-10 px-5 rounded-lg">
          <SquarePen className="h-4 w-4" />
          New message
        </Button>
      </div>

      <div className="mt-2">
        <MessageInbox initialThreads={threads} businessUserId={session.user.id} />
      </div>
    </div>
  );
}
