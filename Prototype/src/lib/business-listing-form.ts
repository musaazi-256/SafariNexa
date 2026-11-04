import type { TransportCategory } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { dailyOpeningWindow } from "@/lib/category-booking-rules";

function linesToArray(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}

export function parseBaseFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const price = Number(formData.get("basePriceMinor") || 0);
  if (!title || title.length > 200) throw new Error("Enter a listing title of 1–200 characters.");
  if (!Number.isSafeInteger(price) || price < 0 || price > 2000000000) throw new Error("Enter a valid whole UGX price.");
  const bookingMode = String(formData.get("bookingMode") || "REQUEST");
  if (!["REQUEST", "INSTANT"].includes(bookingMode)) throw new Error("Select a valid booking mode.");
  for (const [field, limit] of [["latitude", 90], ["longitude", 180]] as const) {
    const raw = String(formData.get(field) ?? "").trim();
    if (raw && (!Number.isFinite(Number(raw)) || Math.abs(Number(raw)) > limit)) throw new Error(`Enter a valid ${field}.`);
  }
  if (formData.get("locationSelectionRequired") === "true" && (!String(formData.get("latitude") ?? "").trim() || !String(formData.get("longitude") ?? "").trim())) throw new Error("Select a location from the search results or paste a valid map pin to fill both coordinates.");
  const locationDirections = String(formData.get("locationDirections") ?? "").trim();
  if (locationDirections.length > 250) throw new Error("Keep location directions within 250 characters.");
  return {
    title,
    locationDirections: locationDirections || null,
    bookingMode,
    description: String(formData.get("description") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
    basePriceMinor: price,
    coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim() || null,
    images: Array.from(formData.getAll("images")).map(String).filter(Boolean),
    destinationId: String(formData.get("destinationId") ?? "").trim() || null
  };
}

export function parseRoomTypeRows(formData: FormData) {
  const count = Number(formData.get("roomTypeCount") ?? 0);
  const rows: Array<{
    id?: string;
    name: string;
    priceMinor: number;
    maxOccupancy: number;
    totalRooms: number;
    breakfastIncluded: boolean;
    description?: string | null;
    images: string[];
    bedType?: string;
    bedrooms: number;
    roomFeatures: string[];
    isRefundable: boolean;
    refundPolicyText?: string | null;
    discountNotice?: string | null;
  }> = [];

  for (let i = 0; i < count; i++) {
    const name = String(formData.get(`roomTypeName_${i}`) ?? "").trim();
    if (!name) continue;
    
    const maxOccupancy = Math.max(1, Number(formData.get(`roomTypeMaxOccupancy_${i}`)) || 1);
    const totalRooms = Math.max(1, Number(formData.get(`roomTypeTotalRooms_${i}`)) || 1);
    const bedrooms = Math.max(1, Number(formData.get(`roomTypeBedrooms_${i}`)) || 1);
    
    const featuresRaw = String(formData.get(`roomTypeFeatures_${i}`) ?? "");
    const roomFeatures = featuresRaw
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    
    const isRefundableInput = formData.get(`roomTypeIsRefundable_${i}`);
    const isRefundable = isRefundableInput === "on" || isRefundableInput === "true";

    rows.push({
      id: String(formData.get(`roomTypeId_${i}`) ?? "").trim() || undefined,
      name,
      priceMinor: Math.max(0, Number(formData.get(`roomTypePrice_${i}`)) || 0),
      maxOccupancy,
      totalRooms,
      breakfastIncluded: formData.get(`roomTypeBreakfast_${i}`) === "on",
      description: String(formData.get(`roomTypeDescription_${i}`) ?? "").trim() || null,
      images: Array.from(formData.getAll(`roomTypeImages_${i}`)).map(String).filter(Boolean),
      bedType: String(formData.get(`roomTypeBedType_${i}`) ?? "").trim() || "1 Double Bed",
      bedrooms,
      roomFeatures,
      isRefundable,
      refundPolicyText: String(formData.get(`roomTypeRefundPolicyText_${i}`) ?? "").trim() || null,
      discountNotice: String(formData.get(`roomTypeDiscountNotice_${i}`) ?? "").trim() || null
    });
  }
  return rows;
}

export function parseAddOnRows(formData: FormData) {
  const count = Number(formData.get("addOnCount") ?? 0);
  const rows: Array<{ id?: string; name: string; priceMinor: number; description?: string | null }> = [];

  for (let i = 0; i < count; i++) {
    const name = String(formData.get(`addOnName_${i}`) ?? "").trim();
    if (!name) continue;
    rows.push({
      id: String(formData.get(`addOnId_${i}`) ?? "").trim() || undefined,
      name,
      priceMinor: Math.max(0, Number(formData.get(`addOnPrice_${i}`)) || 0),
      description: String(formData.get(`addOnDescription_${i}`) ?? "").trim() || null
    });
  }
  return rows;
}

export function parseAccommodationFields(formData: FormData) {
  return {
    propertyType: String(formData.get("propertyType") ?? "").trim(),
    amenities: formData.getAll("amenities").map(String),
    checkInTime: String(formData.get("checkInTime") ?? "").trim() || null,
    checkOutTime: String(formData.get("checkOutTime") ?? "").trim() || null,
    maxGuests: Math.max(1, Number(formData.get("maxGuests")) || 2),
    cancellationPolicy: String(formData.get("cancellationPolicy") ?? "").trim() || null
  };
}

export function parseTourFields(formData: FormData) {
  const guideId = String(formData.get("guideId") ?? "").trim();
  const groupSizeMin = Math.max(1, Number(formData.get("groupSizeMin")) || 1);
  const groupSizeMax = Math.max(1, Number(formData.get("groupSizeMax")) || 12);
  
  if (groupSizeMin > groupSizeMax) {
    throw new Error("Minimum group size cannot be greater than maximum group size.");
  }

  return {
    tourType: String(formData.get("tourType") ?? "").trim() || null,
    durationDays: Math.max(1, Number(formData.get("durationDays")) || 1),
    groupSizeMin,
    groupSizeMax,
    difficulty: String(formData.get("difficulty") ?? "").trim() || null,
    inclusions: linesToArray(formData.get("inclusions")),
    exclusions: linesToArray(formData.get("exclusions")),
    itinerary: linesToArray(formData.get("itinerary")),
    guideId: guideId || null
  };
}

export function parseRestaurantFields(formData: FormData) {
  const openingHours = String(formData.get("openingHours") ?? "").trim();
  const duration = Number(formData.get("reservationDurationMinutes") || 90);
  const cuisines = Array.from(new Set(formData.getAll("cuisineType").map(value => String(value).trim()).filter(Boolean)));
  if (formData.get("restaurantCuisineRequired") === "true" && !cuisines.length) throw new Error("Select at least one cuisine type.");
  const priceRange = String(formData.get("priceRange") ?? "").trim();
  if (priceRange.length > 200) throw new Error("Keep the price or price range within 200 characters.");
  if (formData.get("acceptsReservationRequests") === "on" && !dailyOpeningWindow({summary:openingHours})) throw new Error("For online reservations use Daily · HH:MM - HH:MM opening hours.");
  if (!Number.isInteger(duration) || duration < 30 || duration > 240) throw new Error("Reservation duration must be between 30 and 240 minutes.");
  return {
    cuisineType: cuisines.join(", ") || null,
    priceRange: priceRange || null,
    menuUrl: String(formData.get("menuUrl") ?? "").trim() || null,
    seatingCapacity: formData.get("seatingCapacity") ? Number(formData.get("seatingCapacity")) : null,
    acceptsReservationRequests: formData.get("acceptsReservationRequests") === "on",
    // Stored as { summary } to match how the reader (restaurants/[id]/page.tsx) and seed data shape it.
    openingHours: openingHours ? { summary: openingHours, reservationDurationMinutes: duration } : Prisma.DbNull
  };
}

export function parseTransportFields(formData: FormData) {
  return {
    category: String(formData.get("category") ?? "AIRPORT_TRANSFER") as TransportCategory,
    vehicleType: String(formData.get("vehicleType") ?? "").trim(),
    capacity: Math.max(1, Number(formData.get("capacity")) || 1),
    estimatedDurationMinutes: formData.get("estimatedDurationMinutes") ? Number(formData.get("estimatedDurationMinutes")) : null,
    pricingModel: String(formData.get("pricingModel") ?? "").trim() || null
  };
}
