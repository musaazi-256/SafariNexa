"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MAX_MONTHS_AHEAD = 2;

type DayAvailability = { capacity: number; remaining: number; priceOverrideMinor: number | null };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function AvailabilityCalendarEditor({
  listingId,
  basePriceMinor,
  availabilityByDate,
  action
}: {
  listingId: string;
  basePriceMinor: number;
  availabilityByDate: Record<string, DayAvailability>;
  action: (formData: FormData) => void;
}) {
  const now = new Date();
  const [monthOffset, setMonthOffset] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  const absoluteMonth = now.getUTCMonth() + monthOffset;
  const year = now.getUTCFullYear() + Math.floor(absoluteMonth / 12);
  const month = ((absoluteMonth % 12) + 12) % 12;

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [...Array.from({ length: firstWeekday }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  function keyFor(day: number) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }

  const selected = selectedDate ? availabilityByDate[selectedDate] : undefined;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthOffset((offset) => Math.max(0, offset - 1))}
          disabled={monthOffset === 0}
          aria-label="Previous month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-bold">
          {MONTH_LABELS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => setMonthOffset((offset) => Math.min(MAX_MONTHS_AHEAD, offset + 1))}
          disabled={monthOffset === MAX_MONTHS_AHEAD}
          aria-label="Next month"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={index} className="text-center text-xs font-semibold text-muted-foreground">
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={index} />;
          const key = keyFor(day);
          const info = availabilityByDate[key];
          return (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedDate(key)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-0.5 rounded-xl border text-xs transition-colors",
                info ? "border-primary/40 bg-primary/5 hover:bg-primary/10" : "border-border hover:bg-secondary"
              )}
            >
              <span className="font-semibold">{day}</span>
              <span className="text-[10px] text-muted-foreground">{info ? `${info.remaining}/${info.capacity}` : "Set"}</span>
            </button>
          );
        })}
      </div>

      <Dialog open={selectedDate !== null} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDate}</DialogTitle>
          </DialogHeader>
          <form key={selectedDate} action={action} className="flex flex-col gap-4">
            <input type="hidden" name="listingId" value={listingId} />
            <input type="hidden" name="date" value={selectedDate ?? ""} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" min={0} defaultValue={selected?.capacity ?? 1} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="remaining">Remaining</Label>
              <Input id="remaining" name="remaining" type="number" min={0} defaultValue={selected?.remaining ?? 1} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="priceOverrideMinor">Price override (UGX, optional)</Label>
              <Input
                id="priceOverrideMinor"
                name="priceOverrideMinor"
                type="number"
                min={0}
                placeholder={String(basePriceMinor)}
                defaultValue={selected?.priceOverrideMinor ?? ""}
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
