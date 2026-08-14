"use client";

import * as React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

import { AvailabilityCalendar } from "@/components/rooms/availability-calendar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SaveButton } from "@/components/save-button";
import { RoomDetailsModal } from "@/components/rooms/room-details-modal";
import { formatUGX, nightsBetween } from "@/lib/booking";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart";

export type RoomTypeOption = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  priceMinor: number;
  maxOccupancy: number;
  breakfastIncluded: boolean;
  bookedDates?: string[];
};

export type AddOnOption = {
  id: string;
  name: string;
  description: string | null;
  priceMinor: number;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function dayAfter(date: string) {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function AccommodationReservationFields({
  mode,
  listingId,
  listingTitle,
  listingImage,
  basePriceMinor,
  maxGuests,
  roomTypes,
  addOns,
  initial,
  isSignedIn,
  actionLabel = "Add to Cart",
  isSaved
}: {
  mode: "link" | "form";
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  basePriceMinor: number;
  maxGuests: number;
  roomTypes: RoomTypeOption[];
  addOns: AddOnOption[];
  initial?: {
    startDate?: string;
    endDate?: string;
    participants?: string;
    roomTypeId?: string;
    addOnIds?: string[];
  };
  isSignedIn?: boolean;
  actionLabel?: string;
  isSaved?: boolean;
}) {
  const [startDate, setStartDate] = React.useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = React.useState(initial?.endDate ?? "");
  const [participants, setParticipants] = React.useState(initial?.participants ?? "2");
  const [roomTypeId, setRoomTypeId] = React.useState(initial?.roomTypeId ?? roomTypes[0]?.id ?? "");
  const [addOnIds, setAddOnIds] = React.useState(() => new Set(initial?.addOnIds ?? []));

  const participantsNum = Number(participants) || 1;
  const overallMaxGuests = Math.max(maxGuests, ...roomTypes.map((room) => room.maxOccupancy), 1);
  const selectedRoom = roomTypes.find((room) => room.id === roomTypeId);
  const selectedRoomFits = !selectedRoom || selectedRoom.maxOccupancy >= participantsNum;
  const unitPriceMinor = selectedRoom?.priceMinor ?? basePriceMinor;

  React.useEffect(() => {
    if (roomTypes.length === 0) return;
    const current = roomTypes.find((room) => room.id === roomTypeId);
    if (current && current.maxOccupancy >= participantsNum) return;
    const nextFit = roomTypes.find((room) => room.maxOccupancy >= participantsNum);
    setRoomTypeId(nextFit?.id ?? "");
  }, [participantsNum, roomTypeId, roomTypes]);

  React.useEffect(() => {
    const handleSelectRoom = (event: Event) => {
      const customEvent = event as CustomEvent<{ roomId: string }>;
      if (customEvent.detail?.roomId) {
        setRoomTypeId(customEvent.detail.roomId);
        const element = document.getElementById("reservation-card");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-brand-blue", "ring-offset-2", "transition-all");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-brand-blue", "ring-offset-2");
          }, 1500);
        }
      }
    };
    
    window.addEventListener("selectRoom", handleSelectRoom);
    return () => window.removeEventListener("selectRoom", handleSelectRoom);
  }, []);

  const hasDates = Boolean(startDate && endDate);
  const hasValidRoom = roomTypes.length === 0 || (Boolean(selectedRoom) && selectedRoomFits);
  const canReserve = Boolean(startDate && endDate && endDate > startDate && hasValidRoom);
  const nights = hasDates ? nightsBetween(startDate, endDate) : 1;
  const selectedAddOns = addOns.filter((addOn) => addOnIds.has(addOn.id));
  const roomTotal = unitPriceMinor * nights;
  const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.priceMinor * nights, 0);
  const total = roomTotal + addOnsTotal;

  function toggleAddOn(id: string) {
    setAddOnIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    if (value && endDate && endDate <= value) setEndDate(dayAfter(value));
  }

  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();

  const handleAddToCart = () => {
    if (!canReserve) return;
    
    addItem({
      listingId,
      type: "accommodation",
      title: listingTitle,
      image: listingImage || selectedRoom?.images?.[0],
      startDate,
      endDate,
      participants: participantsNum,
      roomTypeId,
      roomTypeName: selectedRoom?.name,
      addOnIds: Array.from(addOnIds),
      totalMinor: total,
    });
    
    router.push("/cart");
  };

  return (
    <div id="reservation-card" className="flex flex-col gap-4 rounded-xl transition-all duration-500">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground">Check-in</label>
          <div className="flex h-11 items-center rounded-xl border border-input bg-card px-3">
            <input
              type="date"
              name="startDate"
              min={todayIsoDate()}
              value={startDate}
              onChange={(event) => handleStartDateChange(event.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none"
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-muted-foreground">Check-out</label>
          <div className="flex h-11 items-center rounded-xl border border-input bg-card px-3">
            <input
              type="date"
              name="endDate"
              min={startDate ? dayAfter(startDate) : todayIsoDate()}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-muted-foreground">Guests</label>
        <div className="flex h-11 items-center rounded-xl border border-input bg-card px-3">
          <select
            name="participants"
            value={participants}
            onChange={(event) => setParticipants(event.target.value)}
            className="w-full appearance-none bg-transparent text-sm font-medium outline-none"
          >
            {Array.from({ length: overallMaxGuests }, (_, index) => index + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {roomTypes.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-bold">Room type</p>
          <div className="flex flex-col gap-2">
            {roomTypes.map((room) => {
              const fits = room.maxOccupancy >= participantsNum;
              return (
                  <div 
                    key={room.id}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border p-3 transition-colors",
                      !fits
                        ? "cursor-not-allowed border-border/50 opacity-50"
                        : roomTypeId === room.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-secondary"
                    )}
                  >
                    <label className="flex items-start justify-between gap-3 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="roomTypeId"
                        value={room.id}
                        checked={roomTypeId === room.id}
                        disabled={!fits}
                        onChange={() => setRoomTypeId(room.id)}
                        className="mt-1 h-4 w-4 shrink-0 text-primary focus:ring-primary border-input"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-base">{room.name}</p>
                        <p className={cn("text-xs mt-0.5", !fits ? "font-semibold text-destructive" : "text-muted-foreground")}>
                          {fits
                            ? `Up to ${room.maxOccupancy} guests${room.breakfastIncluded ? " · Breakfast included" : ""}`
                            : `Sleeps up to ${room.maxOccupancy} — reduce guests to select`}
                        </p>
                      </div>
                      <span className="shrink-0 whitespace-nowrap font-semibold">
                        {formatUGX(room.priceMinor)}
                        <span className="ml-1 text-[10px] font-normal text-muted-foreground">/night</span>
                      </span>
                    </label>
                    <div className="pl-7">
                      <RoomDetailsModal
                        name={room.name}
                        description={room.description}
                        images={room.images}
                        maxOccupancy={room.maxOccupancy}
                        breakfastIncluded={room.breakfastIncluded}
                        amenities={[]} 
                      />
                    </div>
                  </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {mode === "link" && selectedRoom ? <AvailabilityCalendar bookedDates={selectedRoom.bookedDates ?? []} /> : null}

      {addOns.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-bold">Optional add-ons</p>
          <div className="flex flex-col gap-2">
            {addOns.map((addOn) => (
              <label
                key={addOn.id}
                className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:bg-secondary"
              >
                <input
                  type="checkbox"
                  name="addOnIds"
                  value={addOn.id}
                  checked={addOnIds.has(addOn.id)}
                  onChange={() => toggleAddOn(addOn.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-input"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{addOn.name}</p>
                  {addOn.description ? <p className="text-xs text-muted-foreground">{addOn.description}</p> : null}
                </div>
                <span className="shrink-0 whitespace-nowrap font-semibold">
                  {formatUGX(addOn.priceMinor)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">/night</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {hasDates && hasValidRoom ? (
        <>
          <Separator />
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {formatUGX(unitPriceMinor)} × {nights} night{nights > 1 ? "s" : ""}
              </span>
              <span>{formatUGX(roomTotal)}</span>
            </div>
            {selectedAddOns.map((addOn) => (
              <div key={addOn.id} className="flex items-center justify-between text-muted-foreground">
                <span>
                  {addOn.name} × {nights} night{nights > 1 ? "s" : ""}
                </span>
                <span>{formatUGX(addOn.priceMinor * nights)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatUGX(total)}</span>
            </div>
          </div>
        </>
      ) : null}

      {mode === "link" ? (
        <div className="mt-2 flex flex-col gap-3">
          <Separator />
          
          <div className="flex items-center gap-2">
            {canReserve ? (
              <Button size="lg" variant="secondary" className="flex-1 font-bold bg-secondary hover:bg-secondary/80" onClick={handleAddToCart}>
                Add to cart
              </Button>
            ) : (
              <Button size="lg" variant="secondary" className="flex-1 font-bold opacity-50" disabled>
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
            <Button size="lg" className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold" onClick={handleAddToCart}>
              Reserve
            </Button>
          ) : (
            <div className="rounded-xl bg-secondary p-3 text-center text-sm text-muted-foreground font-medium">
              {!hasDates || startDate >= endDate ? "Select a date to reserve" : "No room fits your group size."}
            </div>
          )}

          {!isSignedIn ? (
            <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Guests can add items to cart — signing in only happens during checkout.</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
