import { notFound, redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
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
import { reviewInclude } from "@/lib/listing-review";
import { revisionPreview,serializeListingForm } from "@/lib/listing-revisions";

const PREVIEW_PATH: Record<string, string> = {
  ACCOMMODATION: "accommodation",
  TOUR: "tours",
  RESTAURANT: "restaurants",
  TRANSPORT: "transport"
};

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const { business, businessId } = await requireBusinessSession();
  if (!business || !businessId) redirect("/business/auth/sign-in");

  const liveListing = await db.listing.findUnique({
    where: { id: params.id },
    include: {
      accommodation: { include: { roomTypes: true, addOns: true } },
      tour: true,
      restaurant: true,
      transport: true
    }
  });
  if (!liveListing || liveListing.businessId !== businessId) notFound();
  const listing = liveListing.draftSnapshot && liveListing.status === "PUBLISHED" ? {...liveListing,...liveListing.draftSnapshot as object} as typeof liveListing : liveListing;
  const pendingReview = await db.listingSubmission.findFirst({where: {listingId: listing.id, status: {in: ["SUBMITTED", "UNDER_REVIEW"]}}});
  if (pendingReview) return <div className="mx-auto max-w-2xl space-y-4 p-4"><h1 className="type-page ">Submission is locked during review</h1><p>Withdraw the pending submission before editing. The approved live version remains unchanged.</p><Link className="block underline" href={`/business/listings/${listing.id}/review`}>Submission & feedback</Link><Link className="block underline" href="/business/listings">Back to listings</Link></div>;

  let guides: Array<{ id: string; name: string }> = [];
  if (listing.type === "TOUR") {
    guides = await db.guide.findMany({
      where: { businessId },
      select: { id: true, name: true },
      orderBy: { name: "asc" }
    });
  }

  const destinations = await db.destination.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  async function updateListing(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/business/auth/sign-in");

    const target = await db.listing.findUnique({ where: { id: params.id } });
    if (!target || !activeSession.user.businessIds.includes(target.businessId)) throw new Error("Listing not found.");

    const membership = await db.businessUser.findFirst({ where: { businessId: target.businessId, userId: activeSession.user.id, role: { in: ["OWNER", "MANAGER"] } } });
    if (!membership) throw new Error("Only owners and managers can edit listings.");
    if(target.status === "PUBLISHED") {
      await db.$transaction(async tx=>{
        const current=await tx.listing.findUniqueOrThrow({where:{id:target.id},include:reviewInclude});
        if(current.status!=="PUBLISHED"||await tx.listingSubmission.findFirst({where:{listingId:target.id,status:{in:["SUBMITTED","UNDER_REVIEW"]}}}))throw new Error("Listing changed or is already awaiting review.");
        const draftSnapshot=await revisionPreview(tx,current,formData);
        await tx.listing.update({where:{id:target.id},data:{draftForm:serializeListingForm(formData),draftSnapshot}});
      },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
      redirect(`/business/listings/${target.id}/review`);
    }
    if (target.status !== "DRAFT" || await db.listingSubmission.findFirst({where: {listingId: target.id, status: {in: ["SUBMITTED", "UNDER_REVIEW"]}}})) throw new Error("Unpublish or withdraw the pending submission before editing.");
    const base = parseBaseFields(formData);
    async function saveBase(tx: Prisma.TransactionClient) {
      const changed = await tx.listing.updateMany({where: {id: target!.id, status: "DRAFT", updatedAt: target!.updatedAt, submissions: {none: {status: {in: ["SUBMITTED", "UNDER_REVIEW"]}}}}, data: base});
      if (changed.count !== 1) throw new Error("The listing changed or is awaiting review. Refresh before editing.");
    }


    if (target.type === "ACCOMMODATION") {
      const fields = parseAccommodationFields(formData);


      const roomTypeRows = parseRoomTypeRows(formData);
      const addOnRows = parseAddOnRows(formData);
      
      const incomingRoomIds = roomTypeRows.map((r) => r.id).filter(Boolean) as string[];
      const incomingAddOnIds = addOnRows.map((a) => a.id).filter(Boolean) as string[];

      await db.$transaction(async (tx) => {
        // Find existing to check for bookings before deleting
        const existingRooms = await tx.roomType.findMany({
          where: { accommodationId: target.id },
          include: { _count: { select: { bookings: true } } }
        });
        const existingAddOns = await tx.addOn.findMany({
          where: { accommodationId: target.id },
          include: { _count: { select: { bookingAddOns: true } } }
        });

        if (incomingRoomIds.some(id => !existingRooms.some(r => r.id === id)) || incomingAddOnIds.some(id => !existingAddOns.some(a => a.id === id))) throw new Error("Invalid room or add-on selection.");
        await saveBase(tx);
        await tx.accommodationListing.update({ where: { listingId: target.id }, data: fields });
        const roomsToDelete = existingRooms.filter((r) => !incomingRoomIds.includes(r.id) && r._count.bookings === 0);
        const addOnsToDelete = existingAddOns.filter((a) => !incomingAddOnIds.includes(a.id) && a._count.bookingAddOns === 0);

        if (roomsToDelete.length > 0) {
          await tx.roomType.deleteMany({ where: { id: { in: roomsToDelete.map((r) => r.id) } } });
        }
        if (addOnsToDelete.length > 0) {
          await tx.addOn.deleteMany({ where: { id: { in: addOnsToDelete.map((a) => a.id) } } });
        }

        for (const row of roomTypeRows) {
          if (row.id) {
            const { id, ...data } = row;
            await tx.roomType.update({ where: { id }, data });
          } else {
            await tx.roomType.create({ data: { ...row, accommodationId: target.id } });
          }
        }

        for (const row of addOnRows) {
          if (row.id) {
            const { id, ...data } = row;
            await tx.addOn.update({ where: { id }, data });
          } else {
            await tx.addOn.create({ data: { ...row, accommodationId: target.id } });
          }
        }
      }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});
    } else if (target.type === "TOUR") {
      const parsedTourData = parseTourFields(formData);
      if (parsedTourData.guideId) {
        const guide = await db.guide.findUnique({ where: { id: parsedTourData.guideId } });
        if (!guide || guide.businessId !== target.businessId) {
          throw new Error("Invalid guide selected.");
        }
      }
      await db.$transaction(async tx => { await saveBase(tx); await tx.tourListing.update({ where: {listingId: target.id}, data: parsedTourData }); }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});
    } else if (target.type === "RESTAURANT") {
      await db.$transaction(async tx => { await saveBase(tx); await tx.restaurantProfile.update({where: {listingId: target.id}, data: parseRestaurantFields(formData)}); }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});
    } else if (target.type === "TRANSPORT") {
      await db.$transaction(async tx => { await saveBase(tx); await tx.transportOption.update({where: {listingId: target.id}, data: parseTransportFields(formData)}); }, {isolationLevel: Prisma.TransactionIsolationLevel.Serializable});
    }

    redirect(`/business/listings/${target.id}/review`);
  }

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <p className="mb-4 rounded border p-4">Save your changes, then <Link className="underline" href={`/business/listings/${listing.id}/review`}>preview and submit the listing and all photos for approval</Link>. Uploading photos does not publish or approve them.</p>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-8">
        <Link href="/business/dashboard" className="hover:text-slate-900 transition-colors">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/business/listings" className="hover:text-slate-900 transition-colors">Listings</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-900 font-semibold">{listing.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="type-page text-slate-900 mb-1">
            Edit {typeLabel(listing.type)} listing
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Update your listing details to keep your information accurate and up to date.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 font-medium text-xs tracking-wider uppercase text-[#0B4928]">
            {listing.status}
          </div>
          <Button asChild variant="outline" size="sm"><Link href={`/${PREVIEW_PATH[listing.type]}/${listing.id}`}>View public listing</Link></Button>
        </div>
      </div>

      {["ACCOMMODATION", "TOUR"].includes(listing.type) && <Button asChild variant="outline" className="mb-5"><Link href={`/business/listings/${listing.id}/availability`}>Manage availability and date pricing</Link></Button>}
      <form action={updateListing} className="flex flex-col gap-6">
        <ListingBaseFields
          destinations={destinations}
          previewHref={`/${PREVIEW_PATH[listing.type]}/${listing.id}`}
          initial={{
            title: listing.title,
            bookingMode: listing.bookingMode,
            description: listing.description,
            city: listing.city ?? undefined,
            address: listing.address ?? undefined,
            latitude: listing.latitude,
            longitude: listing.longitude,
            basePriceMinor: listing.basePriceMinor,
            coverImageUrl: listing.coverImageUrl,
            images: listing.images,
            destinationId: listing.destinationId
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
                id: room.id,
                name: room.name,
                priceMinor: String(room.priceMinor),
                maxOccupancy: String(room.maxOccupancy),
                totalRooms: String(room.totalRooms),
                breakfastIncluded: room.breakfastIncluded,
                description: room.description ?? "",
                images: room.images,
                bedType: room.bedType ?? "1 Double Bed",
                bedrooms: String(room.bedrooms),
                roomFeatures: room.roomFeatures,
                isRefundable: room.isRefundable,
                refundPolicyText: room.refundPolicyText ?? "",
                discountNotice: room.discountNotice ?? ""
              }))}
            />
            <AddOnEditor
              initial={listing.accommodation.addOns.map((addOn) => ({
                id: addOn.id,
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
              tourType: listing.tour.tourType,
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
              openingHours: typeof listing.restaurant.openingHours === "object" && listing.restaurant.openingHours && "summary" in listing.restaurant.openingHours ? String(listing.restaurant.openingHours.summary) : typeof listing.restaurant.openingHours === "string" ? listing.restaurant.openingHours : undefined,
              reservationDurationMinutes: typeof listing.restaurant.openingHours === "object" && listing.restaurant.openingHours && "reservationDurationMinutes" in listing.restaurant.openingHours ? Number(listing.restaurant.openingHours.reservationDurationMinutes) : 90
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
        <div className="fixed bottom-0 left-0 right-0 sm:left-64 p-4 bg-white/80 backdrop-blur-md border-t border-border z-50 flex items-center justify-between gap-4">
          <div className="max-w-4xl w-full mx-auto flex items-center justify-between gap-4">
            <Button asChild type="button" variant="outline" className="h-12 px-8 font-medium text-slate-700 bg-white hover:bg-slate-50 border-border rounded-lg">
              <Link href="/business/listings">Cancel</Link>
            </Button>
            <Button type="submit" className="h-12 flex-1 max-w-2xl bg-[#0B4928] hover:bg-[#0B4928]/90 text-white font-medium rounded-lg text-base shadow-sm">
              Save changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
