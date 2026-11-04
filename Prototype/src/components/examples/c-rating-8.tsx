"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const options = [
  { value: 1, emoji: "😞", label: "Terrible" },
  { value: 2, emoji: "😕", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Amazing" }
];

/** ReUI c-rating-8 · Emoji reaction rating (accessible radio group). */
export function EmojiRating() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3">
      <p id="emoji-rating-label" className="text-sm font-medium">How was your stay?</p>
      <div role="radiogroup" aria-labelledby="emoji-rating-label" className="flex gap-2">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={selected === item.value}
            aria-label={item.label}
            onClick={() => setSelected(item.value)}
            className={cn("flex h-10 w-10 items-center justify-center rounded-xl border-2 text-2xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none", selected === item.value ? "scale-110 border-border bg-muted" : "border-transparent hover:bg-muted")}
          >
            <span aria-hidden="true">{item.emoji}</span>
          </button>
        ))}
      </div>
      <p className="h-5 text-sm text-muted-foreground" aria-live="polite">{options.find((o) => o.value === selected)?.label}</p>
    </div>
  );
}
