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
  startDate,
  endDate,
  onSelectDate,
  showMonthLabel = true
}: {
  year: number;
  month: number;
  bookedDates: Set<string>;
  todayKey: string;
  startDate: string;
  endDate: string;
  onSelectDate: (date: string) => void;
  showMonthLabel?: boolean;
}) {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<number | null> = [...Array.from({ length: firstWeekday }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, weekIndex) => cells.slice(weekIndex * 7, weekIndex * 7 + 7));

  return (
    <div>
      {showMonthLabel ? (
        <p className="mb-2 text-center text-xs font-medium">
          {MONTH_LABELS[month]} {year}
        </p>
      ) : null}
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label, index) => (
          <span key={index} className="text-center text-xs font-medium text-muted-foreground">
            {label}
          </span>
        ))}
        {weeks.map((week, weekIndex) => {
          const rangeSlots = week.flatMap((day, slot) => {
            if (day === null) return [];
            const key = dateKey(year, month, day);
            return startDate && endDate && key >= startDate && key <= endDate ? [slot] : [];
          });
          const firstRangeSlot = rangeSlots[0];
          const lastRangeSlot = rangeSlots[rangeSlots.length - 1];

          return (
            <div key={weekIndex} className="relative col-span-7 grid h-9 grid-cols-7">
              {rangeSlots.length > 0 ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 z-0 bg-emerald-50"
                  style={{ left: `${(firstRangeSlot / 7) * 100}%`, right: `${((6 - lastRangeSlot) / 7) * 100}%` }}
                />
              ) : null}
              {week.map((day, slot) => {
                if (day === null) return <span key={slot} />;
                const key = dateKey(year, month, day);
                const isBooked = bookedDates.has(key);
                const isToday = key === todayKey;
                const isPast = key < todayKey;
                const isCheckIn = key === startDate;
                const isCheckOut = key === endDate;
                return (
                  <span key={slot} className="relative z-10 flex items-center justify-center">
                    <button
                      type="button"
                      disabled={isBooked || isPast}
                      aria-label={`${isBooked ? "Booked, " : ""}${MONTH_LABELS[month]} ${day}, ${year}${isCheckIn ? ", check-in" : ""}${isCheckOut ? ", check-out" : ""}`}
                      aria-pressed={isCheckIn || isCheckOut}
                      onClick={() => onSelectDate(key)}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        isBooked ? "bg-[#f2f0e9] text-muted-foreground line-through" :
                        isPast ? "cursor-not-allowed text-muted-foreground/40" :
                        isCheckIn || isCheckOut ? "bg-primary text-primary-foreground hover:bg-primary" :
                        "text-foreground hover:bg-secondary",
                        isToday && !isCheckIn && !isCheckOut ? "ring-1 ring-inset ring-primary" : "",
                        isBooked || isPast ? "cursor-not-allowed" : "cursor-pointer"
                      )}
                    >
                      {day}
                    </button>
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Room availability calendar with direct check-in and check-out selection. */
export function AvailabilityCalendar({
  bookedDates,
  startDate,
  endDate,
  onSelectDate
}: {
  bookedDates: string[];
  startDate: string;
  endDate: string;
  onSelectDate: (date: string) => void;
}) {
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
        <p className="text-sm font-medium leading-relaxed">Availability</p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
          Booked
        </span>
      </div>
      <p className="mb-2 text-xs text-muted-foreground" aria-live="polite">
        {startDate && !endDate ? "Select a check-out date" : "Select a check-in date"}
      </p>
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
        <p className="text-xs font-medium">
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
      <MonthGrid
        year={year}
        month={month}
        bookedDates={bookedSet}
        todayKey={todayKey}
        startDate={startDate}
        endDate={endDate}
        onSelectDate={onSelectDate}
        showMonthLabel={false}
      />
    </div>
  );
}
