import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1598928506311-c55dd18db0a9?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&q=80&auto=format&fit=crop"
];

async function main() {
  const listing = await db.listing.findFirst({
    where: { slug: "demo-lodge" },
    include: { accommodation: { include: { roomTypes: true } } }
  });

  if (!listing || !listing.accommodation) {
    console.error("Could not find demo-lodge");
    return;
  }

  // 1. Add images to the existing rooms
  const rooms = listing.accommodation.roomTypes;
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    // Assign 3 images per room from the pool, rotating the start index
    const roomImages = [
      ROOM_IMAGES[(i * 2) % ROOM_IMAGES.length],
      ROOM_IMAGES[(i * 2 + 1) % ROOM_IMAGES.length],
      ROOM_IMAGES[(i * 2 + 2) % ROOM_IMAGES.length]
    ];
    
    await db.roomType.update({
      where: { id: room.id },
      data: { images: roomImages }
    });
    console.log(`Updated room ${room.name} with 3 images.`);
  }

  // 2. Add the two new add-ons
  const existingAddons = await db.addOn.findMany({
    where: { accommodationId: listing.accommodation.listingId }
  });
  
  const hasBonfire = existingAddons.some(a => a.name.includes("Bonfire"));
  const hasSauna = existingAddons.some(a => a.name.includes("Sauna"));

  if (!hasBonfire) {
    await db.addOn.create({
      data: {
        accommodationId: listing.accommodation.listingId,
        name: "Bonfire at night",
        description: "Private bonfire setup under the stars with marshmallows and a dedicated attendant.",
        priceMinor: 50000
      }
    });
    console.log("Added Bonfire add-on.");
  }
  
  if (!hasSauna) {
    await db.addOn.create({
      data: {
        accommodationId: listing.accommodation.listingId,
        name: "Sauna access",
        description: "2-hour access to the private woodland sauna and cold plunge pool.",
        priceMinor: 80000
      }
    });
    console.log("Added Sauna add-on.");
  }
}

main().catch(console.error).finally(() => db.$disconnect());
