"use client";

import * as React from "react";
import Image from "next/image";
import { Calendar as CalendarIcon, Clock, Users, Plus, Minus, X, Check, BedDouble } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatUGX, nightsBetween } from "@/lib/booking";
import { CartItem, useCartStore } from "@/lib/cart";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToIsoDate(isoDate: string, days: number) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function EditCartItemModal({
  item,
  isOpen,
  onClose
}: {
  item: CartItem | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const updateItem = useCartStore((state) => state.updateItem);

  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [time, setTime] = React.useState("");
  const [participants, setParticipants] = React.useState(1);

  React.useEffect(() => {
    if (item) {
      setStartDate(item.startDate ?? todayIsoDate());
      setEndDate(item.endDate ?? (item.startDate ? addDaysToIsoDate(item.startDate, 1) : addDaysToIsoDate(todayIsoDate(), 1)));
      setTime(item.time ?? "");
      setParticipants(item.participants || 1);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const isAccommodation = item.type.toLowerCase() === "accommodation" || Boolean(item.roomTypeName);
  const isMultiNight = isAccommodation || (Boolean(item.startDate) && Boolean(item.endDate) && item.startDate !== item.endDate);

  const nights = isMultiNight ? Math.max(1, nightsBetween(startDate, endDate)) : 1;

  // Calculate unit price per night (or per participant)
  const initialNights = isMultiNight && item.startDate && item.endDate ? Math.max(1, nightsBetween(item.startDate, item.endDate)) : 1;
  const unitPricePerNight = item.unitPriceMinor ?? Math.round(item.totalMinor / initialNights);
  const calculatedTotal = isMultiNight ? unitPricePerNight * nights : unitPricePerNight * (participants || 1);

  const handleAddNight = () => {
    if (!endDate) return;
    setEndDate((prev) => addDaysToIsoDate(prev, 1));
  };

  const handleSubtractNight = () => {
    if (!startDate || !endDate || nights <= 1) return;
    setEndDate((prev) => addDaysToIsoDate(prev, -1));
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (!endDate || newStart >= endDate) {
      setEndDate(addDaysToIsoDate(newStart, 1));
    }
  };

  const handleSave = () => {
    updateItem(item.id, {
      startDate: isAccommodation || item.startDate ? startDate : undefined,
      endDate: isMultiNight ? endDate : startDate,
      time: item.time ? time : undefined,
      participants,
      totalMinor: calculatedTotal
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card border border-border shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Edit Booking Details</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Item Preview Header */}
        <div className="flex gap-4 p-6 border-b border-border bg-secondary/30">
          {item.image ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm">
              <Image src={item.image} alt={item.title} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BedDouble className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">{item.type}</p>
            <h3 className="font-bold text-base truncate">{item.title}</h3>
            {item.roomTypeName && <p className="text-xs text-muted-foreground font-medium">Room: {item.roomTypeName}</p>}
          </div>
        </div>

        {/* Content Controls */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Night Modifier for Accommodations */}
          {isMultiNight && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">Duration of stay</p>
                <p className="text-xs text-muted-foreground font-medium">
                  {nights} night{nights > 1 ? "s" : ""} ({formatUGX(unitPricePerNight)} / night)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={nights <= 1}
                  onClick={handleSubtractNight}
                  className="h-9 w-9 rounded-lg p-0 font-bold"
                  title="Remove 1 night"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-base font-extrabold">{nights}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddNight}
                  className="h-9 w-9 rounded-lg p-0 font-bold bg-white text-primary border-primary/30 hover:bg-primary/10"
                  title="Add 1 night"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Dates Input */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" /> Check-in Date
              </label>
              <input
                type="date"
                min={todayIsoDate()}
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="h-11 rounded-xl border border-input bg-card px-3 text-sm font-medium outline-none focus:border-primary"
              />
            </div>

            {isMultiNight && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-primary" /> Check-out Date
                </label>
                <input
                  type="date"
                  min={addDaysToIsoDate(startDate || todayIsoDate(), 1)}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 rounded-xl border border-input bg-card px-3 text-sm font-medium outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Time Input (if applicable) */}
          {item.time !== undefined && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Preferred Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11 rounded-xl border border-input bg-card px-3 text-sm font-medium outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Guests / Participants Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" /> Guests / Participants
            </label>
            <div className="flex h-11 items-center rounded-xl border border-input bg-card px-3">
              <select
                value={participants}
                onChange={(e) => setParticipants(Number(e.target.value) || 1)}
                className="w-full appearance-none bg-transparent text-sm font-medium outline-none"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Breakdown Preview */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Updated Total</span>
            <span className="text-2xl font-extrabold text-foreground">{formatUGX(calculatedTotal)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-muted/20">
          <Button type="button" variant="outline" onClick={onClose} className="font-semibold">
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} className="bg-brand-green hover:bg-brand-green/90 text-white font-bold gap-2">
            <Check className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
