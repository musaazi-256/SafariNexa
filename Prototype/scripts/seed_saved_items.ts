import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const TARGET_LISTING_IDS = [
  "demo-lodge", // Murchison River Lodge
  "accommodation-bulk-12", // Ziwa Rhino Sanctuary Baobab Riverside Inn
  "accommodation-bulk-11", // Lake Bunyonyi Palm Grove Eco Cottage
  "demo-safari", // 3-Day Wildlife Safari
  "chimp-trek-kibale", // Kibale Chimpanzee Trek
  "ziwa-rhino-tracking", // Ziwa Rhino Tracking Day Trip
  "kampala-garden-dining", // Kampala Garden Dining
  "nile-view-terrace", // Nile View Terrace
  "entebbe-airport-transfer", // Entebbe Airport Transfer
  "transport-bulk-3" // Kampala Special Hire — 4x4 SUV
];

async function main() {
  const users = await db.user.findMany({
    where: {
      OR: [
        { email: "musaaziignatius@gmail.com" },
        { email: "customer@safarinexa.test" },
        { role: "CUSTOMER" },
        { role: "ADMIN" }
      ]
    }
  });

  console.log(`Found ${users.length} users to seed saved items for.`);

  for (const user of users) {
    for (const listingId of TARGET_LISTING_IDS) {
      await db.savedItem.upsert({
        where: {
          userId_listingId: {
            userId: user.id,
            listingId: listingId
          }
        },
        create: {
          userId: user.id,
          listingId: listingId
        },
        update: {}
      });
    }
    console.log(`Seeded ${TARGET_LISTING_IDS.length} saved items for user: ${user.email} (${user.name})`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
