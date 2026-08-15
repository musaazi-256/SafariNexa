"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Car,
  ChevronDown,
  Clock,
  Compass,
  IdCard,
  MapPin,
  Search,
  Users,
  UtensilsCrossed
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CategoryId = "accommodation" | "tours" | "restaurants" | "transport" | "guides";
type TransportSubcategory = "airport" | "special";

const CATEGORIES: Array<{ id: CategoryId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "accommodation", label: "Accommodation", icon: Building2 },
  { id: "tours", label: "Safaris & Tours", icon: Compass },
  { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { id: "transport", label: "Transport", icon: Car },
  { id: "guides", label: "Tour Guides", icon: IdCard }
];

const GUEST_OPTIONS = ["1", "2", "3", "4", "5", "6"];

function Field({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-1 flex-col justify-center px-6 py-3 hover:bg-muted/50 transition-colors", className)}>
      <label className="text-xs font-bold tracking-wide text-foreground">{label}</label>
      <div className="flex items-center mt-0.5">
        {children}
      </div>
    </div>
  );
}

function TextField(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...inputProps } = props;
  return (
    <Field label={label} className={className}>
      <input {...inputProps} className="w-full bg-transparent text-sm font-medium text-muted-foreground outline-none placeholder:text-muted-foreground/70" />
    </Field>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  className
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <div className="relative w-full">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none bg-transparent pr-5 text-sm font-medium text-muted-foreground outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </Field>
  );
}

const guestOptions = (noun: string) => GUEST_OPTIONS.map((value) => ({ value, label: `${value} ${Number(value) === 1 ? noun : `${noun}s`}` }));

export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const [category, setCategory] = React.useState<CategoryId>("accommodation");

  // Accommodation
  const [destination, setDestination] = React.useState("");
  const [checkIn, setCheckIn] = React.useState("");
  const [checkOut, setCheckOut] = React.useState("");
  const [guests, setGuests] = React.useState("2");

  // Safaris & Tours
  const [tourDestination, setTourDestination] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [tourGuests, setTourGuests] = React.useState("2");

  // Restaurants
  const [area, setArea] = React.useState("");
  const [reservationDate, setReservationDate] = React.useState("");
  const [reservationTime, setReservationTime] = React.useState("");
  const [partySize, setPartySize] = React.useState("2");

  // Transport
  const [transportSubcategory, setTransportSubcategory] = React.useState<TransportSubcategory>("airport");
  const [pickup, setPickup] = React.useState("");
  const [dropoff, setDropoff] = React.useState("");
  const [transportDate, setTransportDate] = React.useState("");
  const [transportTime, setTransportTime] = React.useState("");
  const [duration, setDuration] = React.useState("2");
  const [passengers, setPassengers] = React.useState("1");

  // Tour Guides
  const [guideDestination, setGuideDestination] = React.useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (category === "guides") {
      const params = new URLSearchParams();
      if (guideDestination) params.set("q", guideDestination);
      router.push(`/guides${params.toString() ? `?${params.toString()}` : ""}`);
      return;
    }

    const params = new URLSearchParams();
    params.set("category", category);

    if (category === "accommodation") {
      if (destination) params.set("q", destination);
      if (checkIn) params.set("checkIn", checkIn);
      if (checkOut) params.set("checkOut", checkOut);
      params.set("guests", guests);
    } else if (category === "tours") {
      if (tourDestination) params.set("q", tourDestination);
      if (startDate) params.set("startDate", startDate);
      params.set("guests", tourGuests);
    } else if (category === "restaurants") {
      if (area) params.set("q", area);
      if (reservationDate) params.set("date", reservationDate);
      if (reservationTime) params.set("time", reservationTime);
      params.set("guests", partySize);
    } else if (category === "transport") {
      params.set("transportCategory", transportSubcategory);
      if (pickup) params.set("pickup", pickup);
      if (transportSubcategory === "airport" && dropoff) params.set("dropoff", dropoff);
      if (transportSubcategory === "special") params.set("duration", duration);
      if (transportDate) params.set("date", transportDate);
      if (transportTime) params.set("time", transportTime);
      params.set("passengers", passengers);
    }

    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-2">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
              category === item.id
                ? "border-transparent bg-[#0B4928] text-white"
                : "border-border bg-card text-foreground hover:bg-secondary"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row sm:items-center rounded-3xl sm:rounded-full border border-border bg-card shadow-sm overflow-hidden">
        {category === "transport" ? (
          <div className="flex border-b border-border sm:border-b-0 sm:border-r p-3 gap-2">
            {(
              [
                { id: "airport", label: "Airport transfer" },
                { id: "special", label: "Special hire (hourly)" }
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTransportSubcategory(option.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                  transportSubcategory === option.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row flex-1 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {category === "accommodation" ? (
            <>
              <TextField label="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Where in East Africa?" className="sm:rounded-l-full sm:min-w-[200px]" />
              <TextField label="Check-in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              <TextField label="Check-out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              <SelectField label="Guests" value={guests} onChange={setGuests} options={guestOptions("Adult")} />
            </>
          ) : null}

          {category === "tours" ? (
            <>
              <TextField label="Destination" value={tourDestination} onChange={(e) => setTourDestination(e.target.value)} placeholder="Where in East Africa?" className="sm:rounded-l-full" />
              <TextField label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <SelectField label="Guests" value={tourGuests} onChange={setTourGuests} options={guestOptions("Adult")} />
            </>
          ) : null}

          {category === "restaurants" ? (
            <>
              <TextField label="Area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Where in East Africa?" className="sm:rounded-l-full" />
              <TextField label="Date" type="date" value={reservationDate} onChange={(e) => setReservationDate(e.target.value)} />
              <TextField label="Time" type="time" value={reservationTime} onChange={(e) => setReservationTime(e.target.value)} />
              <SelectField label="Guests" value={partySize} onChange={setPartySize} options={guestOptions("Adult")} />
            </>
          ) : null}

          {category === "transport" ? (
            <>
              <TextField label="Pick up" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Pickup location" />
              {transportSubcategory === "airport" ? (
                <TextField label="Drop-off" value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="Drop-off location" />
              ) : (
                <SelectField
                  label="Duration"
                  value={duration}
                  onChange={setDuration}
                  options={["2", "4", "6", "8"].map((value) => ({ value, label: `${value} hours` }))}
                />
              )}
              <TextField label="Date" type="date" value={transportDate} onChange={(e) => setTransportDate(e.target.value)} />
              <TextField label="Time" type="time" value={transportTime} onChange={(e) => setTransportTime(e.target.value)} />
              <SelectField label="Passengers" value={passengers} onChange={setPassengers} options={guestOptions("Adult")} />
            </>
          ) : null}

          {category === "guides" ? (
            <>
              <TextField label="Destination" value={guideDestination} onChange={(e) => setGuideDestination(e.target.value)} placeholder="Where in East Africa?" className="sm:rounded-l-full" />
            </>
          ) : null}
        </div>

        <div className="p-2 sm:p-2 sm:shrink-0 bg-card sm:bg-transparent">
          <Button type="submit" size="lg" className="w-full sm:w-auto rounded-full px-8 h-12 text-base font-bold bg-primary hover:bg-[#066130]">
            <Search className="h-5 w-5 mr-2" />
            Search stays
          </Button>
        </div>
      </form>
    </div>
  );
}
