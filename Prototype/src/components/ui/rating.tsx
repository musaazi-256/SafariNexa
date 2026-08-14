import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold text-foreground", className)}>
      <Star className="h-4 w-4 fill-accent text-accent" />
      {value.toFixed(1)}
      {typeof count === "number" ? <span className="font-normal text-muted-foreground">({count})</span> : null}
    </span>
  );
}

const SCORE_LABELS: Array<[number, string]> = [
  [4.7, "Exceptional"],
  [4.3, "Excellent"],
  [3.8, "Very good"],
  [3.2, "Good"],
  [0, "Fair"]
];

function scoreLabel(value: number) {
  return SCORE_LABELS.find(([threshold]) => value >= threshold)?.[1] ?? "Fair";
}

/** Booking.com-style rating chip: dark score box + label + review count. */
export function ScoreBadge({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-1.5 text-sm font-extrabold text-primary-foreground">
        {value.toFixed(1)}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-bold">{scoreLabel(value)}</span>
        {typeof count === "number" ? <span className="text-xs text-muted-foreground">{count} reviews</span> : null}
      </span>
    </span>
  );
}
