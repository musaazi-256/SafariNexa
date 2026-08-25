import type { TransportCategory } from "@prisma/client";

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
  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : undefined,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : undefined,
    basePriceMinor: Math.max(0, Number(formData.get("basePriceMinor")) || 0),
    coverImageUrl: String(formData.get("coverImageUrl") ?? "").trim() || undefined,
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
    description?: string;
    images: string[];
    bedType?: string;
    bedrooms: number;
    roomFeatures: string[];
    isRefundable: boolean;
    refundPolicyText?: string;
    discountNotice?: string;
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
    const isRefundable = isRefundableInput ? isRefundableInput === "on" : true;

    rows.push({
      id: String(formData.get(`roomTypeId_${i}`) ?? "").trim() || undefined,
      name,
      priceMinor: Math.max(0, Number(formData.get(`roomTypePrice_${i}`)) || 0),
      maxOccupancy,
      totalRooms,
      breakfastIncluded: formData.get(`roomTypeBreakfast_${i}`) === "on",
      description: String(formData.get(`roomTypeDescription_${i}`) ?? "").trim() || undefined,
      images: Array.from(formData.getAll(`roomTypeImages_${i}`)).map(String).filter(Boolean),
      bedType: String(formData.get(`roomTypeBedType_${i}`) ?? "").trim() || "1 Double Bed",
      bedrooms,
      roomFeatures,
      isRefundable,
      refundPolicyText: String(formData.get(`roomTypeRefundPolicyText_${i}`) ?? "").trim() || undefined,
      discountNotice: String(formData.get(`roomTypeDiscountNotice_${i}`) ?? "").trim() || undefined
    });
  }
  return rows;
}

export function parseAddOnRows(formData: FormData) {
  const count = Number(formData.get("addOnCount") ?? 0);
  const rows: Array<{ id?: string; name: string; priceMinor: number; description?: string }> = [];

  for (let i = 0; i < count; i++) {
    const name = String(formData.get(`addOnName_${i}`) ?? "").trim();
    if (!name) continue;
    rows.push({
      id: String(formData.get(`addOnId_${i}`) ?? "").trim() || undefined,
      name,
      priceMinor: Math.max(0, Number(formData.get(`addOnPrice_${i}`)) || 0),
      description: String(formData.get(`addOnDescription_${i}`) ?? "").trim() || undefined
    });
  }
  return rows;
}

export function parseAccommodationFields(formData: FormData) {
  return {
    propertyType: String(formData.get("propertyType") ?? "").trim(),
    amenities: formData.getAll("amenities").map(String),
    checkInTime: String(formData.get("checkInTime") ?? "").trim() || undefined,
    checkOutTime: String(formData.get("checkOutTime") ?? "").trim() || undefined,
    maxGuests: Math.max(1, Number(formData.get("maxGuests")) || 2),
    cancellationPolicy: String(formData.get("cancellationPolicy") ?? "").trim() || undefined
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
    tourType: String(formData.get("tourType") ?? "").trim() || undefined,
    durationDays: Math.max(1, Number(formData.get("durationDays")) || 1),
    groupSizeMin,
    groupSizeMax,
    difficulty: String(formData.get("difficulty") ?? "").trim() || undefined,
    inclusions: linesToArray(formData.get("inclusions")),
    exclusions: linesToArray(formData.get("exclusions")),
    itinerary: linesToArray(formData.get("itinerary")),
    guideId: guideId || undefined
  };
}

export function parseRestaurantFields(formData: FormData) {
  const openingHours = String(formData.get("openingHours") ?? "").trim();
  return {
    cuisineType: String(formData.get("cuisineType") ?? "").trim() || undefined,
    priceRange: String(formData.get("priceRange") ?? "").trim() || undefined,
    menuUrl: String(formData.get("menuUrl") ?? "").trim() || undefined,
    seatingCapacity: formData.get("seatingCapacity") ? Number(formData.get("seatingCapacity")) : undefined,
    acceptsReservationRequests: formData.get("acceptsReservationRequests") === "on",
    openingHours: openingHours ? openingHours : undefined
  };
}

export function parseTransportFields(formData: FormData) {
  return {
    category: String(formData.get("category") ?? "AIRPORT_TRANSFER") as TransportCategory,
    vehicleType: String(formData.get("vehicleType") ?? "").trim(),
    capacity: Math.max(1, Number(formData.get("capacity")) || 1),
    estimatedDurationMinutes: formData.get("estimatedDurationMinutes") ? Number(formData.get("estimatedDurationMinutes")) : undefined,
    pricingModel: String(formData.get("pricingModel") ?? "").trim() || undefined
  };
}
