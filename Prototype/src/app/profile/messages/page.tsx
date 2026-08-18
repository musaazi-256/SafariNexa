import { redirect } from "next/navigation";
import { Metadata } from "next";
import { MessageSquare } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Container } from "@/components/ui/container";
import { CustomerMessageInbox } from "@/components/customer/message-inbox";

export const metadata: Metadata = {
  title: "Messages",
  description: "View and send messages to businesses."
};

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/sign-in?returnTo=/profile/messages");
  }

  const threads = await db.messageThread.findMany({
    where: {
      customerId: session.user.id
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          logoUrl: true
        }
      },
      booking: {
        select: {
          id: true,
          bookingRef: true,
          startDate: true,
          status: true,
          listing: {
            select: {
              title: true,
              coverImageUrl: true
            }
          }
        }
      },
      messages: {
        orderBy: {
          createdAt: "asc"
        },
        include: {
          sender: {
            select: {
              name: true,
              image: true
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-72px)] py-8 md:py-12">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Messages
          </h1>
          <p className="mt-2 text-slate-500">Communicate directly with businesses about your bookings and inquiries.</p>
        </div>

        <CustomerMessageInbox 
          initialThreads={threads as any} 
          customerUserId={session.user.id} 
        />
      </Container>
    </div>
  );
}
