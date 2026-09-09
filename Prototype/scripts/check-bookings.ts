import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const bookings = await db.booking.findMany({ select: { businessId: true } });
  const businesses = await db.businessProfile.findMany({ select: { id: true, name: true } });
  console.log("Bookings count:", bookings.length);
  console.log("Bookings businessIds:", [...new Set(bookings.map(b => b.businessId))]);
  console.log("Businesses:", businesses);
}
main().finally(() => db.$disconnect());
