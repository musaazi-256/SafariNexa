import { PrismaClient, type TransportCategory, type GuideSpecialization } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_PASSWORD = "Passw0rd!";

// UGX has no everyday subunit, so this app treats "minor units" as whole UGX
// (i.e. basePriceMinor === the on-screen price). Keeps seed data and booking
// totals in the same units.

function parseGroupSize(label: string) {
  const numbers = label.match(/\d+/g)?.map(Number) ?? [1, 8];
  return { min: numbers[0] ?? 1, max: numbers[1] ?? numbers[0] ?? 8 };
}

const TRANSPORT_CATEGORY: Record<string, TransportCategory> = {
  "Airport Transfer": "AIRPORT_TRANSFER",
  "Kampala Special Hire": "KAMPALA_SPECIAL_HIRE"
};

/** Verified real Unsplash photos (checked for a 200/image response before use), reused
 * thematically across similar listings rather than sourcing one per listing. */
const PHOTOS = {
  lodgePool: "photo-1781039869379-5561fe260d26",
  cozyRoom: "photo-1744534637336-6110864236fc",
  rainforest: "photo-1741529460022-29bcb9eb29d7",
  lakeHills: "photo-1760186270637-5733a4148d9c",
  savannaWildlife: "photo-1578326626553-39f72c545b07",
  cityStreet: "photo-1664181220731-06219378d8c7",
  grilledFish: "photo-1600699899970-b1c9fadd8f9e",
  safariVehicle: "photo-1735423366959-c875a84a5a10",
  heroSavannaSunset: "photo-1761078206756-68d3023f3021",
  guidePortraitMale: "photo-1763610452422-a24873594a0b",
  guidePortraitFemale: "photo-1744972974316-c6a5142da3c9"
} as const;

function guidePhoto(genderPreset: "male" | "female") {
  const photo = genderPreset === "male" ? PHOTOS.guidePortraitMale : PHOTOS.guidePortraitFemale;
  return `https://images.unsplash.com/${photo}?w=400&q=80&auto=format&fit=crop&crop=faces`;
}

function unsplash(photo: (typeof PHOTOS)[keyof typeof PHOTOS]) {
  return `https://images.unsplash.com/${photo}?w=1200&q=80&auto=format&fit=crop`;
}

// Shared pool of already-verified photos for the accommodation photo gallery — reused
// across every listing (same convention as coverImageUrl) rather than sourcing a
// distinct 5-photo set per listing.
const ACCOMMODATION_GALLERY_URLS = [
  unsplash(PHOTOS.lodgePool),
  unsplash(PHOTOS.cozyRoom),
  unsplash(PHOTOS.rainforest),
  unsplash(PHOTOS.lakeHills),
  unsplash(PHOTOS.savannaWildlife),
  unsplash(PHOTOS.heroSavannaSunset)
];

/** The listing's own cover photo stays the anchor/first image, backed by the shared pool. */
function galleryFor(coverImageUrl: string) {
  return [coverImageUrl, ...ACCOMMODATION_GALLERY_URLS.filter((url) => url !== coverImageUrl)].slice(0, 5);
}

// Rotates real bookings across every payment method, using masked references in the
// same "•••• 1234" shape the live /payments flow produces (see src/lib/payments.ts) —
// the card/last-4s here are Stripe/Flutterwave's own well-known public test values.
const PAYMENT_ROTATION: Array<{ provider: "MTN_MOBILE_MONEY" | "AIRTEL_MONEY" | "CARD" | "STRIPE"; reference: string; failureReason: string }> = [
  { provider: "MTN_MOBILE_MONEY", reference: "•••• 482", failureReason: "No confirmation received on your phone — request timed out." },
  { provider: "AIRTEL_MONEY", reference: "•••• 217", failureReason: "No confirmation received on your phone — request timed out." },
  { provider: "CARD", reference: "•••• 4242", failureReason: "Card declined by issuing bank." },
  { provider: "STRIPE", reference: "•••• 5556", failureReason: "Card declined by issuing bank." }
];

/** Idempotent: `db.booking.upsert`'s `update: {}` means re-running seed never touches
 * an existing booking, so a nested payment create would only ever fire once anyway —
 * but this check-then-create makes that explicit rather than relying on upsert's shape. */
async function ensurePayment(
  bookingId: string,
  amountMinor: number,
  seedIndex: number,
  options: { status: "SUCCESSFUL" | "FAILED" | "REFUNDED"; completedAt?: Date }
) {
  const existing = await db.payment.findFirst({ where: { bookingId } });
  if (existing) return;

  const rotation = PAYMENT_ROTATION[seedIndex % PAYMENT_ROTATION.length];
  await db.payment.create({
    data: {
      bookingId,
      provider: rotation.provider,
      status: options.status,
      amountMinor,
      currency: "UGX",
      providerReference: rotation.reference,
      failureReason: options.status === "FAILED" ? rotation.failureReason : undefined,
      completedAt: options.status === "FAILED" ? undefined : (options.completedAt ?? new Date())
    }
  });
}

const destinationsData = [
  {
    slug: "murchison-falls",
    name: "Murchison Falls",
    region: "Northern Uganda",
    summary: "Uganda's largest national park, where the Nile forces through a 7-metre gorge.",
    description:
      "Murchison Falls National Park pairs dramatic Nile scenery with big-game safari drives — lion, elephant, and giraffe on the savannah, then a boat cruise right up to the base of the falls.",
    safetyNote: "Stay inside vehicles during game drives and follow ranger guidance near the falls viewpoint.",
    heroImageUrl: unsplash(PHOTOS.heroSavannaSunset)
  },
  {
    slug: "queen-elizabeth",
    name: "Queen Elizabeth National Park",
    region: "Western Uganda",
    summary: "Savannah, crater lakes, and the Kazinga Channel boat cruise famous for hippos and elephants.",
    description:
      "Queen Elizabeth spans open savannah, crater lakes, and the Kazinga Channel — one of the highest hippo densities in the world, plus tree-climbing lions in the Ishasha sector.",
    safetyNote: "Keep a safe distance from hippos on foot near the channel; they're responsible for most wildlife incidents in the park.",
    heroImageUrl: unsplash(PHOTOS.savannaWildlife)
  },
  {
    slug: "kampala",
    name: "Kampala",
    region: "Central Uganda",
    summary: "Uganda's capital — dining, culture, and the jumping-off point for most itineraries.",
    description:
      "Kampala is where most itineraries start and end: a hub for dining, culture, craft markets, and reliable airport/city transport connections.",
    safetyNote: "Use verified transport after dark and keep valuables secure in busy markets.",
    heroImageUrl: unsplash(PHOTOS.cityStreet)
  },
  {
    slug: "kibale-forest",
    name: "Kibale Forest",
    region: "Western Uganda",
    summary: "Uganda's primate capital — chimpanzee trekking through dense tropical rainforest.",
    description:
      "Kibale Forest has one of the highest primate densities in Africa. Chimpanzee trekking is the highlight, alongside forest walks and birding for over 375 recorded species.",
    safetyNote: "Keep at least 8 metres from chimpanzees and follow your guide's pace on forest trails.",
    heroImageUrl: unsplash(PHOTOS.rainforest)
  },
  {
    slug: "lake-bunyonyi",
    name: "Lake Bunyonyi",
    region: "South-western Uganda",
    summary: "Terraced hills and a crater lake dotted with islands, near Kisoro and the Rwanda border.",
    description:
      "Lake Bunyonyi is one of Africa's most scenic lakes — no bilharzia or hippos, so open-water canoeing and swimming are part of the draw, alongside island-hopping and terraced hillside views.",
    safetyNote: "Wear a life jacket on canoe trips and confirm your operator is a verified SafariNexa partner.",
    heroImageUrl: unsplash(PHOTOS.lakeHills)
  },
  {
    slug: "ziwa-rhino",
    name: "Ziwa Rhino Sanctuary",
    region: "Central Uganda",
    summary: "The only place in Uganda to track rhinos on foot, roughly two hours north of Kampala.",
    description:
      "Ziwa is a sanctuary reintroducing southern white rhinos to the wild — a guided walking tracking experience gets you within metres of the herd, making it Uganda's most accessible big-game day trip from Kampala.",
    safetyNote: "Stay in your tracking group and keep the minimum 20-metre distance your ranger sets.",
    heroImageUrl: unsplash(PHOTOS.savannaWildlife)
  }
];

const accommodationListings = [
  {
    id: "demo-lodge",
    title: "Murchison River Lodge",
    destinationSlug: "murchison-falls",
    location: "Murchison Falls",
    address: "Murchison Falls National Park, Nwoya District, Uganda",
    latitude: 2.2748,
    longitude: 31.7855,
    coverImageUrl: unsplash(PHOTOS.lodgePool),
    propertyType: "Safari lodge",
    priceValue: 420000,
    about:
      "Set on the Victoria Nile with views over the delta, Murchison River Lodge is a short drive from the falls viewpoint and boat launch. Rooms are en-suite bandas with private verandas.",
    amenities: ["Verified partner", "Flexible cancellation", "Breakfast included", "Safari pickup", "Riverside restaurant", "Generator backup"],
    checkInTime: "14:00",
    checkOutTime: "11:00",
    maxGuests: 4,
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
    roomTypes: [
      { name: "Garden View Room", priceMinor: 340000, breakfastIncluded: false, maxOccupancy: 2, description: "Compact en-suite room facing the lodge gardens." },
      { name: "Riverside Banda", priceMinor: 420000, breakfastIncluded: true, maxOccupancy: 2, description: "Private veranda banda overlooking the Victoria Nile." },
      { name: "Family Suite", priceMinor: 580000, breakfastIncluded: true, maxOccupancy: 4, description: "Two-room suite with a connecting lounge, ideal for families." }
    ],
    addOns: [
      { name: "Airport pickup", priceMinor: 60000, description: "Private transfer from Bugungu or Pakuba airstrip." },
      { name: "Guided nature walk", priceMinor: 40000, description: "1-hour guided walk around the lodge grounds." }
    ]
  },
  {
    id: "kampala-boutique",
    title: "Kampala Boutique Stay",
    destinationSlug: "kampala",
    location: "Kololo, Kampala",
    address: "Kololo, Kampala, Uganda",
    latitude: 0.3346,
    longitude: 32.5978,
    coverImageUrl: unsplash(PHOTOS.cozyRoom),
    propertyType: "Boutique hotel",
    priceValue: 280000,
    about:
      "A quiet, design-led stay in Kololo — walkable to embassies, cafes, and craft markets, with a rooftop workspace and secure parking for early airport departures.",
    amenities: ["Airport transfer", "Restaurant", "Workspace", "Secure parking", "Rooftop lounge", "Free Wi-Fi"],
    checkInTime: "13:00",
    checkOutTime: "10:00",
    maxGuests: 2,
    cancellationPolicy: "Free cancellation up to 24 hours before check-in.",
    roomTypes: [
      { name: "Standard Room", priceMinor: 280000, breakfastIncluded: false, maxOccupancy: 2, description: "Compact city room with a rooftop-lounge view." },
      { name: "Executive Room", priceMinor: 360000, breakfastIncluded: true, maxOccupancy: 2, description: "Larger room with a workspace nook and breakfast included." }
    ],
    addOns: [{ name: "Airport transfer", priceMinor: 70000, description: "One-way private transfer to/from Entebbe International Airport." }]
  },
  {
    id: "kibale-forest-camp",
    title: "Kibale Forest Edge Camp",
    destinationSlug: "kibale-forest",
    location: "Kibale Forest",
    address: "Kibale Forest National Park, Kabarole District, Uganda",
    latitude: 0.5205,
    longitude: 30.3803,
    coverImageUrl: unsplash(PHOTOS.rainforest),
    propertyType: "Tented camp",
    priceValue: 350000,
    about:
      "Canvas-and-thatch tents on raised platforms right at the Kibale boundary — fall asleep to forest sounds and walk to the ranger station for morning trekking briefings.",
    amenities: ["Verified partner", "Guided forest walks", "Full board available", "Solar power", "Campfire dinners"],
    checkInTime: "14:00",
    checkOutTime: "10:00",
    maxGuests: 3,
    cancellationPolicy: "Free cancellation up to 72 hours before check-in.",
    roomTypes: [
      { name: "Standard Tent", priceMinor: 350000, breakfastIncluded: false, maxOccupancy: 2, description: "Raised canvas tent with an en-suite bathroom." },
      { name: "Deluxe Tent", priceMinor: 430000, breakfastIncluded: true, maxOccupancy: 3, description: "Larger tent with a private deck facing the forest edge." }
    ],
    addOns: [
      { name: "Guided forest walk", priceMinor: 35000, description: "Ranger-led walk along the camp's forest-edge trail." },
      { name: "Full board upgrade", priceMinor: 90000, description: "All meals included for the length of stay." }
    ]
  },
  {
    id: "bunyonyi-eco-lodge",
    title: "Lake Bunyonyi Eco Lodge",
    destinationSlug: "lake-bunyonyi",
    location: "Lake Bunyonyi",
    address: "Lake Bunyonyi, Kabale District, Uganda",
    latitude: -1.2833,
    longitude: 29.9167,
    coverImageUrl: unsplash(PHOTOS.lakeHills),
    propertyType: "Eco lodge",
    priceValue: 310000,
    about:
      "Terraced gardens step down to the water — every banda has a private lake-view veranda, and the lodge runs its own guided canoe trips to the surrounding islands.",
    amenities: ["Verified partner", "Lake-view rooms", "Canoe launch on site", "Solar power", "Farm-to-table dining"],
    checkInTime: "14:00",
    checkOutTime: "10:00",
    maxGuests: 3,
    cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
    roomTypes: [
      { name: "Garden Banda", priceMinor: 310000, breakfastIncluded: false, maxOccupancy: 2, description: "Hillside banda a short walk from the water." },
      { name: "Lake View Banda", priceMinor: 390000, breakfastIncluded: true, maxOccupancy: 3, description: "Private veranda banda with a direct lake view." }
    ],
    addOns: [{ name: "Dugout canoe trip", priceMinor: 45000, description: "Guided canoe crossing to the nearby islands." }]
  }
];

const guidesData = [
  {
    key: "moses",
    name: "Moses Okwir",
    experienceYears: 9,
    languages: ["English", "Swahili", "Luganda"],
    bio: "Licensed safari guide since 2017, specializing in big-game tracking and birding across Uganda's western parks.",
    specialization: "DESTINATION_SPECIALIST" as GuideSpecialization,
    destinationSlug: "queen-elizabeth",
    hasOwnVehicle: true,
    photoUrl: guidePhoto("male"),
    hourlyRateMinor: 90000,
    isTopGuide: true,
    availabilityNote: "Available tomorrow" as string | null
  },
  {
    key: "grace",
    name: "Grace Aciro",
    experienceYears: 6,
    languages: ["English", "Rutooro"],
    bio: "Community-trained ranger-guide focused on primate behaviour and low-impact trekking groups.",
    specialization: "DESTINATION_SPECIALIST" as GuideSpecialization,
    destinationSlug: "kibale-forest",
    hasOwnVehicle: false,
    photoUrl: guidePhoto("female"),
    hourlyRateMinor: 70000,
    isTopGuide: false,
    availabilityNote: "Available this week" as string | null
  },
  {
    key: "daniel",
    name: "Daniel Ssali",
    experienceYears: 5,
    languages: ["English", "Luganda"],
    bio: "Kampala-born city guide with a focus on craft markets, food culture, and Buganda kingdom history.",
    specialization: "GENERAL" as GuideSpecialization,
    destinationSlug: null as string | null,
    hasOwnVehicle: true,
    photoUrl: guidePhoto("male"),
    hourlyRateMinor: 60000,
    isTopGuide: false,
    availabilityNote: "Available tomorrow" as string | null
  },
  {
    key: "patience",
    name: "Patience Kyomuhendo",
    experienceYears: 7,
    languages: ["English", "Rukiga"],
    bio: "Grew up on the lake shore — leads canoe trips and knows every island's history first-hand.",
    specialization: "DESTINATION_SPECIALIST" as GuideSpecialization,
    destinationSlug: "lake-bunyonyi",
    hasOwnVehicle: false,
    photoUrl: guidePhoto("female"),
    hourlyRateMinor: 65000,
    isTopGuide: false,
    availabilityNote: null as string | null
  },
  {
    key: "ronald",
    name: "Ronald Ssebunya",
    experienceYears: 8,
    languages: ["English", "Luganda"],
    bio: "Sanctuary-based ranger-guide specializing in rhino tracking and Kafu wetland birding.",
    specialization: "GENERAL" as GuideSpecialization,
    destinationSlug: null as string | null,
    hasOwnVehicle: true,
    photoUrl: guidePhoto("male"),
    hourlyRateMinor: 75000,
    isTopGuide: true,
    availabilityNote: "Available this week" as string | null
  }
];

const tourListings = [
  {
    id: "demo-safari",
    title: "3-Day Wildlife Safari",
    destinationSlug: "queen-elizabeth",
    location: "Queen Elizabeth National Park",
    priceValue: 1250000,
    durationDays: 3,
    groupSize: "1–8 travellers",
    difficulty: "Easy",
    description: "Guided wildlife safari with itinerary preview, verified operator, and flexible participant count.",
    itinerary: [
      "Day 1: Transfer and evening game drive",
      "Day 2: Morning safari and Kazinga Channel boat cruise",
      "Day 3: Ishasha tree-climbing lions and return to Kampala"
    ],
    inclusions: ["4x4 transport", "Park entry fees", "English-speaking guide", "Boat cruise ticket"],
    exclusions: ["Personal expenses", "Tips", "Alcoholic drinks"],
    guideKey: "moses",
    coverImageUrl: unsplash(PHOTOS.savannaWildlife)
  },
  {
    id: "chimp-trek-kibale",
    title: "Kibale Chimpanzee Trek",
    destinationSlug: "kibale-forest",
    location: "Kibale Forest",
    priceValue: 680000,
    durationDays: 1,
    groupSize: "1–6 travellers",
    difficulty: "Moderate",
    description: "Half-day guided chimpanzee trek with a permitted ranger-guide and forest walk add-on.",
    itinerary: ["06:30 briefing at the ranger station", "07:00 guided trek to locate a chimp family", "11:00 optional Bigodi wetland walk"],
    inclusions: ["Trekking permit", "Ranger-guide", "Bottled water"],
    exclusions: ["Transport to Kibale", "Tips"],
    guideKey: "grace",
    coverImageUrl: unsplash(PHOTOS.rainforest)
  },
  {
    id: "kampala-city-tour",
    title: "Kampala Half-Day City Tour",
    destinationSlug: "kampala",
    location: "Kampala",
    priceValue: 190000,
    durationDays: 1,
    groupSize: "1–10 travellers",
    difficulty: "Easy",
    description: "Craft markets, the Kasubi Tombs, and a local food stop with a Kampala-based guide.",
    itinerary: ["09:00 Kasubi Tombs", "11:00 craft market and tailors' district", "13:00 local lunch stop"],
    inclusions: ["Private vehicle", "Guide", "Entry fees"],
    exclusions: ["Meals beyond the included lunch stop", "Tips"],
    guideKey: "daniel",
    coverImageUrl: unsplash(PHOTOS.cityStreet)
  },
  {
    id: "bunyonyi-canoe-day-trip",
    title: "Lake Bunyonyi Canoe Day Trip",
    destinationSlug: "lake-bunyonyi",
    location: "Lake Bunyonyi",
    priceValue: 210000,
    durationDays: 1,
    groupSize: "1–6 travellers",
    difficulty: "Easy",
    description: "Dugout canoe crossing to Punishment Island and two other islets, with a lakeside lunch stop.",
    itinerary: ["08:00 canoe briefing and safety fitting", "08:30 paddle to Punishment Island", "12:00 lakeside lunch stop"],
    inclusions: ["Life jackets", "Canoe and paddler-guide", "Lunch"],
    exclusions: ["Transport to Lake Bunyonyi", "Tips"],
    guideKey: "patience",
    coverImageUrl: unsplash(PHOTOS.lakeHills)
  },
  {
    id: "ziwa-rhino-tracking",
    title: "Ziwa Rhino Tracking Day Trip",
    destinationSlug: "ziwa-rhino",
    location: "Ziwa Rhino Sanctuary",
    priceValue: 260000,
    durationDays: 1,
    groupSize: "1–8 travellers",
    difficulty: "Easy",
    description: "Guided on-foot rhino tracking, roughly two hours from Kampala — Uganda's most accessible big-game day trip.",
    itinerary: ["07:00 pickup in Kampala", "09:30 ranger briefing and tracking on foot", "13:00 return drive to Kampala"],
    inclusions: ["Transport from Kampala", "Sanctuary entry", "Ranger-guide"],
    exclusions: ["Meals", "Tips"],
    guideKey: "moses",
    coverImageUrl: unsplash(PHOTOS.savannaWildlife)
  }
];

const restaurantListings = [
  {
    id: "kampala-garden-dining",
    title: "Kampala Garden Dining",
    destinationSlug: "kampala",
    location: "Kampala",
    cuisine: "Ugandan & continental",
    priceRange: "UGX 40,000 – 90,000 per person",
    description: "Open-air garden restaurant known for grilled tilapia and a weekend live-music set.",
    hours: "Daily · 11:00 – 22:30",
    acceptsReservations: true,
    seatingCapacity: 60,
    coverImageUrl: unsplash(PHOTOS.grilledFish)
  },
  {
    id: "nile-view-terrace",
    title: "Nile View Terrace",
    destinationSlug: "murchison-falls",
    location: "Murchison Falls",
    cuisine: "Grill & local",
    priceRange: "UGX 35,000 – 70,000 per person",
    description: "Lodge-adjacent terrace restaurant overlooking the Victoria Nile delta.",
    hours: "Daily · 07:00 – 21:00",
    acceptsReservations: true,
    seatingCapacity: 45,
    coverImageUrl: unsplash(PHOTOS.grilledFish)
  },
  {
    id: "fort-portal-bites",
    title: "Fort Portal Bites",
    destinationSlug: "kibale-forest",
    location: "Fort Portal",
    cuisine: "Ugandan home cooking",
    priceRange: "UGX 20,000 – 45,000 per person",
    description: "Family-run spot near the Kibale gate — hearty plates before or after trekking.",
    hours: "Daily · 06:30 – 20:00",
    acceptsReservations: true,
    seatingCapacity: 20,
    coverImageUrl: unsplash(PHOTOS.grilledFish)
  }
];

const transportListings = [
  {
    id: "entebbe-airport-transfer",
    title: "Entebbe Airport Transfer",
    destinationSlug: "kampala",
    location: "Entebbe ⇄ Kampala",
    category: "Airport Transfer",
    vehicleType: "Sedan or SUV",
    capacity: 3,
    priceValue: 120000,
    durationMinutes: 45,
    description: "Fixed-fare private transfer between Entebbe International Airport and Kampala, flight-tracked pickup.",
    fareNotes: "Fixed fare regardless of traffic. Driver tracks your flight and waits free for up to 60 minutes.",
    coverImageUrl: unsplash(PHOTOS.safariVehicle)
  },
  {
    id: "kampala-special-hire-halfday",
    title: "Kampala Special Hire — Half Day",
    destinationSlug: "kampala",
    location: "Kampala",
    category: "Kampala Special Hire",
    vehicleType: "Sedan",
    capacity: 3,
    priceValue: 150000,
    durationMinutes: 240,
    description: "Private driver on call for up to 4 hours within Kampala — errands, meetings, or sightseeing.",
    fareNotes: "4-hour block, extendable per hour. Fuel within Kampala included.",
    coverImageUrl: unsplash(PHOTOS.safariVehicle)
  },
  {
    id: "murchison-park-transfer",
    title: "Kampala–Murchison Falls Transfer",
    destinationSlug: "murchison-falls",
    location: "Kampala ⇄ Murchison Falls",
    category: "Airport Transfer",
    vehicleType: "4x4 SUV",
    capacity: 4,
    priceValue: 480000,
    durationMinutes: 300,
    description: "Private 4x4 transfer from Kampala to Murchison Falls lodges, with a scenic stop en route.",
    fareNotes: "One-way fixed fare. Return leg bookable separately.",
    coverImageUrl: unsplash(PHOTOS.safariVehicle)
  }
];

// ---------------------------------------------------------------------------
// Bulk demo data — the hand-authored listings above are the rich "hero"
// items with full descriptions, room types, and reviews. Everything below
// pads out each category to a realistic volume so pagination, long booking
// history, and busy admin/business review queues all have something to
// actually page through, rather than 3-5 items that always fit on one screen.
// ---------------------------------------------------------------------------

const DESTINATION_LOCATIONS: Record<string, string> = {
  "murchison-falls": "Murchison Falls",
  "queen-elizabeth": "Queen Elizabeth National Park",
  kampala: "Kampala",
  "kibale-forest": "Kibale Forest",
  "lake-bunyonyi": "Lake Bunyonyi",
  "ziwa-rhino": "Ziwa Rhino Sanctuary"
};

const DESTINATION_GEO: Record<string, { address: string; latitude: number; longitude: number }> = {
  "murchison-falls": { address: "Murchison Falls National Park, Nwoya District, Uganda", latitude: 2.2748, longitude: 31.7855 },
  "queen-elizabeth": { address: "Queen Elizabeth National Park, Kasese District, Uganda", latitude: -0.2035, longitude: 29.8997 },
  kampala: { address: "Kampala, Uganda", latitude: 0.3476, longitude: 32.5825 },
  "kibale-forest": { address: "Kibale Forest National Park, Kabarole District, Uganda", latitude: 0.5205, longitude: 30.3803 },
  "lake-bunyonyi": { address: "Lake Bunyonyi, Kabale District, Uganda", latitude: -1.2833, longitude: 29.9167 },
  "ziwa-rhino": { address: "Ziwa Rhino Sanctuary, Nakasongola District, Uganda", latitude: 1.7833, longitude: 32.15 }
};

const DESTINATION_SLUGS = Object.keys(DESTINATION_LOCATIONS);

const ACCOMMODATION_PHOTO_BY_DESTINATION: Record<string, keyof typeof PHOTOS> = {
  "murchison-falls": "lodgePool",
  "queen-elizabeth": "savannaWildlife",
  kampala: "cozyRoom",
  "kibale-forest": "rainforest",
  "lake-bunyonyi": "lakeHills",
  "ziwa-rhino": "savannaWildlife"
};

const ACCOMMODATION_ADJECTIVES = [
  "Golden", "Emerald", "Sunrise", "Horizon", "Whispering", "Silver", "Amber", "Highland",
  "Savanna", "Hilltop", "Palm Grove", "Baobab", "Crater View", "Meadow", "Cedar", "Sunset",
  "Nile Bend", "Rift Valley", "Zebra Trail", "Acacia"
];
const ACCOMMODATION_PROPERTY_TYPES = ["Lodge", "Guesthouse", "Boutique Hotel", "Tented Camp", "Eco Cottage", "Riverside Inn"];

function generateBulkAccommodation(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const destinationSlug = DESTINATION_SLUGS[i % DESTINATION_SLUGS.length];
    const adjective = ACCOMMODATION_ADJECTIVES[i % ACCOMMODATION_ADJECTIVES.length];
    const propertyType = ACCOMMODATION_PROPERTY_TYPES[i % ACCOMMODATION_PROPERTY_TYPES.length];
    const location = DESTINATION_LOCATIONS[destinationSlug];
    const priceValue = 150000 + (i % 12) * 35000;
    const maxGuests = 2 + (i % 3);
    return {
      id: `accommodation-bulk-${i + 1}`,
      title: `${location} ${adjective} ${propertyType}`,
      destinationSlug,
      location,
      ...DESTINATION_GEO[destinationSlug],
      coverImageUrl: unsplash(PHOTOS[ACCOMMODATION_PHOTO_BY_DESTINATION[destinationSlug]]),
      propertyType,
      priceValue,
      about: `A comfortable ${propertyType.toLowerCase()} near ${location}, offering easy access to the area's main attractions with verified, guest-reviewed service.`,
      amenities: ["Verified partner", "Free Wi-Fi", i % 2 === 0 ? "Breakfast included" : "Airport transfer available"],
      checkInTime: "14:00",
      checkOutTime: "11:00",
      maxGuests,
      cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
      roomTypes: [
        {
          name: "Standard Room",
          priceMinor: priceValue,
          breakfastIncluded: i % 2 === 0,
          maxOccupancy: maxGuests,
          description: "Comfortable en-suite room with everyday essentials."
        },
        {
          name: "Deluxe Room",
          priceMinor: priceValue + 50000,
          breakfastIncluded: true,
          maxOccupancy: maxGuests,
          description: "Spacious upgraded room with premium amenities."
        }
      ],
      addOns: []
    };
  });
}

const BULK_GUIDE_TEMPLATES: Array<{
  name: string;
  gender: "male" | "female";
  languages: string[];
  bio: string;
  specialization: GuideSpecialization;
  destinationSlug: string | null;
  hasOwnVehicle: boolean;
}> = [
  {
    name: "Peter Tumusiime",
    gender: "male",
    languages: ["English", "Runyankole"],
    bio: "Second-generation safari driver-guide covering the western circuit, known for calm, patient game drives.",
    specialization: "DESTINATION_SPECIALIST",
    destinationSlug: "queen-elizabeth",
    hasOwnVehicle: true
  },
  {
    name: "Sarah Nakimuli",
    gender: "female",
    languages: ["English", "Luganda"],
    bio: "Kampala food and craft-market guide with a background in hospitality training.",
    specialization: "GENERAL",
    destinationSlug: null,
    hasOwnVehicle: false
  },
  {
    name: "Joseph Byamukama",
    gender: "male",
    languages: ["English", "Rutooro"],
    bio: "Kibale-based forest guide specializing in birding walks alongside chimp trekking.",
    specialization: "DESTINATION_SPECIALIST",
    destinationSlug: "kibale-forest",
    hasOwnVehicle: false
  },
  {
    name: "Irene Namuli",
    gender: "female",
    languages: ["English", "Luganda", "Swahili"],
    bio: "General touring guide comfortable leading multi-day itineraries across several parks.",
    specialization: "GENERAL",
    destinationSlug: null,
    hasOwnVehicle: true
  },
  {
    name: "Emmanuel Kato",
    gender: "male",
    languages: ["English", "Lusoga"],
    bio: "Murchison Falls boat-cruise and game-drive guide, ten seasons on the delta.",
    specialization: "DESTINATION_SPECIALIST",
    destinationSlug: "murchison-falls",
    hasOwnVehicle: true
  },
  {
    name: "Florence Achen",
    gender: "female",
    languages: ["English", "Acholi"],
    bio: "Ziwa sanctuary tracking guide, trained directly by the rhino conservation team.",
    specialization: "DESTINATION_SPECIALIST",
    destinationSlug: "ziwa-rhino",
    hasOwnVehicle: false
  },
  {
    name: "Robert Wasswa",
    gender: "male",
    languages: ["English", "Luganda", "Runyankole"],
    bio: "Lake Bunyonyi canoe and island-hopping guide, grew up on the lake's northern shore.",
    specialization: "DESTINATION_SPECIALIST",
    destinationSlug: "lake-bunyonyi",
    hasOwnVehicle: false
  }
];

const AVAILABILITY_NOTES: Array<string | null> = ["Available tomorrow", "Available this week", null];

function generateBulkGuides() {
  return BULK_GUIDE_TEMPLATES.map(({ gender, ...template }, i) => ({
    key: `bulk-guide-${i + 1}`,
    experienceYears: 3 + (i % 6),
    photoUrl: guidePhoto(gender),
    hourlyRateMinor: 50000 + (i % 5) * 8000,
    isTopGuide: i % 4 === 0,
    availabilityNote: AVAILABILITY_NOTES[i % AVAILABILITY_NOTES.length],
    ...template
  }));
}

const TOUR_ADJECTIVES = [
  "Sunrise", "Highland", "Riverside", "Canopy", "Crater", "Savanna", "Twilight", "Ridge",
  "Valley", "Wetland", "Trailhead", "Falls", "Delta", "Grassland", "Forest Edge", "Lakeshore",
  "Hilltop", "Borderland", "Nightwatch"
];
const TOUR_ACTIVITY_NOUNS = ["Discovery Tour", "Day Trip", "Guided Walk", "Adventure", "Excursion", "Nature Trail"];
const TOUR_DIFFICULTIES = ["Easy", "Moderate"];

function generateBulkTours(count: number, guideKeys: string[]) {
  return Array.from({ length: count }, (_, i) => {
    const destinationSlug = DESTINATION_SLUGS[i % DESTINATION_SLUGS.length];
    const location = DESTINATION_LOCATIONS[destinationSlug];
    const adjective = TOUR_ADJECTIVES[i % TOUR_ADJECTIVES.length];
    const activity = TOUR_ACTIVITY_NOUNS[i % TOUR_ACTIVITY_NOUNS.length];
    const durationDays = 1 + (i % 3);
    const priceValue = 120000 + (i % 10) * 60000;
    return {
      id: `tour-bulk-${i + 1}`,
      title: `${location} ${adjective} ${activity}`,
      destinationSlug,
      location,
      priceValue,
      durationDays,
      groupSize: durationDays === 1 ? "1–8 travellers" : "1–6 travellers",
      difficulty: TOUR_DIFFICULTIES[i % TOUR_DIFFICULTIES.length],
      description: `A guided ${activity.toLowerCase()} around ${location}, run by a verified operator with a named guide and flexible group size.`,
      itinerary: ["Morning pickup and briefing", `Guided time at ${location}`, "Return transfer in the afternoon"],
      inclusions: ["Transport", "Guide", "Entry fees"],
      exclusions: ["Personal expenses", "Tips"],
      guideKey: guideKeys[i % guideKeys.length],
      coverImageUrl: unsplash(PHOTOS[ACCOMMODATION_PHOTO_BY_DESTINATION[destinationSlug]])
    };
  });
}

const RESTAURANT_ADJECTIVES = ["Garden", "Riverside", "Hilltop", "Lakeside", "Courtyard", "Terrace", "Market", "Sunset", "Grill House", "Corner"];
const CUISINES = ["Ugandan & continental", "Grill & local", "Ugandan home cooking", "Indian & local fusion", "Pizza & grill", "Coffee & bakery"];

function generateBulkRestaurants(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const destinationSlug = DESTINATION_SLUGS[i % DESTINATION_SLUGS.length];
    const location = DESTINATION_LOCATIONS[destinationSlug];
    const adjective = RESTAURANT_ADJECTIVES[i % RESTAURANT_ADJECTIVES.length];
    const cuisine = CUISINES[i % CUISINES.length];
    const low = 15000 + (i % 8) * 5000;
    const high = low + 40000;
    return {
      id: `restaurant-bulk-${i + 1}`,
      title: `${location} ${adjective} Kitchen`,
      destinationSlug,
      location,
      cuisine,
      priceRange: `UGX ${low.toLocaleString("en-UG")} – ${high.toLocaleString("en-UG")} per person`,
      description: `Casual dining spot near ${location} serving ${cuisine.toLowerCase()}, popular with both travellers and locals.`,
      hours: "Daily · 08:00 – 22:00",
      acceptsReservations: true,
      seatingCapacity: 25 + (i % 6) * 10,
      coverImageUrl: unsplash(PHOTOS.grilledFish)
    };
  });
}

const TRANSPORT_VEHICLES = ["Sedan", "SUV", "4x4 SUV", "Minivan", "Sedan or SUV"];

function generateBulkTransport(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const destinationSlug = DESTINATION_SLUGS[i % DESTINATION_SLUGS.length];
    const location = DESTINATION_LOCATIONS[destinationSlug];
    const isSpecialHire = i % 2 === 0;
    const vehicleType = TRANSPORT_VEHICLES[i % TRANSPORT_VEHICLES.length];
    const capacity = 3 + (i % 3);
    const priceValue = isSpecialHire ? 100000 + (i % 6) * 20000 : 90000 + (i % 8) * 45000;
    return {
      id: `transport-bulk-${i + 1}`,
      title: isSpecialHire ? `Kampala Special Hire — ${vehicleType}` : `Kampala ⇄ ${location} Transfer`,
      destinationSlug,
      location: isSpecialHire ? "Kampala" : `Kampala ⇄ ${location}`,
      category: isSpecialHire ? "Kampala Special Hire" : "Airport Transfer",
      vehicleType,
      capacity,
      priceValue,
      durationMinutes: isSpecialHire ? 240 : 60 + (i % 5) * 45,
      description: isSpecialHire
        ? `Private driver on call for hourly hire around Kampala in a ${vehicleType.toLowerCase()}.`
        : `Private transfer between Kampala and ${location} in a ${vehicleType.toLowerCase()}, fixed fare.`,
      fareNotes: isSpecialHire ? "4-hour block, extendable per hour." : "Fixed one-way fare, return leg bookable separately.",
      coverImageUrl: unsplash(PHOTOS.safariVehicle)
    };
  });
}

accommodationListings.push(...generateBulkAccommodation(20));
guidesData.push(...generateBulkGuides());
tourListings.push(...generateBulkTours(19, guidesData.map((guide) => guide.key)));
restaurantListings.push(...generateBulkRestaurants(15));
transportListings.push(...generateBulkTransport(15));

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // --- Destinations ---------------------------------------------------------
  const destinationBySlug = new Map<string, { id: string }>();
  for (const item of destinationsData) {
    const destination = await db.destination.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        region: item.region,
        summary: item.summary,
        description: item.description,
        safetyNotes: item.safetyNote,
        heroImageUrl: item.heroImageUrl
      },
      create: {
        slug: item.slug,
        name: item.name,
        region: item.region,
        summary: item.summary,
        description: item.description,
        safetyNotes: item.safetyNote,
        heroImageUrl: item.heroImageUrl
      }
    });
    destinationBySlug.set(item.slug, destination);
  }

  // --- Admin: roles/permissions + one active admin user ---------------------
  const superAdminRole = await db.role.upsert({
    where: { name: "Super Admin" },
    update: {},
    create: { name: "Super Admin", description: "Full platform access across verification, users, payments, and settings." }
  });

  await db.role.upsert({
    where: { name: "Support Agent" },
    update: {},
    create: { name: "Support Agent", description: "Handles support cases and read-only booking/payment visibility." }
  });

  for (const key of ["businesses.manage", "users.manage", "payments.manage", "support.manage", "reviews.moderate"]) {
    const permission = await db.permission.upsert({ where: { key }, update: {}, create: { key } });
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id }
    });
  }

  const adminUser = await db.user.upsert({
    where: { email: "admin@safarinexa.test" },
    update: {},
    create: { email: "admin@safarinexa.test", name: "Amara Okello", role: "ADMIN", passwordHash }
  });

  await db.adminUser.upsert({
    where: { userId: adminUser.id },
    update: { status: "ACTIVE", roleId: superAdminRole.id },
    create: { userId: adminUser.id, roleId: superAdminRole.id, status: "ACTIVE" }
  });

  // --- Customer ---------------------------------------------------------------
  const customerUser = await db.user.upsert({
    where: { email: "customer@safarinexa.test" },
    update: {},
    create: {
      email: "customer@safarinexa.test",
      name: "Grace Nakato",
      role: "CUSTOMER",
      passwordHash,
      customerProfile: { create: { nationality: "Ugandan" } }
    }
  });

  // --- Businesses: one per listing type, so guides/reviews attach sensibly --
  async function upsertBusiness(slug: string, name: string, type: string, description: string, ownerEmail: string, ownerName: string) {
    const owner = await db.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: { email: ownerEmail, name: ownerName, role: "BUSINESS_OWNER", passwordHash }
    });

    const business = await db.businessProfile.upsert({
      where: { slug },
      update: {},
      create: { slug, name, type, description, contactEmail: ownerEmail, city: "Kampala", verificationStatus: "APPROVED" }
    });

    await db.businessUser.upsert({
      where: { businessId_userId: { businessId: business.id, userId: owner.id } },
      update: {},
      create: { businessId: business.id, userId: owner.id, role: "OWNER" }
    });

    await db.businessVerification.upsert({
      where: { id: `${business.id}-verification` },
      update: {},
      create: {
        id: `${business.id}-verification`,
        businessId: business.id,
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedByAdminId: adminUser.id,
        reviewNotes: "Trading license and ownership ID verified."
      }
    });

    return business;
  }

  const accommodationBusiness = await upsertBusiness(
    "nile-crater-lodges",
    "Nile & Crater Lodges",
    "Accommodation",
    "Verified lodge and boutique-stay operator across Uganda's national parks and Kampala.",
    "owner.stays@safarinexa.test",
    "Farida Nansubuga"
  );

  const toursBusiness = await upsertBusiness(
    "uganda-trails-safaris",
    "Uganda Trails Safaris",
    "Tours & guiding",
    "Verified safari, trekking, and city-tour operator with named, licensed guides.",
    "owner.tours@safarinexa.test",
    "Isaac Byaruhanga"
  );

  const restaurantsBusiness = await upsertBusiness(
    "kampala-table-group",
    "Kampala Table Group",
    "Restaurants",
    "Verified restaurant group spanning Kampala and park-adjacent dining.",
    "owner.food@safarinexa.test",
    "Sarah Nabirye"
  );

  const transportBusiness = await upsertBusiness(
    "kampala-transit-co",
    "Kampala Transit Co",
    "Transport",
    "Verified private transfer and special-hire driver network.",
    "owner.transport@safarinexa.test",
    "Peter Ochola"
  );

  // --- One tester account across all four businesses, for switching between
  // categories without four separate logins. "business@dev.test" is the exact
  // address the AUTH_DEV_MODE sign-in banner pre-fills for the business surface
  // (src/components/auth-card.tsx), so this account is reachable with zero typing.
  const multiBusinessTester = await db.user.upsert({
    where: { email: "business@dev.test" },
    update: {},
    create: { email: "business@dev.test", name: "Multi-Business Tester", role: "BUSINESS_OWNER", passwordHash }
  });

  for (const business of [accommodationBusiness, toursBusiness, restaurantsBusiness, transportBusiness]) {
    await db.businessUser.upsert({
      where: { businessId_userId: { businessId: business.id, userId: multiBusinessTester.id } },
      update: {},
      create: { businessId: business.id, userId: multiBusinessTester.id, role: "OWNER" }
    });
  }

  // --- Guides (belong to the tours business) ---------------------------------
  const guideByKey = new Map<string, { id: string }>();
  for (const item of guidesData) {
    const guide = await db.guide.upsert({
      where: { id: `guide-${item.key}` },
      update: {},
      create: {
        id: `guide-${item.key}`,
        businessId: toursBusiness.id,
        name: item.name,
        bio: item.bio,
        experienceYears: item.experienceYears,
        languages: item.languages,
        specialization: item.specialization,
        destinationId: item.destinationSlug ? destinationBySlug.get(item.destinationSlug)?.id : undefined,
        hasOwnVehicle: item.hasOwnVehicle,
        photoUrl: item.photoUrl,
        hourlyRateMinor: item.hourlyRateMinor,
        isTopGuide: item.isTopGuide,
        availabilityNote: item.availabilityNote
      }
    });
    guideByKey.set(item.key, guide);
  }

  // --- Accommodation listings, room types, add-ons ---------------------------
  for (const item of accommodationListings) {
    await db.listing.upsert({
      where: { id: item.id },
      update: { images: galleryFor(item.coverImageUrl) },
      create: {
        id: item.id,
        slug: item.id,
        businessId: accommodationBusiness.id,
        type: "ACCOMMODATION",
        title: item.title,
        description: item.about,
        destinationId: destinationBySlug.get(item.destinationSlug)?.id,
        city: item.location,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        coverImageUrl: item.coverImageUrl,
        images: galleryFor(item.coverImageUrl),
        basePriceMinor: item.priceValue,
        status: "PUBLISHED",
        publishedAt: new Date(),
        accommodation: {
          create: {
            propertyType: item.propertyType,
            amenities: item.amenities,
            checkInTime: item.checkInTime,
            checkOutTime: item.checkOutTime,
            maxGuests: item.maxGuests,
            cancellationPolicy: item.cancellationPolicy,
            roomTypes: { create: item.roomTypes.map((room) => ({ ...room, images: galleryFor(item.coverImageUrl) })) },
            addOns: { create: item.addOns }
          }
        }
      }
    });

    // Self-healing for existing deployments (like Vercel) where rooms were seeded without images
    const existingRooms = await db.roomType.findMany({ where: { accommodationId: item.id } });
    for (const room of existingRooms) {
      if (!room.images || room.images.length === 0) {
        await db.roomType.update({
          where: { id: room.id },
          data: { images: galleryFor(item.coverImageUrl) }
        });
      }
    }
  }

  // --- Tours -------------------------------------------------------------------
  for (const item of tourListings) {
    const { min, max } = parseGroupSize(item.groupSize);
    await db.listing.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        slug: item.id,
        businessId: toursBusiness.id,
        type: "TOUR",
        title: item.title,
        description: item.description,
        destinationId: destinationBySlug.get(item.destinationSlug)?.id,
        city: item.location,
        coverImageUrl: item.coverImageUrl,
        basePriceMinor: item.priceValue,
        status: "PUBLISHED",
        publishedAt: new Date(),
        tour: {
          create: {
            durationDays: item.durationDays,
            groupSizeMin: min,
            groupSizeMax: max,
            difficulty: item.difficulty,
            inclusions: item.inclusions,
            exclusions: item.exclusions,
            itinerary: item.itinerary,
            guideId: guideByKey.get(item.guideKey)?.id
          }
        }
      }
    });
  }

  // --- Restaurants ---------------------------------------------------------
  for (const item of restaurantListings) {
    await db.listing.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        slug: item.id,
        businessId: restaurantsBusiness.id,
        type: "RESTAURANT",
        title: item.title,
        description: item.description,
        destinationId: destinationBySlug.get(item.destinationSlug)?.id,
        city: item.location,
        coverImageUrl: item.coverImageUrl,
        basePriceMinor: 0,
        status: "PUBLISHED",
        publishedAt: new Date(),
        restaurant: {
          create: {
            cuisineType: item.cuisine,
            priceRange: item.priceRange,
            openingHours: { summary: item.hours },
            acceptsReservationRequests: item.acceptsReservations,
            seatingCapacity: item.seatingCapacity
          }
        }
      }
    });
  }

  // --- Transport -------------------------------------------------------------
  for (const item of transportListings) {
    await db.listing.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        slug: item.id,
        businessId: transportBusiness.id,
        type: "TRANSPORT",
        title: item.title,
        description: item.description,
        destinationId: destinationBySlug.get(item.destinationSlug)?.id,
        city: item.location,
        coverImageUrl: item.coverImageUrl,
        basePriceMinor: item.priceValue,
        status: "PUBLISHED",
        publishedAt: new Date(),
        transport: {
          create: {
            category: TRANSPORT_CATEGORY[item.category] ?? "AIRPORT_TRANSFER",
            vehicleType: item.vehicleType,
            capacity: item.capacity,
            estimatedDurationMinutes: item.durationMinutes,
            pricingModel: item.fareNotes
          }
        }
      }
    });
  }

  // --- Bookings + reviews, spanning every listing type ------------------------
  const lodgeBooking = await db.booking.upsert({
    where: { bookingRef: "BK-2401" },
    update: {},
    create: {
      bookingRef: "BK-2401",
      customerId: customerUser.id,
      listingId: "demo-lodge",
      businessId: accommodationBusiness.id,
      status: "COMPLETED",
      startDate: new Date("2026-06-12"),
      endDate: new Date("2026-06-14"),
      participantsCount: 2,
      totalMinor: 420000,
      completedAt: new Date("2026-06-14")
    }
  });

  await db.review.upsert({
    where: { bookingId: lodgeBooking.id },
    update: {},
    create: {
      bookingId: lodgeBooking.id,
      authorUserId: customerUser.id,
      listingId: "demo-lodge",
      businessId: accommodationBusiness.id,
      rating: 5,
      title: "Beautiful riverside stay",
      body: "Verified booking, smooth check-in, and the safari pickup was on time."
    }
  });
  await ensurePayment(lodgeBooking.id, lodgeBooking.totalMinor, 0, { status: "SUCCESSFUL", completedAt: lodgeBooking.completedAt ?? undefined });

  const safariBooking = await db.booking.upsert({
    where: { bookingRef: "BK-2402" },
    update: {},
    create: {
      bookingRef: "BK-2402",
      customerId: customerUser.id,
      listingId: "demo-safari",
      businessId: toursBusiness.id,
      status: "AWAITING_BUSINESS_CONFIRMATION",
      startDate: new Date("2026-08-22"),
      participantsCount: 2,
      totalMinor: 1250000
    }
  });
  await ensurePayment(safariBooking.id, safariBooking.totalMinor, 1, { status: "SUCCESSFUL" });

  const chimpTrekBooking = await db.booking.upsert({
    where: { bookingRef: "BK-2403" },
    update: {},
    create: {
      bookingRef: "BK-2403",
      customerId: customerUser.id,
      listingId: "chimp-trek-kibale",
      businessId: toursBusiness.id,
      status: "COMPLETED",
      startDate: new Date("2026-05-03"),
      participantsCount: 2,
      totalMinor: 1360000,
      completedAt: new Date("2026-05-03")
    }
  });

  await db.review.upsert({
    where: { bookingId: chimpTrekBooking.id },
    update: {},
    create: {
      bookingId: chimpTrekBooking.id,
      authorUserId: customerUser.id,
      listingId: "chimp-trek-kibale",
      businessId: toursBusiness.id,
      rating: 5,
      title: "Unforgettable trek",
      body: "Grace was fantastic — patient with our group and clearly knew exactly where to find the chimps that morning.",
      businessReplyBody: "Thank you for the kind words — we've passed this along to Grace!",
      businessRepliedAt: new Date("2026-05-05")
    }
  });
  await ensurePayment(chimpTrekBooking.id, chimpTrekBooking.totalMinor, 2, {
    status: "SUCCESSFUL",
    completedAt: chimpTrekBooking.completedAt ?? undefined
  });

  const restaurantBooking = await db.booking.upsert({
    where: { bookingRef: "BK-2404" },
    update: {},
    create: {
      bookingRef: "BK-2404",
      customerId: customerUser.id,
      listingId: "kampala-garden-dining",
      businessId: restaurantsBusiness.id,
      status: "COMPLETED",
      startDate: new Date("2026-04-18"),
      participantsCount: 4,
      totalMinor: 160000,
      completedAt: new Date("2026-04-18")
    }
  });

  await db.review.upsert({
    where: { bookingId: restaurantBooking.id },
    update: {},
    create: {
      bookingId: restaurantBooking.id,
      authorUserId: customerUser.id,
      listingId: "kampala-garden-dining",
      businessId: restaurantsBusiness.id,
      rating: 4,
      title: "Great tilapia, busy on weekends",
      body: "Food was excellent and the live music was a nice touch — book ahead on weekends, it fills up fast."
    }
  });
  await ensurePayment(restaurantBooking.id, restaurantBooking.totalMinor, 3, {
    status: "SUCCESSFUL",
    completedAt: restaurantBooking.completedAt ?? undefined
  });

  const transportBooking = await db.booking.upsert({
    where: { bookingRef: "BK-2405" },
    update: {},
    create: {
      bookingRef: "BK-2405",
      customerId: customerUser.id,
      listingId: "murchison-park-transfer",
      businessId: transportBusiness.id,
      status: "COMPLETED",
      startDate: new Date("2026-06-11"),
      participantsCount: 4,
      totalMinor: 480000,
      completedAt: new Date("2026-06-11")
    }
  });

  await db.review.upsert({
    where: { bookingId: transportBooking.id },
    update: {},
    create: {
      bookingId: transportBooking.id,
      authorUserId: customerUser.id,
      listingId: "murchison-park-transfer",
      businessId: transportBusiness.id,
      rating: 2,
      title: "Driver was over an hour late",
      body: "No communication about the delay until we called. Vehicle itself was fine once we got moving.",
      status: "FLAGGED"
    }
  });
  await ensurePayment(transportBooking.id, transportBooking.totalMinor, 4, {
    status: "SUCCESSFUL",
    completedAt: transportBooking.completedAt ?? undefined
  });

  // Completed booking left deliberately unreviewed, to manually test /reviews/new.
  const ecoLodgeBooking = await db.booking.upsert({
    where: { bookingRef: "BK-2406" },
    update: {},
    create: {
      bookingRef: "BK-2406",
      customerId: customerUser.id,
      listingId: "bunyonyi-eco-lodge",
      businessId: accommodationBusiness.id,
      status: "COMPLETED",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-03"),
      participantsCount: 2,
      totalMinor: 310000,
      completedAt: new Date("2026-07-03")
    }
  });
  await ensurePayment(ecoLodgeBooking.id, ecoLodgeBooking.totalMinor, 5, {
    status: "SUCCESSFUL",
    completedAt: ecoLodgeBooking.completedAt ?? undefined
  });

  // --- Bulk bookings + reviews, evenly round-robined across all four
  // businesses (not a flat concatenated-then-modulo'd list — with a smaller
  // bookingCount than the combined listing pool, that never actually reached
  // the restaurant/transport listings, leaving those two businesses' tables
  // and dashboards empty) and dated on a rolling window ending *today* (not
  // a fixed 2026 calendar date), so "this month" revenue/stat cards are
  // never zero no matter when the seed is actually run. -----------------------
  const seedNow = new Date();
  const bulkTargetGroups = [
    { businessId: accommodationBusiness.id, listings: accommodationListings.slice(4).map((item) => item.id) },
    { businessId: toursBusiness.id, listings: tourListings.slice(5).map((item) => item.id) },
    { businessId: restaurantsBusiness.id, listings: restaurantListings.slice(3).map((item) => item.id) },
    { businessId: transportBusiness.id, listings: transportListings.slice(3).map((item) => item.id) }
  ];

  const BULK_REVIEW_RATINGS = [5, 4, 5, 3, 5, 4, 2, 5, 4, 5, 3, 5, 4, 1, 5, 4, 3, 5, 4, 5, 2, 5, 4, 5];
  const BULK_REVIEW_BODIES = [
    "Excellent experience overall, would book again.",
    "Good value for the price, minor delays but nothing major.",
    "Absolutely loved it — one of the highlights of our trip.",
    "It was fine, nothing particularly stood out either way.",
    "Really well organized, the team clearly knew what they were doing.",
    "Disappointing — the experience didn't match what was advertised.",
    "Friendly staff, comfortable stay, would recommend to others.",
    "Great communication throughout, made the whole process easy."
  ];
  // Applied per-business (via withinGroupIndex) rather than globally, so every
  // business — not just the first one reached — has some flagged/hidden/pending
  // reviews for the moderation queues to actually show.
  const flaggedWithinGroup = new Set([2, 9, 16]);
  const hiddenWithinGroup = new Set([5, 13]);
  const pendingWithinGroup = new Set([18]);

  const PER_BUSINESS_BULK_COUNT = 20;
  const bulkBookingCount = PER_BUSINESS_BULK_COUNT * bulkTargetGroups.length;
  for (let i = 0; i < bulkBookingCount; i++) {
    const group = bulkTargetGroups[i % bulkTargetGroups.length];
    const withinGroupIndex = Math.floor(i / bulkTargetGroups.length);
    const listingId = group.listings[withinGroupIndex % group.listings.length];

    const bookingRef = `BK-30${(i + 1).toString().padStart(2, "0")}`;
    // Spreads from ~150 days ago up through today, per business, so every
    // business has a healthy chunk of activity in the current month.
    const daysAgo = 150 - Math.round((withinGroupIndex / (PER_BUSINESS_BULK_COUNT - 1)) * 150);
    const startDate = new Date(seedNow);
    startDate.setDate(startDate.getDate() - daysAgo);
    const status = flaggedWithinGroup.has(withinGroupIndex)
      ? "FLAGGED"
      : hiddenWithinGroup.has(withinGroupIndex)
        ? "HIDDEN"
        : pendingWithinGroup.has(withinGroupIndex)
          ? "PENDING"
          : "PUBLISHED";

    const booking = await db.booking.upsert({
      where: { bookingRef },
      update: {},
      create: {
        bookingRef,
        customerId: customerUser.id,
        listingId,
        businessId: group.businessId,
        status: "COMPLETED",
        startDate,
        participantsCount: 1 + (i % 4),
        totalMinor: 80000 + (i % 15) * 45000,
        completedAt: startDate
      }
    });

    await db.review.upsert({
      where: { bookingId: booking.id },
      update: {},
      create: {
        bookingId: booking.id,
        authorUserId: customerUser.id,
        listingId,
        businessId: group.businessId,
        rating: BULK_REVIEW_RATINGS[i % BULK_REVIEW_RATINGS.length],
        body: BULK_REVIEW_BODIES[i % BULK_REVIEW_BODIES.length],
        status,
        businessReplyBody: i % 7 === 0 ? "Thank you for the feedback — we hope to host you again soon!" : undefined,
        businessRepliedAt: i % 7 === 0 ? startDate : undefined
      }
    });
    await ensurePayment(booking.id, booking.totalMinor, 6 + i, { status: "SUCCESSFUL", completedAt: startDate });
  }

  // --- Live/actionable bookings in every other status, seeded explicitly per
  // business (not via the same flawed indexing) so every workspace — not just
  // accommodation/tours — has something awaiting confirmation to act on. -----
  const EXTRA_STATUSES: Array<{
    status: "PENDING_PAYMENT" | "CONFIRMED" | "AWAITING_BUSINESS_CONFIRMATION" | "CANCELLED_BY_CUSTOMER" | "PAYMENT_FAILED" | "REFUNDED";
    daysAgo: number;
    payment?: "SUCCESSFUL" | "FAILED" | "REFUNDED";
  }> = [
    { status: "PENDING_PAYMENT", daysAgo: 1 },
    { status: "CONFIRMED", daysAgo: 3, payment: "SUCCESSFUL" },
    { status: "AWAITING_BUSINESS_CONFIRMATION", daysAgo: 0, payment: "SUCCESSFUL" },
    { status: "AWAITING_BUSINESS_CONFIRMATION", daysAgo: 2, payment: "SUCCESSFUL" },
    { status: "CANCELLED_BY_CUSTOMER", daysAgo: 6 },
    { status: "PAYMENT_FAILED", daysAgo: 4, payment: "FAILED" },
    { status: "REFUNDED", daysAgo: 12, payment: "REFUNDED" }
  ];

  let extraCounter = 0;
  for (const group of bulkTargetGroups) {
    for (const extra of EXTRA_STATUSES) {
      extraCounter += 1;
      const bookingRef = `BK-32${extraCounter.toString().padStart(2, "0")}`;
      const listingId = group.listings[extraCounter % group.listings.length];
      const startDate = new Date(seedNow);
      startDate.setDate(startDate.getDate() - extra.daysAgo);

      const booking = await db.booking.upsert({
        where: { bookingRef },
        update: {},
        create: {
          bookingRef,
          customerId: customerUser.id,
          listingId,
          businessId: group.businessId,
          status: extra.status,
          startDate,
          participantsCount: 2,
          totalMinor: 180000 + (extraCounter % 5) * 40000
        }
      });

      if (extra.payment) {
        await ensurePayment(booking.id, booking.totalMinor, 200 + extraCounter, {
          status: extra.payment,
          completedAt: extra.payment === "FAILED" ? undefined : startDate
        });
      }
    }
  }

  // --- Cart checkouts spanning more than one business in a single order, so
  // the order-based payment/revenue-attribution path has real data behind it
  // (before this, exactly one Order existed platform-wide, created by hand
  // while testing the checkout flow rather than by the seed). ----------------
  async function seedOrder(orderId: string, items: Array<{ businessId: string; listingId: string; totalMinor: number }>, daysAgo: number) {
    const startDate = new Date(seedNow);
    startDate.setDate(startDate.getDate() - daysAgo);
    const totalMinor = items.reduce((sum, item) => sum + item.totalMinor, 0);

    const order = await db.order.upsert({
      where: { id: orderId },
      update: {},
      create: { id: orderId, customerId: customerUser.id, totalMinor, status: "AWAITING_BUSINESS_CONFIRMATION" }
    });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await db.booking.upsert({
        where: { bookingRef: `${orderId}-B${i + 1}` },
        update: {},
        create: {
          bookingRef: `${orderId}-B${i + 1}`,
          orderId: order.id,
          customerId: customerUser.id,
          listingId: item.listingId,
          businessId: item.businessId,
          status: "AWAITING_BUSINESS_CONFIRMATION",
          startDate,
          participantsCount: 2,
          totalMinor: item.totalMinor
        }
      });
    }

    const existingPayment = await db.payment.findFirst({ where: { orderId: order.id } });
    if (!existingPayment) {
      await db.payment.create({
        data: {
          orderId: order.id,
          provider: "CARD",
          status: "SUCCESSFUL",
          amountMinor: totalMinor,
          currency: "UGX",
          providerReference: "•••• 4242",
          completedAt: startDate
        }
      });
    }
  }

  await seedOrder(
    "order-trip-1",
    [
      { businessId: accommodationBusiness.id, listingId: "demo-lodge", totalMinor: 420000 },
      { businessId: restaurantsBusiness.id, listingId: "kampala-garden-dining", totalMinor: 160000 }
    ],
    5
  );

  await seedOrder(
    "order-trip-2",
    [
      { businessId: toursBusiness.id, listingId: "demo-safari", totalMinor: 1250000 },
      { businessId: transportBusiness.id, listingId: "murchison-park-transfer", totalMinor: 480000 }
    ],
    1
  );

  // ---------------------------------------------------------------------------
  // Additional test fixtures: verification queue, support cases, notifications,
  // refunds, team invitations, availability overrides, and extra admin users —
  // so every admin/business portal page has real, varied data on a fresh seed
  // instead of being empty until someone clicks through the UI by hand.
  // ---------------------------------------------------------------------------

  // --- Businesses in non-approved states, for the admin verification queue ---
  async function seedPendingBusiness(
    slug: string,
    name: string,
    type: string,
    ownerEmail: string,
    ownerName: string,
    verificationStatus: "SUBMITTED" | "UNDER_REVIEW" | "NEEDS_CHANGES" | "REJECTED",
    reviewNotes?: string
  ) {
    const owner = await db.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: { email: ownerEmail, name: ownerName, role: "BUSINESS_OWNER", passwordHash }
    });

    const pendingBusiness = await db.businessProfile.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name,
        type,
        description: `${name} is awaiting SafariNexa verification.`,
        contactEmail: ownerEmail,
        city: "Kampala",
        verificationStatus
      }
    });

    await db.businessUser.upsert({
      where: { businessId_userId: { businessId: pendingBusiness.id, userId: owner.id } },
      update: {},
      create: { businessId: pendingBusiness.id, userId: owner.id, role: "OWNER" }
    });

    const needsDecision = verificationStatus === "NEEDS_CHANGES" || verificationStatus === "REJECTED";
    const verification = await db.businessVerification.upsert({
      where: { id: `${pendingBusiness.id}-verification` },
      update: { status: verificationStatus, reviewNotes },
      create: {
        id: `${pendingBusiness.id}-verification`,
        businessId: pendingBusiness.id,
        status: verificationStatus,
        reviewNotes,
        reviewedAt: needsDecision ? new Date() : undefined,
        reviewedByAdminId: needsDecision ? adminUser.id : undefined
      }
    });

    await db.businessDocument.upsert({
      where: { id: `${verification.id}-doc-1` },
      update: {},
      create: {
        id: `${verification.id}-doc-1`,
        businessVerificationId: verification.id,
        type: "Business registration certificate",
        fileUrl: "https://example.com/documents/registration-certificate.pdf"
      }
    });

    return pendingBusiness;
  }

  await seedPendingBusiness(
    "rwenzori-trail-lodges",
    "Rwenzori Trail Lodges",
    "Accommodation",
    "owner.rwenzori@safarinexa.test",
    "Moses Kabuye",
    "SUBMITTED"
  );

  await seedPendingBusiness(
    "jinja-whitewater-adventures",
    "Jinja Whitewater Adventures",
    "Tours & guiding",
    "owner.jinja@safarinexa.test",
    "Esther Namuli",
    "UNDER_REVIEW"
  );

  await seedPendingBusiness(
    "northgate-charters",
    "Northgate Charters",
    "Transport",
    "owner.northgate@safarinexa.test",
    "Deo Ssemwogerere",
    "NEEDS_CHANGES",
    "Vehicle insurance certificate is expired — please re-upload a current copy."
  );

  // --- Pending team invitations, for business/team ----------------------------
  await db.businessInvitation.upsert({
    where: { token: "invite-stays-manager" },
    update: {},
    create: {
      businessId: accommodationBusiness.id,
      email: "new.manager@safarinexa.test",
      role: "MANAGER",
      token: "invite-stays-manager",
      invitedByUserId: multiBusinessTester.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  await db.businessInvitation.upsert({
    where: { token: "invite-tours-staff" },
    update: {},
    create: {
      businessId: toursBusiness.id,
      email: "new.guide.staff@safarinexa.test",
      role: "STAFF",
      token: "invite-tours-staff",
      invitedByUserId: multiBusinessTester.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  // --- Refunds across every status, for admin/payments ------------------------
  const bk3106 = await db.booking.findUnique({ where: { bookingRef: "BK-3106" } });
  const bk3106Payment = bk3106 ? await db.payment.findFirst({ where: { bookingId: bk3106.id } }) : null;
  if (bk3106 && bk3106Payment) {
    await db.refund.upsert({
      where: { id: "refund-completed-1" },
      update: {},
      create: {
        id: "refund-completed-1",
        paymentId: bk3106Payment.id,
        bookingId: bk3106.id,
        amountMinor: bk3106.totalMinor,
        reason: "Trip cancelled due to a family emergency.",
        status: "COMPLETED",
        requestedByUserId: customerUser.id,
        reviewedByAdminId: adminUser.id
      }
    });
  }

  const chimpTrekPayment = await db.payment.findFirst({ where: { bookingId: chimpTrekBooking.id } });
  if (chimpTrekPayment) {
    await db.refund.upsert({
      where: { id: "refund-requested-1" },
      update: {},
      create: {
        id: "refund-requested-1",
        paymentId: chimpTrekPayment.id,
        bookingId: chimpTrekBooking.id,
        amountMinor: 200000,
        reason: "Guide arrived over an hour late — requesting a partial refund.",
        status: "REQUESTED",
        requestedByUserId: customerUser.id
      }
    });
  }

  const restaurantPayment = await db.payment.findFirst({ where: { bookingId: restaurantBooking.id } });
  if (restaurantPayment) {
    await db.refund.upsert({
      where: { id: "refund-processing-1" },
      update: {},
      create: {
        id: "refund-processing-1",
        paymentId: restaurantPayment.id,
        bookingId: restaurantBooking.id,
        amountMinor: 40000,
        reason: "Table wasn't ready at the reserved time — restaurant approved a partial refund.",
        status: "PROCESSING",
        requestedByUserId: customerUser.id,
        reviewedByAdminId: adminUser.id
      }
    });
  }

  // --- Availability overrides for one listing, for business/availability ------
  for (let i = 0; i < 14; i++) {
    const date = new Date(Date.UTC(2026, 7, 1 + i));
    const capacity = 5;
    const remaining = i % 5 === 0 ? 0 : capacity - (i % capacity);
    await db.availability.upsert({
      where: { listingId_date: { listingId: "demo-lodge", date } },
      update: {},
      create: {
        listingId: "demo-lodge",
        date,
        capacity,
        remaining,
        priceOverrideMinor: i % 7 === 0 ? 550000 : undefined
      }
    });
  }

  // --- A draft (unpublished) listing, so business/listings shows both states --
  await db.listing.upsert({
    where: { id: "riverside-glamping-draft" },
    update: {},
    create: {
      id: "riverside-glamping-draft",
      slug: "riverside-glamping-draft",
      businessId: accommodationBusiness.id,
      type: "ACCOMMODATION",
      title: "Riverside Glamping (draft)",
      description: "New glamping tents along the Nile — still being finished before we publish.",
      city: "Jinja",
      coverImageUrl: unsplash(PHOTOS.lakeHills),
      images: galleryFor(unsplash(PHOTOS.lakeHills)),
      basePriceMinor: 380000,
      status: "DRAFT",
      accommodation: {
        create: {
          propertyType: "Glamping",
          amenities: ["Free WiFi", "Riverside deck"],
          checkInTime: "14:00",
          checkOutTime: "10:00",
          maxGuests: 2,
          roomTypes: {
            create: [{ name: "River-view tent", priceMinor: 380000, maxOccupancy: 2, totalRooms: 4, breakfastIncluded: true }]
          }
        }
      }
    }
  });

  // --- More admin users, for admin/users --------------------------------------
  const supportAgentRole = await db.role.upsert({
    where: { name: "Support Agent" },
    update: {},
    create: { name: "Support Agent", description: "Handles support cases and read-only booking/payment visibility." }
  });

  const supportAgentUser = await db.user.upsert({
    where: { email: "agent.support@safarinexa.test" },
    update: {},
    create: { email: "agent.support@safarinexa.test", name: "Patricia Auma", role: "ADMIN", passwordHash }
  });
  await db.adminUser.upsert({
    where: { userId: supportAgentUser.id },
    update: { status: "ACTIVE", roleId: supportAgentRole.id },
    create: { userId: supportAgentUser.id, roleId: supportAgentRole.id, status: "ACTIVE", lastLoginAt: new Date() }
  });

  const suspendedAdminUser = await db.user.upsert({
    where: { email: "agent.suspended@safarinexa.test" },
    update: {},
    create: { email: "agent.suspended@safarinexa.test", name: "Former Agent", role: "ADMIN", passwordHash }
  });
  await db.adminUser.upsert({
    where: { userId: suspendedAdminUser.id },
    update: { status: "SUSPENDED", roleId: supportAgentRole.id },
    create: { userId: suspendedAdminUser.id, roleId: supportAgentRole.id, status: "SUSPENDED" }
  });

  // --- Support cases across every status, for admin/support + /support --------
  async function seedSupportCase(
    caseRef: string,
    subject: string,
    category: string,
    status: "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED",
    messages: Array<{ role: "CUSTOMER" | "ADMIN"; body: string }>,
    relatedBookingId?: string
  ) {
    const supportCase = await db.supportCase.upsert({
      where: { caseRef },
      update: { status },
      create: {
        caseRef,
        openedByUserId: customerUser.id,
        subject,
        category,
        status,
        relatedBookingId,
        closedAt: status === "CLOSED" || status === "RESOLVED" ? new Date() : undefined
      }
    });

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      await db.supportMessage.upsert({
        where: { id: `${supportCase.id}-msg-${i}` },
        update: {},
        create: {
          id: `${supportCase.id}-msg-${i}`,
          supportCaseId: supportCase.id,
          authorUserId: message.role === "CUSTOMER" ? customerUser.id : adminUser.id,
          authorRole: message.role,
          body: message.body
        }
      });
    }

    return supportCase;
  }

  await seedSupportCase("SC-1001", "Payment charged twice for my safari", "Payment", "OPEN", [
    { role: "CUSTOMER", body: "I was charged twice for booking BK-2402 — can you check and refund the duplicate?" }
  ]);

  await seedSupportCase(
    "SC-1002",
    "Driver was very late for transfer",
    "Booking",
    "IN_PROGRESS",
    [
      { role: "CUSTOMER", body: "The driver for my Murchison transfer showed up over an hour late with no warning." },
      { role: "ADMIN", body: "Sorry to hear that — we're following up with Kampala Transit Co and will update you shortly." }
    ],
    transportBooking.id
  );

  await seedSupportCase("SC-1003", "Need to update my emergency contact", "Account", "WAITING_ON_CUSTOMER", [
    { role: "CUSTOMER", body: "How do I update the emergency contact on file for my upcoming trip?" },
    { role: "ADMIN", body: "You can update it from Profile > Preferences. Let us know if you still don't see the option." }
  ]);

  const sc1004 = await seedSupportCase("SC-1004", "Refund status for cancelled lodge stay", "Refund", "RESOLVED", [
    { role: "CUSTOMER", body: "Just checking on the refund status for my cancelled booking." },
    { role: "ADMIN", body: "Your refund of UGX 250,000 has been processed and should reflect within 3-5 business days." },
    { role: "CUSTOMER", body: "Perfect, thank you!" }
  ]);

  await seedSupportCase("SC-1005", "Verification question for a business I own", "Business verification", "CLOSED", [
    { role: "CUSTOMER", body: "Do I need to resubmit documents if my trading license was renewed?" },
    { role: "ADMIN", body: "Only if the details changed — otherwise no action needed. Closing this out." }
  ]);

  // --- Notifications across every type, for /notifications --------------------
  const notificationFixtures: Array<{
    id: string;
    type: "BOOKING_UPDATE" | "PAYMENT_UPDATE" | "REVIEW_PROMPT" | "SUPPORT_UPDATE" | "SAFETY_ADVISORY" | "SYSTEM";
    title: string;
    body: string;
    isRead: boolean;
    relatedBookingId?: string;
    relatedSupportCaseId?: string;
  }> = [
    {
      id: "notif-1",
      type: "BOOKING_UPDATE",
      title: "Booking confirmed",
      body: "Uganda Trails Safaris confirmed your booking BK-2402.",
      isRead: false,
      relatedBookingId: safariBooking.id
    },
    {
      id: "notif-2",
      type: "PAYMENT_UPDATE",
      title: "Payment successful",
      body: "UGX 1,360,000 paid for Chimp Trek Kibale.",
      isRead: true,
      relatedBookingId: chimpTrekBooking.id
    },
    {
      id: "notif-3",
      type: "REVIEW_PROMPT",
      title: "How was your stay?",
      body: "You completed your stay at Bunyonyi Eco Lodge — leave a review to help other travellers.",
      isRead: false,
      relatedBookingId: ecoLodgeBooking.id
    },
    {
      id: "notif-4",
      type: "SUPPORT_UPDATE",
      title: "New reply on your support case",
      body: "SC-1004: Your refund of UGX 250,000 has been processed and should reflect within 3-5 business days.",
      isRead: true,
      relatedSupportCaseId: sc1004.id
    },
    {
      id: "notif-5",
      type: "SAFETY_ADVISORY",
      title: "Weather advisory for Bwindi region",
      body: "Heavy rains expected this week — some trekking routes may be affected. Check with your guide before departure.",
      isRead: false
    },
    {
      id: "notif-6",
      type: "SYSTEM",
      title: "Welcome to SafariNexa",
      body: "Your account is set up — explore stays, tours, restaurants, and transport across Uganda.",
      isRead: true
    }
  ];

  for (const fixture of notificationFixtures) {
    const { id, ...data } = fixture;
    await db.notification.upsert({
      where: { id },
      update: {},
      create: { id, userId: customerUser.id, ...data }
    });
  }

  console.log("Seed complete. Demo accounts (password for all: %s):", DEMO_PASSWORD);
  console.log("  customer@safarinexa.test        — customer");
  console.log("  owner.stays@safarinexa.test     — Nile & Crater Lodges (accommodation, verified)");
  console.log("  owner.tours@safarinexa.test     — Uganda Trails Safaris (tours + guides, verified)");
  console.log("  owner.food@safarinexa.test      — Kampala Table Group (restaurants, verified)");
  console.log("  owner.transport@safarinexa.test — Kampala Transit Co (transport, verified)");
  console.log("  business@dev.test               — owner of all 4 businesses above (use the sidebar switcher)");
  console.log("  admin@safarinexa.test           — active super admin");
  console.log("  agent.support@safarinexa.test   — active Support Agent admin");
  console.log("  agent.suspended@safarinexa.test — suspended admin (test reactivation)");
  console.log(
    `Listings seeded: ${accommodationListings.length} accommodation, ${tourListings.length} tours, ${restaurantListings.length} restaurants, ${transportListings.length} transport, ${guidesData.length} guides, 1 draft`
  );
  console.log(`Bookings/reviews seeded: ${bulkBookingCount + 6 + 6} bookings (${bulkBookingCount + 4} with reviews) for customer@safarinexa.test`);
  console.log(
    "Also seeded: 3 businesses pending verification (submitted/under review/needs changes), 2 pending team invitations, 3 refunds (requested/processing/completed), 14 days of availability overrides on demo-lodge, 5 support cases across every status, 6 notifications across every type."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
