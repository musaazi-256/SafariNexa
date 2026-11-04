import { ListingLocationFields } from "./listing-location-fields";
import type { ListingType } from "@prisma/client";
import { FileText, Utensils, Bed, Tent, Car, Eye, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/image-uploader";
function ExistingOption({value,known}: {value?:string|null;known:string[]}) {return value && !known.includes(value) ? <option value={value}>{value} (current)</option> : null;}

export type ListingBaseInitial = {
  title?: string;
  bookingMode?: string;
  description?: string;
  city?: string;
  address?: string;
  locationDirections?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  basePriceMinor?: number;
  coverImageUrl?: string | null;
  images?: string[];
  destinationId?: string | null;
};

export function ListingBaseFields({
  initial,
  previewHref
}: {
  initial?: ListingBaseInitial;
  /** Only known once a listing exists (edit mode) — omitted on create, so the
   * button doesn't render for a listing that has no page to preview yet. */
  previewHref?: string;
}) {
  return (
    <Card className="rounded-2xl shadow-card border-border">
      <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Listing details</CardTitle>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">Basic information about your listing.</p>
          </div>
        </div>
        {previewHref ? (
          <Button variant="outline" size="sm" asChild className="hidden sm:flex text-slate-700 font-medium border-border">
            <a href={previewHref} target="_blank" rel="noreferrer">
              <Eye className="h-4 w-4 mr-2" /> Preview listing
            </a>
          </Button>
        ) : null}
      </CardHeader>
      
      <CardContent className="grid gap-6 sm:grid-cols-2 pt-6">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="title" className="font-medium text-slate-700">Title <span className="text-red-500">*</span></Label>
          </div>
          <div className="relative">
            <Input id="title" name="title" defaultValue={initial?.title} required className="pr-16" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 pointer-events-none">
              28 / 100
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="description" className="font-medium text-slate-700">Description <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Textarea id="description" name="description" defaultValue={initial?.description} required rows={5} className="resize-none pb-8" />
            <span className="absolute right-3 bottom-3 text-xs font-medium text-slate-500 pointer-events-none">
              105 / 500
            </span>
          </div>
        </div>

        <ListingLocationFields initial={initial} />
        {initial?.destinationId ? <input type="hidden" name="destinationId" value={initial.destinationId} /> : null}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="basePriceMinor" className="font-medium text-slate-700">Base price (UGX) <span className="text-red-500">*</span></Label>
          <Input id="basePriceMinor" name="basePriceMinor" type="number" min={0} defaultValue={initial?.basePriceMinor} required />
        </div>

        <div className="flex flex-col gap-1.5"><Label htmlFor="bookingMode">Booking mode (reviewed by admin)</Label><select id="bookingMode" name="bookingMode" defaultValue={initial?.bookingMode || "REQUEST"} className="form-control"><option value="REQUEST">Request to book — accept before payment</option><option value="INSTANT">Instant — payment confirms availability</option></select><p className="text-xs text-muted-foreground">Use Instant only with reliably maintained inventory. Restaurants always use table-reservation requests with no online meal charge.</p></div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="coverImageUrl" className="font-medium text-slate-700">Cover photo</Label>
          <ImageUploader name="coverImageUrl" multiple={false} defaultValue={initial?.coverImageUrl ?? ""} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="images" className="font-medium text-slate-700">Gallery photos</Label>
          <p className="text-xs text-slate-500 mb-1">Add up to 10 high-quality photos to showcase your property.</p>
          <ImageUploader name="images" multiple={true} defaultValue={initial?.images ?? []} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AccommodationTypeFields({
  initial
}: {
  initial?: {
    propertyType?: string;
    amenities?: string[];
    checkInTime?: string | null;
    checkOutTime?: string | null;
    maxGuests?: number;
    cancellationPolicy?: string | null;
  };
}) {
  return (
    <Card className="rounded-2xl shadow-card border-border">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Bed className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Accommodation details</CardTitle>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">More information to help travelers know what to expect.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 pt-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="propertyType" className="font-medium text-slate-700">Property type <span className="text-red-500">*</span></Label>
          <select
            id="propertyType"
            name="propertyType"
            defaultValue={initial?.propertyType ?? "Lodge"}
            className="form-control flex w-full ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ExistingOption value={initial?.propertyType} known={["hotel","guesthouse","lodge","apartment"]}/>
            <option value="hotel">Hotel</option>
            <option value="guesthouse">Guesthouse</option>
            <option value="lodge">Lodge</option>
            <option value="apartment">Apartment</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maxGuests" className="font-medium text-slate-700">Max guests <span className="text-red-500">*</span></Label>
          <Input id="maxGuests" name="maxGuests" type="number" min={1} defaultValue={initial?.maxGuests ?? 2} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="checkInTime" className="font-medium text-slate-700">Check-in time <span className="text-red-500">*</span></Label>
          <Input id="checkInTime" name="checkInTime" placeholder="14:00" defaultValue={initial?.checkInTime ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="checkOutTime" className="font-medium text-slate-700">Check-out time <span className="text-red-500">*</span></Label>
          <Input id="checkOutTime" name="checkOutTime" placeholder="11:00" defaultValue={initial?.checkOutTime ?? ""} />
        </div>
        <div className="flex flex-col gap-3 sm:col-span-2">
          <Label className="font-medium text-slate-700">Amenities</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { value: "wifi", label: "Wi-Fi" },
              { value: "parking", label: "Parking" },
              { value: "breakfast", label: "Breakfast" },
              { value: "pool", label: "Swimming pool" },
              { value: "airport-transfer", label: "Airport transfer" },
              ...(initial?.amenities ?? []).filter(value=>!["wifi","parking","breakfast","pool","airport-transfer"].includes(value)).map(value=>({value,label:value}))
            ].map((amenity) => (
              <label key={amenity.value} className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="amenities"
                  value={amenity.value}
                  defaultChecked={initial?.amenities?.includes(amenity.value) ?? false}
                  className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                />
                {amenity.label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="cancellationPolicy" className="font-medium text-slate-700">Cancellation policy</Label>
          <Textarea id="cancellationPolicy" name="cancellationPolicy" defaultValue={initial?.cancellationPolicy ?? ""} />
        </div>
      </CardContent>
    </Card>
  );
}

export function TourTypeFields({
  initial,
  guides = []
}: {
  initial?: {
    durationDays?: number;
    tourType?: string | null;
    groupSizeMin?: number;
    groupSizeMax?: number;
    difficulty?: string | null;
    inclusions?: string[];
    exclusions?: string[];
    itinerary?: string[];
    guideId?: string | null;
  };
  guides?: Array<{ id: string; name: string }>;
}) {
  return (
    <Card className="rounded-2xl shadow-card border-border">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Tent className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Tour details</CardTitle>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">More information to help travelers know what to expect.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 pt-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tourType" className="font-medium text-slate-700">Safari type <span className="text-red-500">*</span></Label>
          <select
            id="tourType"
            name="tourType"
            defaultValue={initial?.tourType ?? "wildlife"}
            className="form-control flex w-full ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ExistingOption value={initial?.tourType} known={["wildlife","primate","cultural","adventure"]}/>
            <option value="wildlife">Wildlife Safari</option>
            <option value="primate">Gorilla & Chimp Trekking</option>
            <option value="cultural">Cultural Tour</option>
            <option value="adventure">Adventure & Hiking</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="durationDays" className="font-medium text-slate-700">Duration (days) <span className="text-red-500">*</span></Label>
          <Input id="durationDays" name="durationDays" type="number" min={1} defaultValue={initial?.durationDays ?? 1} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="difficulty" className="font-medium text-slate-700">Difficulty <span className="text-red-500">*</span></Label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={initial?.difficulty ?? "Moderate"}
            className="form-control flex w-full ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ExistingOption value={initial?.difficulty} known={["Easy","Moderate","Strenuous","Extreme"]}/>
            <option value="Easy">Easy</option>
            <option value="Moderate">Moderate</option>
            <option value="Strenuous">Strenuous</option>
            <option value="Extreme">Extreme</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="groupSizeMin" className="font-medium text-slate-700">Group size — min <span className="text-red-500">*</span></Label>
          <Input id="groupSizeMin" name="groupSizeMin" type="number" min={1} defaultValue={initial?.groupSizeMin ?? 1} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="groupSizeMax" className="font-medium text-slate-700">Group size — max <span className="text-red-500">*</span></Label>
          <Input id="groupSizeMax" name="groupSizeMax" type="number" min={1} defaultValue={initial?.groupSizeMax ?? 12} required />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="inclusions" className="font-medium text-slate-700">Included (one per line)</Label>
          <Textarea id="inclusions" name="inclusions" defaultValue={initial?.inclusions?.join("\n") ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="exclusions" className="font-medium text-slate-700">Not included (one per line)</Label>
          <Textarea id="exclusions" name="exclusions" defaultValue={initial?.exclusions?.join("\n") ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="itinerary" className="font-medium text-slate-700">Itinerary (one day per line)</Label>
          <Textarea id="itinerary" name="itinerary" defaultValue={initial?.itinerary?.join("\n") ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="guideId" className="font-medium text-slate-700">Assigned Guide</Label>
          <select
            id="guideId"
            name="guideId"
            defaultValue={initial?.guideId ?? ""}
            className="form-control flex w-full ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">No guide assigned</option>
            {guides.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}

export function RestaurantTypeFields({
  initial
}: {
  initial?: {
    cuisineType?: string | null;
    priceRange?: string | null;
    menuUrl?: string | null;
    seatingCapacity?: number | null;
    acceptsReservationRequests?: boolean;
    openingHours?: string | null;
    reservationDurationMinutes?: number;
  };
}) {
  return (
    <Card className="rounded-2xl shadow-card border-border">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Utensils className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Restaurant details</CardTitle>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">More information to help travelers know what to expect.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 pt-6">
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="type-label mb-2 font-medium text-slate-700">Cuisine types <span className="text-red-500">*</span></legend>
          <input type="hidden" name="restaurantCuisineRequired" value="true" />
          <p className="text-xs text-muted-foreground">Select all cuisines you serve.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {value: "local", label: "Local Ugandan"},
              {value: "continental", label: "Continental"},
              {value: "indian", label: "Indian"},
              {value: "cafe", label: "Café & Bakery"},
              ...(initial?.cuisineType?.split(",").map(value => value.trim()).filter(value => value && !["local", "continental", "indian", "cafe"].includes(value)) || []).map(value => ({value, label: value}))
            ].map(option => <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 text-sm hover:bg-muted/30">
              <Checkbox name="cuisineType" value={option.value} defaultChecked={initial?.cuisineType?.split(",").map(value => value.trim()).includes(option.value) || false} />
              {option.label}
            </label>)}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="priceRange" className="font-medium text-slate-700">Price / price range (UGX) <span className="text-red-500">*</span></Label>
          <Input id="priceRange" name="priceRange" defaultValue={initial?.priceRange ?? ""} required maxLength={200} placeholder="e.g. UGX 25,000 per person or UGX 20,000–60,000 per meal" />
          <p className="text-xs text-muted-foreground">Enter your own price or range and state what it covers.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="openingHours" className="font-medium text-slate-700">Opening hours <span className="text-red-500">*</span></Label>
          <p className="text-xs text-muted-foreground">Online reservations currently support daily hours, for example Daily · 08:00 - 22:00. Times are East Africa Time.</p>
          <select
            id="openingHours"
            name="openingHours"
            defaultValue={initial?.openingHours ?? "Daily · 08:00 - 22:00"}
            className="form-control flex w-full ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ExistingOption value={initial?.openingHours} known={["Daily · 08:00 - 22:00","Daily · 10:00 - 23:00","Weekdays only","Weekends only"]}/>
            <option value="Daily · 08:00 - 22:00">Daily · 08:00 - 22:00</option>
            <option value="Daily · 10:00 - 23:00">Daily · 10:00 - 23:00</option>
            <option value="Weekdays only">Weekdays only</option>
            <option value="Weekends only">Weekends only</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reservationDurationMinutes">Reservation duration (minutes)</Label>
          <Input id="reservationDurationMinutes" name="reservationDurationMinutes" type="number" min={30} max={240} defaultValue={initial?.reservationDurationMinutes ?? 90} required />
          <Label htmlFor="seatingCapacity" className="font-medium text-slate-700">Seating capacity <span className="text-red-500">*</span></Label>
          <Input id="seatingCapacity" name="seatingCapacity" type="number" min={1} defaultValue={initial?.seatingCapacity ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="menuUrl" className="font-medium text-slate-700">Menu URL (optional)</Label>
          <Input id="menuUrl" name="menuUrl" type="url" defaultValue={initial?.menuUrl ?? ""} placeholder="https://" />
        </div>
        <div className="sm:col-span-2 mt-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center mt-0.5">
              <input
                type="checkbox"
                name="acceptsReservationRequests"
                defaultChecked={initial?.acceptsReservationRequests ?? true}
                className="peer h-5 w-5 appearance-none rounded-md border-2 border-[#0B4928] bg-white checked:bg-[#0B4928] checked:border-[#0B4928] transition-all"
              />
              <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900 group-hover:text-black">Accepts reservation requests</span>
              <span className="text-sm text-slate-500">Customers will be able to send booking/reservation requests for this listing.</span>
            </div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

export function TransportTypeFields({
  initial
}: {
  initial?: {
    category?: string;
    vehicleType?: string;
    capacity?: number;
    estimatedDurationMinutes?: number | null;
    pricingModel?: string | null;
  };
}) {
  return (
    <Card className="rounded-2xl shadow-card border-border">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Car className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Transport details</CardTitle>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">More information to help travelers know what to expect.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2 pt-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="category" className="font-medium text-slate-700">Category <span className="text-red-500">*</span></Label>
          <select
            id="category"
            name="category"
            defaultValue={initial?.category ?? "AIRPORT_TRANSFER"}
            className="form-control flex w-full ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="AIRPORT_TRANSFER">Airport transfer</option>
            <option value="KAMPALA_SPECIAL_HIRE">Kampala special hire</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="vehicleType" className="font-medium text-slate-700">Vehicle type <span className="text-red-500">*</span></Label>
          <select
            id="vehicleType"
            name="vehicleType"
            defaultValue={initial?.vehicleType ?? "suv"}
            className="form-control flex w-full ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ExistingOption value={initial?.vehicleType} known={["suv","van","sedan"]}/>
            <option value="suv">SUV / 4x4</option>
            <option value="van">Safari Minivan</option>
            <option value="sedan">Sedan</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="capacity" className="font-medium text-slate-700">Passenger capacity <span className="text-red-500">*</span></Label>
          <Input id="capacity" name="capacity" type="number" min={1} defaultValue={initial?.capacity ?? 4} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estimatedDurationMinutes" className="font-medium text-slate-700">Estimated duration (minutes)</Label>
          <Input id="estimatedDurationMinutes" name="estimatedDurationMinutes" type="number" min={0} defaultValue={initial?.estimatedDurationMinutes ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="pricingModel" className="font-medium text-slate-700">Fare notes</Label>
          <Textarea id="pricingModel" name="pricingModel" defaultValue={initial?.pricingModel ?? ""} />
        </div>
      </CardContent>
    </Card>
  );
}

export function typeLabel(type: ListingType) {
  return type === "ACCOMMODATION" ? "Accommodation" : type === "TOUR" ? "Tour" : type === "RESTAURANT" ? "Restaurant" : "Transport";
}
