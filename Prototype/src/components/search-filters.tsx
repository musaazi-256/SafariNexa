"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export const PRICE_RANGES = [
  { value: "under-200000", label: "Under UGX 200,000" },
  { value: "200000-600000", label: "UGX 200,000 – 600,000" },
  { value: "600000-1500000", label: "UGX 600,000 – 1,500,000" },
  { value: "above-1500000", label: "Above UGX 1,500,000" }
];

export const RATING_TIERS = [
  { value: "exceptional", label: "Exceptional 4.5+" },
  { value: "excellent", label: "Excellent 4.0+" },
  { value: "very-good", label: "Very good 3.5+" }
];

export const PROPERTY_TYPES = [
  { value: "hotel", label: "Hotel" },
  { value: "guesthouse", label: "Guesthouse" },
  { value: "lodge", label: "Lodge" },
  { value: "apartment", label: "Apartment" }
];

export const AMENITIES = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "parking", label: "Parking" },
  { value: "breakfast", label: "Breakfast" },
  { value: "pool", label: "Swimming pool" },
  { value: "airport-transfer", label: "Airport transfer" }
];

export const LOCATIONS: Array<{value:string;label:string}> = [];

export const TOUR_TYPES = [
  { value: "wildlife", label: "Wildlife Safari" },
  { value: "primate", label: "Gorilla & Chimp Trekking" },
  { value: "cultural", label: "Cultural Tour" },
  { value: "adventure", label: "Adventure & Hiking" }
];

export const TOUR_DURATIONS = [
  { value: "1-3", label: "1-3 days" },
  { value: "4-7", label: "4-7 days" },
  { value: "8+", label: "8+ days" }
];

export const VEHICLE_TYPES = [
  { value: "suv", label: "SUV / 4x4" },
  { value: "van", label: "Safari Minivan" },
  { value: "sedan", label: "Sedan" }
];

export const CUISINES = [
  { value: "local", label: "Local Ugandan" },
  { value: "continental", label: "Continental" },
  { value: "indian", label: "Indian" },
  { value: "cafe", label: "Café & Bakery" }
];

export const GUIDE_SPECIALTIES = [
  { value: "general", label: "General guide" },
  { value: "destination-specialist", label: "Destination specialist" }
];

function CheckboxGroup({ title, param, options }: { title: string; param: string; options: Array<{ value: string; label: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected = new Set(searchParams.getAll(param));

  function toggle(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const next = new Set(selected);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    params.delete("page");
    params.delete(param);
    for (const item of next) params.append(param, item);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <fieldset className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
      <legend className="mb-3 text-sm font-semibold text-slate-900">{title}</legend>
      <div className="flex flex-col gap-1.5">
        {options.map((option) => (
          <label key={option.value} className="group flex min-h-9 md:min-h-8 items-center gap-2.5 rounded-lg px-1.5 py-1 text-sm text-slate-600 transition-colors hover:text-slate-900 has-[[data-state=checked]]:font-medium has-[[data-state=checked]]:text-slate-900 cursor-pointer">
            <Checkbox checked={selected.has(option.value)} onCheckedChange={() => toggle(option.value)} aria-label={option.label} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SearchFilters({locations=LOCATIONS}:{locations?:Array<{value:string;label:string}>}={}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "accommodation";
  
  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    for(const key of ["price","rating","propertyType","tourType","tourDuration","vehicleType","cuisine","specialty","location","amenities","page"])params.delete(key);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-5">
      <CheckboxGroup title="Price range (UGX)" param="price" options={PRICE_RANGES} />
      
      {category === "accommodation" ? (
        <>
          <CheckboxGroup title="Property type" param="propertyType" options={PROPERTY_TYPES} />
          <CheckboxGroup title="Guest rating" param="rating" options={RATING_TIERS} />
          <CheckboxGroup title="Amenities" param="amenities" options={AMENITIES} />
          {locations.length>0&&<CheckboxGroup title="Location" param="location" options={locations} />}
        </>
      ) : null}

      {category === "tours" ? (
        <>
          <CheckboxGroup title="Safari Type" param="tourType" options={TOUR_TYPES} />
          <CheckboxGroup title="Duration" param="tourDuration" options={TOUR_DURATIONS} />
          <CheckboxGroup title="Guest rating" param="rating" options={RATING_TIERS} />
        </>
      ) : null}

      {category === "transport" ? (
        <>
          <CheckboxGroup title="Vehicle Type" param="vehicleType" options={VEHICLE_TYPES} />
          <CheckboxGroup title="Guest rating" param="rating" options={RATING_TIERS} />
        </>
      ) : null}

      {category === "restaurants" ? (
        <>
          <CheckboxGroup title="Cuisine" param="cuisine" options={CUISINES} />
          <CheckboxGroup title="Guest rating" param="rating" options={RATING_TIERS} />
        </>
      ) : null}

      {category === "guides" ? (
        <>
          <CheckboxGroup title="Specialty" param="specialty" options={GUIDE_SPECIALTIES} />
          <CheckboxGroup title="Guest rating" param="rating" options={RATING_TIERS} />
        </>
      ) : null}

      <Button variant="outline" size="sm" className="h-9 w-full rounded-[6px]" disabled={!["price","rating","propertyType","tourType","tourDuration","vehicleType","cuisine","specialty","location","amenities"].some(key=>searchParams.has(key))} onClick={clearAll}>
        Clear filters
      </Button>
    </div>
  );
}
