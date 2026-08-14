import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const business = await db.businessProfile.findUnique({
    where: { slug: "jinja-whitewater-adventures" }
  });

  if (!business) {
    console.log("Business not found");
    return;
  }

  // 1. Approve the business so it can have published listings
  await db.businessProfile.update({
    where: { id: business.id },
    data: { verificationStatus: "APPROVED" }
  });

  await db.businessVerification.update({
    where: { id: `${business.id}-verification` },
    data: { status: "APPROVED", reviewNotes: "Approved for testing." }
  });

  const customer = await db.user.findUnique({ where: { email: "customer@safarinexa.test" } });

  // 2. Create a Guide
  const guide = await db.guide.upsert({
    where: { id: "guide-jinja-1" },
    update: {},
    create: {
      id: "guide-jinja-1",
      businessId: business.id,
      name: "David Kintu",
      bio: "Expert whitewater rafter and safety kayaker on the Nile.",
      experienceYears: 12,
      languages: ["English", "Luganda", "Swahili"],
      specialization: "DESTINATION_SPECIALIST",
      hasOwnVehicle: false,
      photoUrl: "https://images.unsplash.com/photo-1763610452422-a24873594a0b?w=400&q=80&auto=format&fit=crop&crop=faces",
      hourlyRateMinor: 80000,
      isTopGuide: true,
      availabilityNote: "Available this week"
    }
  });

  // 3. Create Listings
  const tour1 = await db.listing.upsert({
    where: { id: "tour-jinja-rafting" },
    update: {},
    create: {
      id: "tour-jinja-rafting",
      slug: "tour-jinja-rafting",
      businessId: business.id,
      type: "TOUR",
      title: "Grade 5 Full Day Whitewater Rafting",
      description: "Tackle the legendary rapids of the White Nile with our expert crew.",
      city: "Jinja",
      coverImageUrl: "https://images.unsplash.com/photo-1741529460022-29bcb9eb29d7?w=1200&q=80&auto=format&fit=crop",
      basePriceMinor: 550000,
      status: "PUBLISHED",
      publishedAt: new Date(),
      tour: {
        create: {
          durationDays: 1,
          groupSizeMin: 1,
          groupSizeMax: 8,
          difficulty: "Moderate",
          inclusions: ["Safety gear", "Lunch", "Photos", "Guide"],
          exclusions: ["Transport to Jinja"],
          itinerary: ["08:00 Safety Briefing", "09:00 Hit the rapids", "13:00 Riverside lunch", "16:00 Finish"],
          guideId: guide.id
        }
      }
    }
  });

  const tour2 = await db.listing.upsert({
    where: { id: "tour-jinja-sunset" },
    update: {},
    create: {
      id: "tour-jinja-sunset",
      slug: "tour-jinja-sunset",
      businessId: business.id,
      type: "TOUR",
      title: "Sunset Nile Cruise",
      description: "Relaxing evening cruise to the source of the Nile with drinks and snacks.",
      city: "Jinja",
      coverImageUrl: "https://images.unsplash.com/photo-1760186270637-5733a4148d9c?w=1200&q=80&auto=format&fit=crop",
      basePriceMinor: 150000,
      status: "PUBLISHED",
      publishedAt: new Date(),
      tour: {
        create: {
          durationDays: 1,
          groupSizeMin: 2,
          groupSizeMax: 12,
          difficulty: "Easy",
          inclusions: ["Drinks", "Snacks", "Guide"],
          exclusions: ["Tips"],
          itinerary: ["17:00 Boarding", "17:30 Cruise to source", "19:00 Return to dock"],
          guideId: guide.id
        }
      }
    }
  });

  // 4. Create Bookings & Payments
  const seedNow = new Date();
  
  for (let i = 1; i <= 8; i++) {
    const isRafting = i % 2 === 0;
    const listing = isRafting ? tour1 : tour2;
    const daysAgo = i * 2;
    const startDate = new Date(seedNow);
    startDate.setDate(startDate.getDate() - daysAgo);

    const booking = await db.booking.upsert({
      where: { bookingRef: `BK-JINJA-${100 + i}` },
      update: {},
      create: {
        bookingRef: `BK-JINJA-${100 + i}`,
        customerId: customer!.id,
        listingId: listing.id,
        businessId: business.id,
        status: i < 7 ? "COMPLETED" : "AWAITING_BUSINESS_CONFIRMATION",
        startDate,
        participantsCount: 2,
        totalMinor: listing.basePriceMinor * 2,
        completedAt: i < 7 ? startDate : null
      }
    });

    if (i < 7) {
      const existingPayment = await db.payment.findFirst({ where: { bookingId: booking.id } });
      if (!existingPayment) {
        await db.payment.create({
          data: {
            bookingId: booking.id,
            provider: "CARD",
            status: "SUCCESSFUL",
            amountMinor: booking.totalMinor,
            currency: "UGX",
            providerReference: "•••• 4242",
            completedAt: startDate
          }
        });
      }

      if (i % 3 === 0) {
        await db.review.upsert({
          where: { bookingId: booking.id },
          update: {},
          create: {
            bookingId: booking.id,
            authorUserId: customer!.id,
            listingId: listing.id,
            businessId: business.id,
            rating: 5,
            body: "Absolutely fantastic experience on the Nile!",
            status: "PUBLISHED"
          }
        });
      }
    }
  }

  console.log("Jinja business seeded with data!");
}

main().catch(console.error);
