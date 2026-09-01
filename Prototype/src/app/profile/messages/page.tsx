import { redirect } from "next/navigation";
import { Metadata } from "next";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AccountLayout } from "@/components/account-layout";
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
    <AccountLayout
      eyebrow="Account"
      title="Messages"
      description="Communicate directly with businesses about your bookings and inquiries."
    >
      <CustomerMessageInbox
        initialThreads={threads as any}
        customerUserId={session.user.id}
      />
    </AccountLayout>
  );
}
