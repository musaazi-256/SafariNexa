"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

import { SaveButton } from "@/components/save-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatUGX } from "@/lib/booking";
import type { ListingTypeParam } from "@/lib/booking";
import { useCartStore } from "@/lib/cart";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function SimpleReservationFields({
  listingId,
  listingType,
  listingTitle,
  listingImage,
  actionLabel,
  isSignedIn,
  participantLabel,
  participantMin,
  participantMax,
  showTime = false,
  priceMinor,
  priceUnitLabel = "per person",
  initial,
  note,
  isSaved
}: {
  listingId: string;
  listingType: ListingTypeParam;
  listingTitle: string;
  listingImage?: string;
  actionLabel: string;
  isSignedIn: boolean;
  participantLabel: string;
  participantMin: number;
  participantMax: number;
  showTime?: boolean;
  /** When provided, shows a live price × participants breakdown. Omit for range/fixed-fare pricing. */
  priceMinor?: number;
  priceUnitLabel?: string;
  initial?: { date?: string; time?: string; participants?: string };
  note?: string;
  /** Signed-in save state — when set, a "Save" toggle is shown above the action button. */
  isSaved?: boolean;
}) {
  const [date, setDate] = React.useState(initial?.date ?? "");
  const [time, setTime] = React.useState(initial?.time ?? "");
  const [participants, setParticipants] = React.useState(initial?.participants ?? String(participantMin));

  const canReserve = Boolean(date && date >= todayIsoDate() && (!showTime || time));
  const isFixedFare = listingType === "transport" && !priceUnitLabel.includes("person") && !priceUnitLabel.includes("passenger");
  const total = listingType === "restaurant" ? 0 : priceMinor !== undefined ? priceMinor * (isFixedFare ? 1 : Number(participants)) : undefined;
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const handleAddToCart = (checkout = false) => {
    if (!canReserve) return;
    
    addItem({
      listingId,
      type: listingType,
      title: listingTitle,
      image: listingImage,
      startDate: date,
      endDate: date, // For simple reservations, start and end date are the same
      time: showTime ? time : undefined,
      participants: Number(participants),
      participantMin,
      participantMax,
      pricingBasis: isFixedFare ? "fixed" : "per_person",
      addOnIds: [],
      totalMinor: total ?? 0,
      unitPriceMinor: priceMinor
    });
    
    const added = useCartStore.getState().items.at(-1);
    router.push(checkout && added ? `/checkout/multi?itemId=${encodeURIComponent(added.id)}` : "/cart");
  };

  const options = Array.from({ length: participantMax - participantMin + 1 }, (_, index) => participantMin + index);

  return (
    <div className="flex flex-col gap-4">
      <div className={showTime ? "grid grid-cols-2 gap-3" : "flex flex-col gap-1"}>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <div className="field-shell">
            <input
              type="date"
              name="date"
              aria-label="Reservation date"
              min={todayIsoDate()}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full bg-transparent text-base md:text-sm font-medium outline-none"
              required
            />
          </div>
        </div>
        {showTime ? (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Time</label>
            <div className="field-shell">
              <input
                type="time"
                name="time"
                aria-label="Reservation time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="w-full bg-transparent text-base md:text-sm font-medium outline-none"
                required
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">{participantLabel}</label>
        <div className="field-shell">
          <select
            name="participants"
            aria-label={participantLabel}
            value={participants}
            onChange={(event) => setParticipants(event.target.value)}
            className="w-full appearance-none bg-transparent text-base md:text-sm font-medium outline-none"
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {typeof total === "number" ? (
        <>
          <Separator />
          <div className="flex flex-col gap-1.5 text-sm">
            {listingType !== "restaurant" && <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {formatUGX(priceMinor ?? 0)} ({priceUnitLabel}) × {isFixedFare ? 1 : participants}
              </span>
              <span>{formatUGX(total)}</span>
            </div>}
            <div className="flex items-center justify-between text-base font-semibold">
              <span>{listingType === "restaurant" ? "Table reservation · meals paid separately" : "Total"}</span>
              <span>{formatUGX(total)}</span>
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-2 flex flex-col gap-3">
        <Separator />
        
        <div className="flex items-center gap-2">
          {canReserve ? (
            <Button size="lg" variant="secondary" className="flex-1 font-medium bg-secondary hover:bg-secondary/80" onClick={() => handleAddToCart()}>
              Add to cart
            </Button>
          ) : (
            <Button size="lg" variant="secondary" className="flex-1 font-medium opacity-50" disabled>
              Add to cart
            </Button>
          )}

          {isSaved !== undefined ? (
            <div className="h-11 w-11 shrink-0">
              <SaveButton 
                listingId={listingId} 
                initialSaved={isSaved} 
                className="h-full w-full rounded-xl border border-input bg-transparent shadow-sm hover:bg-secondary flex items-center justify-center" 
              />
            </div>
          ) : null}
        </div>

        {canReserve ? (
          <Button size="lg" className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-medium" onClick={() => handleAddToCart(true)}>
            Reserve
          </Button>
        ) : (
          <div className="rounded-xl bg-secondary p-3 text-center text-sm text-muted-foreground font-medium">
            Please select a {showTime ? "date and time" : "date"} first
          </div>
        )}

        {!isSignedIn ? (
          <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Guests can add items to cart — signing in only happens during checkout.</span>
          </div>
        ) : null}
      </div>
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}
