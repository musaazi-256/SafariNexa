import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Car, Compass, UtensilsCrossed } from "lucide-react";
import type { ListingType } from "@prisma/client";

import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AddOnEditor } from "@/components/business/add-on-editor";
import {
  AccommodationTypeFields,
  ListingBaseFields,
  RestaurantTypeFields,
  TourTypeFields,
  TransportTypeFields
} from "@/components/business/listing-form-fields";
import { RoomTypeEditor } from "@/components/business/room-type-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireBusinessSession } from "@/lib/business";
import {
  parseAccommodationFields,
  parseAddOnRows,
  parseBaseFields,
  parseRestaurantFields,
  parseRoomTypeRows,
  parseTourFields,
  parseTransportFields,
  slugify
} from "@/lib/business-listing-form";
import { db } from "@/lib/db";

const TYPE_OPTIONS: Array<{ value: ListingType; label: string; description: string; icon: typeof Building2 }> = [
  { value: "ACCOMMODATION", label: "Accommodation", description: "Lodges, hotels, guesthouses — with room types and add-ons.", icon: Building2 },
  { value: "TOUR", label: "Tour", description: "Safaris, treks, and guided experiences.", icon: Compass },
  { value: "RESTAURANT", label: "Restaurant", description: "Dining spots taking reservation requests.", icon: UtensilsCrossed },
  { value: "TRANSPORT", label: "Transport", description: "Airport transfers and Kampala special hire.", icon: Car }
];

export default async function NewListingPage({ searchParams }: { searchParams: { type?: string } }) {
  const { business, businessId } = await requireBusinessSession();
  if (!business || !businessId) redirect("/business/auth/sign-in");

  const type = searchParams.type?.toUpperCase() as ListingType | undefined;

  let guides: Array<{ id: string; name: string }> = [];
  if (type === "TOUR") {
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

  async function createListing(formData: FormData) {
    "use server";
    const { businessId: activeBusinessId } = await requireBusinessSession();
    if (!activeBusinessId) redirect("/business/auth/sign-in");

    const submittedType = String(formData.get("listingType")) as ListingType;
    const base = parseBaseFields(formData);

    const typeData =
      submittedType === "ACCOMMODATION"
        ? {
            accommodation: {
              create: {
                ...parseAccommodationFields(formData),
                roomTypes: { create: parseRoomTypeRows(formData) },
                addOns: { create: parseAddOnRows(formData) }
              }
            }
          }
        : submittedType === "TOUR"
          ? { tour: { create: parseTourFields(formData) } }
          : submittedType === "RESTAURANT"
            ? { restaurant: { create: parseRestaurantFields(formData) } }
            : { transport: { create: parseTransportFields(formData) } };

    const listing = await db.listing.create({
      data: {
        businessId: activeBusinessId,
        type: submittedType,
        slug: slugify(base.title),
        status: "DRAFT",
        ...base,
        ...typeData
      }
    });

    redirect(`/business/listings/${listing.id}/edit`);
  }

  if (!type) {
    if (business.verificationStatus !== "APPROVED") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-lg mx-auto text-center space-y-6">
          <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-2">
            <Building2 className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Your account is under review</h1>
          <p className="text-slate-500 font-medium">
            You cannot create listings yet. Our admins are currently reviewing your submitted verification documents. Once you are fully approved, you will be able to start adding your services here.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/business/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      );
    }

    return (
      <>
        <Breadcrumbs items={[{ label: "Listings", href: "/business/listings" }, { label: "Create listing" }]} />
        <h1 className="mb-6 text-3xl font-extrabold">What are you listing?</h1>
        <div className="grid gap-5 sm:grid-cols-2">
          {TYPE_OPTIONS.map((option) => (
            <Link key={option.value} href={`/business/listings/new?type=${option.value.toLowerCase()}`}>
              <Card className="h-full transition-shadow hover:shadow-card-hover">
                <CardContent className="flex flex-col gap-2 pt-6">
                  <div className="flex items-center justify-between">
                    <option.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-bold">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-32">
      <Breadcrumbs
        items={[
          { label: "Listings", href: "/business/listings" },
          { label: "Create listing", href: "/business/listings/new" },
          { label: TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "" }
        ]}
      />
      <h1 className="mb-6 text-3xl font-extrabold">New {TYPE_OPTIONS.find((option) => option.value === type)?.label.toLowerCase()} listing</h1>

      <form action={createListing} className="flex flex-col gap-6">
        <input type="hidden" name="listingType" value={type} />
        <ListingBaseFields destinations={destinations} />

        {type === "ACCOMMODATION" ? (
          <>
            <AccommodationTypeFields />
            <RoomTypeEditor initial={[]} />
            <AddOnEditor initial={[]} />
          </>
        ) : null}
        {type === "TOUR" ? <TourTypeFields guides={guides} /> : null}
        {type === "RESTAURANT" ? <RestaurantTypeFields /> : null}
        {type === "TRANSPORT" ? <TransportTypeFields /> : null}

        <Button type="submit" size="lg" className="w-fit">
          Create draft listing
        </Button>
      </form>
    </div>
  );
}
