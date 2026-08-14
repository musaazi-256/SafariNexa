import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { auth } from "@/auth";
import { AddOnEditor } from "@/components/business/add-on-editor";
import {
  AccommodationTypeFields,
  ListingBaseFields,
  RestaurantTypeFields,
  TourTypeFields,
  TransportTypeFields,
  typeLabel
} from "@/components/business/listing-form-fields";
import { RoomTypeEditor } from "@/components/business/room-type-editor";
import { Button } from "@/components/ui/button";
import { requireBusinessSession } from "@/lib/business";
import {
  parseAccommodationFields,
  parseAddOnRows,
  parseBaseFields,
  parseRestaurantFields,
  parseRoomTypeRows,
  parseTourFields,
  parseTransportFields
} from "@/lib/business-listing-form";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const { business, businessId } = await requireBusinessSession();
  if (!business || !businessId) redirect("/business/auth/sign-in");

  const listing = await db.listing.findUnique({
    where: { id: params.id },
    include: {
      accommodation: { include: { roomTypes: true, addOns: true } },
      tour: true,
      restaurant: true,
      transport: true
    }
  });
  if (!listing || listing.businessId !== businessId) notFound();

  let guides: Array<{ id: string; name: string }> = [];
  if (listing.type === "TOUR") {
    guides = await db.guide.findMany({
      where: { businessId },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });
  }

  async function updateListing(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/business/auth/sign-in");

    const target = await db.listing.findUnique({ where: { id: params.id } });
    if (!target || !activeSession.user.businessIds.includes(target.businessId)) throw new Error("Listing not found.");

    const base = parseBaseFields(formData);
    await db.listing.update({ where: { id: target.id }, data: base });

    if (target.type === "ACCOMMODATION") {
      const fields = parseAccommodationFields(formData);
      await db.accommodationListing.update({ where: { listingId: target.id }, data: fields });

      const roomTypeRows = parseRoomTypeRows(formData);
      const addOnRows = parseAddOnRows(formData);
      await db.$transaction([
        db.roomType.deleteMany({ where: { accommodationId: target.id } }),
        db.addOn.deleteMany({ where: { accommodationId: target.id } }),
        ...roomTypeRows.map((row) => db.roomType.create({ data: { ...row, accommodationId: target.id } })),
        ...addOnRows.map((row) => db.addOn.create({ data: { ...row, accommodationId: target.id } }))
      ]);
    } else if (target.type === "TOUR") {
      await db.tourListing.update({ where: { listingId: target.id }, data: parseTourFields(formData) });
    } else if (target.type === "RESTAURANT") {
      await db.restaurantProfile.update({ where: { listingId: target.id }, data: parseRestaurantFields(formData) });
    } else if (target.type === "TRANSPORT") {
      await db.transportOption.update({ where: { listingId: target.id }, data: parseTransportFields(formData) });
    }

    redirect("/business/listings");
  }

  return (
    <div className="max-w-[1000px] mx-auto pb-32">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-8">
        <Link href="/business/dashboard" className="hover:text-slate-900 transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/business/listings" className="hover:text-slate-900 transition-colors">Listings</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-bold">{listing.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
            Edit {typeLabel(listing.type)} listing
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Update your listing details to keep your information accurate and up to date.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 font-bold text-[11px] tracking-wider uppercase text-[#0B4928]">
            {listing.status}
          </div>
          <Button variant="outline" size="sm" className="h-8 font-semibold text-slate-700 bg-white border-slate-200 shadow-sm">
            Actions <span className="ml-2 text-[10px] text-slate-400">v</span>
          </Button>
        </div>
      </div>

      <form action={updateListing} className="flex flex-col gap-6">
        <ListingBaseFields
          initial={{
            title: listing.title,
            description: listing.description,
            city: listing.city ?? undefined,
            address: listing.address ?? undefined,
            latitude: listing.latitude,
            longitude: listing.longitude,
            basePriceMinor: listing.basePriceMinor,
            coverImageUrl: listing.coverImageUrl,
            images: listing.images
          }}
        />

        {listing.type === "ACCOMMODATION" && listing.accommodation ? (
          <>
            <AccommodationTypeFields
              initial={{
                propertyType: listing.accommodation.propertyType,
                amenities: listing.accommodation.amenities,
                checkInTime: listing.accommodation.checkInTime,
                checkOutTime: listing.accommodation.checkOutTime,
                maxGuests: listing.accommodation.maxGuests,
                cancellationPolicy: listing.accommodation.cancellationPolicy
              }}
            />
            <RoomTypeEditor
              initial={listing.accommodation.roomTypes.map((room) => ({
                name: room.name,
                priceMinor: String(room.priceMinor),
                maxOccupancy: String(room.maxOccupancy),
                totalRooms: String(room.totalRooms),
                breakfastIncluded: room.breakfastIncluded,
                description: room.description ?? ""
              }))}
            />
            <AddOnEditor
              initial={listing.accommodation.addOns.map((addOn) => ({
                name: addOn.name,
                priceMinor: String(addOn.priceMinor),
                description: addOn.description ?? ""
              }))}
            />
          </>
        ) : null}

        {listing.type === "TOUR" && listing.tour ? (
          <TourTypeFields
            guides={guides}
            initial={{
              durationDays: listing.tour.durationDays,
              groupSizeMin: listing.tour.groupSizeMin,
              groupSizeMax: listing.tour.groupSizeMax,
              difficulty: listing.tour.difficulty,
              inclusions: listing.tour.inclusions,
              exclusions: listing.tour.exclusions,
              itinerary: listing.tour.itinerary as string[] | undefined,
              guideId: listing.tour.guideId
            }}
          />
        ) : null}

        {listing.type === "RESTAURANT" && listing.restaurant ? (
          <RestaurantTypeFields
            initial={{
              cuisineType: listing.restaurant.cuisineType,
              priceRange: listing.restaurant.priceRange,
              menuUrl: listing.restaurant.menuUrl,
              seatingCapacity: listing.restaurant.seatingCapacity,
              acceptsReservationRequests: listing.restaurant.acceptsReservationRequests,
              openingHours: typeof listing.restaurant.openingHours === "string" ? listing.restaurant.openingHours : undefined
            }}
          />
        ) : null}

        {listing.type === "TRANSPORT" && listing.transport ? (
          <TransportTypeFields
            initial={{
              category: listing.transport.category,
              vehicleType: listing.transport.vehicleType,
              capacity: listing.transport.capacity,
              estimatedDurationMinutes: listing.transport.estimatedDurationMinutes,
              pricingModel: listing.transport.pricingModel
            }}
          />
        ) : null}

        {/* Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 sm:left-64 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-between gap-4">
          <div className="max-w-[1000px] w-full mx-auto flex items-center justify-between gap-4">
            <Button asChild type="button" variant="outline" className="h-12 px-8 font-semibold text-slate-700 bg-white hover:bg-slate-50 border-slate-200 rounded-lg">
              <Link href="/business/listings">Cancel</Link>
            </Button>
            <Button type="submit" className="h-12 flex-1 max-w-2xl bg-[#0B4928] hover:bg-[#0B4928]/90 text-white font-bold rounded-lg text-base shadow-sm">
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
