import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const businesses = await db.businessProfile.findMany();
  
  if (businesses.length === 0) {
    console.log("No businesses found");
    return;
  }

  const conversations = [
    {
      customerMsg1: "Hi, do you have vegan options available?",
      businessMsg1: "Yes, we have a dedicated vegan menu with several options!",
      customerMsg2: "Great, I'm looking forward to it."
    },
    {
      customerMsg1: "Is there parking available near the location?",
      businessMsg1: "We have secure parking on site for all our guests.",
      customerMsg2: "Perfect, thank you!"
    },
    {
      customerMsg1: "Can we request an early check-in?",
      businessMsg1: "Early check-in is subject to availability on the day, but we will note your request.",
      customerMsg2: ""
    },
    {
      customerMsg1: "I need to change my booking date.",
      businessMsg1: "Sure, please let us know your preferred new date and we will check availability.",
      customerMsg2: "How about next Friday?"
    }
  ];

  for (const business of businesses) {
    const businessUserRel = await db.businessUser.findFirst({
      where: { businessId: business.id }
    });
    if (!businessUserRel) continue;
    const businessUser = await db.user.findUnique({ where: { id: businessUserRel.userId } });
    if (!businessUser) continue;

    const bookings = await db.booking.findMany({
      where: { businessId: business.id },
      include: { customer: true },
      take: 8
    });

    if (bookings.length === 0) continue;

    // Clear existing threads for idempotency
    await db.messageThread.deleteMany({ where: { businessId: business.id } });

    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      const convo = conversations[i % conversations.length];

      const thread = await db.messageThread.create({
        data: {
          businessId: business.id,
          customerId: booking.customerId,
          bookingId: booking.id,
        }
      });

      let timeOffset = 60 * 60 * 1000 * 24 * (bookings.length - i); // some days ago

      // Customer message 1
      await db.message.create({
        data: {
          threadId: thread.id,
          senderId: booking.customerId,
          content: convo.customerMsg1,
          createdAt: new Date(Date.now() - timeOffset)
        }
      });

      // Business message 1
      if (convo.businessMsg1) {
        await db.message.create({
          data: {
            threadId: thread.id,
            senderId: businessUser.id,
            content: convo.businessMsg1,
            createdAt: new Date(Date.now() - timeOffset + 1000 * 60 * 5) // 5 mins later
          }
        });
      }

      // Customer message 2
      if (convo.customerMsg2) {
        await db.message.create({
          data: {
            threadId: thread.id,
            senderId: booking.customerId,
            content: convo.customerMsg2,
            createdAt: new Date(Date.now() - timeOffset + 1000 * 60 * 15) // 15 mins later
          }
        });
      }
    }
  }

  console.log("Seeded message threads for all businesses.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
