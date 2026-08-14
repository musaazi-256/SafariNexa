import type { ListingType } from "@prisma/client";

export type ServiceType = "Accommodation" | "Tour" | "Restaurant" | "Transport";

export const LISTING_TYPE_TO_SERVICE_TYPE: Record<ListingType, ServiceType> = {
  ACCOMMODATION: "Accommodation",
  TOUR: "Tour",
  RESTAURANT: "Restaurant",
  TRANSPORT: "Transport"
};

export const SERVICE_TYPE_TO_LISTING_TYPE: Record<ServiceType, ListingType> = {
  Accommodation: "ACCOMMODATION",
  Tour: "TOUR",
  Restaurant: "RESTAURANT",
  Transport: "TRANSPORT"
};
