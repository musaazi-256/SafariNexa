"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** Matches the `monthsAhead` default `getRoomTypeAvailability` fetches server-side —
 * keep these in sync so "next month" never pages into data that was never queried. */
const MAX_MONTHS_AHEAD = 12;

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function MonthGrid({
  year,
  month,
  bookedDates,
  todayKey,
  showMonthLabel = true
}: {
  year: number;
  month: number;
  bookedDates: Set<string>;
  todayKey: string;
  showMonthLabel?: boolean;
}) {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [...Array.from({ length: firstWeekday }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div>
      {showMonthLabel ? (
        <p className="mb-2 text-center text-xs font-bold">
          {MONTH_LABELS[month]} {year}
        </p>
      ) : null}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={index} className="text-center text-[10px] font-semibold text-muted-foreground">
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={index} />;
          const key = dateKey(year, month, day);
          const isBooked = bookedDates.has(key);
          const isToday = key === todayKey;
          return (
            <span
              key={index}
              className={cn(
                "mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
                isBooked ? "bg-secondary text-muted-foreground line-through" : "text-foreground",
                isToday && !isBooked ? "border border-primary font-bold" : ""
              )}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Read-only "quick glance" calendar — not a date picker. Dates are still chosen via the
 * plain check-in/check-out inputs; this just shows which nights are already booked for the
 * selected room, computed from real bookings (see `getRoomTypeAvailability`). One month at a
 * time, with prev/next navigation, since guests may be booking several months out. */
export function AvailabilityCalendar({ bookedDates }: { bookedDates: string[] }) {
  const now = new Date();
  const baseYear = now.getUTCFullYear();
  const baseMonth = now.getUTCMonth();
  const todayKey = dateKey(baseYear, baseMonth, now.getUTCDate());
  const bookedSet = new Set(bookedDates);

  const [monthOffset, setMonthOffset] = React.useState(0);
  const absoluteMonth = baseMonth + monthOffset;
  const year = baseYear + Math.floor(absoluteMonth / 12);
  const month = ((absoluteMonth % 12) + 12) % 12;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">Availability</p>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
          Booked
        </span>
      </div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthOffset((offset) => Math.max(0, offset - 1))}
          disabled={monthOffset === 0}
          aria-label="Previous month"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-xs font-bold">
          {MONTH_LABELS[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => setMonthOffset((offset) => Math.min(MAX_MONTHS_AHEAD, offset + 1))}
          disabled={monthOffset === MAX_MONTHS_AHEAD}
          aria-label="Next month"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <MonthGrid year={year} month={month} bookedDates={bookedSet} todayKey={todayKey} showMonthLabel={false} />
    </div>
  );
}
