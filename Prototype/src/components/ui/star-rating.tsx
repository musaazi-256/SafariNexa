"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * ReUI Rating as StarRating (the existing Rating/ScoreBadge chips stay in rating.tsx).
 * Read-only: supports partial stars (4.6). Editable: a keyboard-accessible radio group;
 * pass `name` to submit the value with a server-action form.
 */
const starSize = cva("", { variants: { size: { sm: "h-4 w-4", default: "h-5 w-5", lg: "h-6 w-6" } }, defaultVariants: { size: "default" } });
const valueSize = cva("w-6 text-muted-foreground tabular-nums", { variants: { size: { sm: "text-xs", default: "text-sm", lg: "text-base" } }, defaultVariants: { size: "default" } });

type StarRatingProps = Omit<React.ComponentProps<"div">, "onChange"> & VariantProps<typeof starSize> & {
  rating: number;
  maxRating?: number;
  showValue?: boolean;
  editable?: boolean;
  onRatingChange?: (rating: number) => void;
  name?: string;
  required?: boolean;
  label?: string;
};

function StarRating({ rating, maxRating = 5, size, showValue = false, editable = false, onRatingChange, name, required, label = "Rating", className, ...props }: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const shown = editable && hovered !== null ? hovered : rating;
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  const star = (i: number) => {
    const fill = shown >= i ? 100 : shown > i - 1 ? (shown - (i - 1)) * 100 : 0;
    return (
      <span className="relative inline-flex">
        <Star aria-hidden="true" className={cn(starSize({ size }), "text-slate-300")} />
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
          <Star aria-hidden="true" className={cn(starSize({ size }), "fill-amber-400 text-amber-400")} />
        </span>
      </span>
    );
  };

  return (
    <div data-slot="rating" className={cn("flex items-center gap-2.5", className)} {...props}>
      {editable ? (
        <div role="radiogroup" aria-label={label} aria-required={required} className="flex items-center" onMouseLeave={() => setHovered(null)}>
          {stars.map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} star${i === 1 ? "" : "s"}`}
              tabIndex={rating === i || (rating === 0 && i === 1) ? 0 : -1}
              className="rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onMouseEnter={() => setHovered(i)}
              onClick={() => onRatingChange?.(i)}
              onKeyDown={(event) => {
                const next = event.key === "ArrowRight" || event.key === "ArrowUp" ? Math.min(maxRating, (rating || 0) + 1) : event.key === "ArrowLeft" || event.key === "ArrowDown" ? Math.max(1, (rating || 1) - 1) : null;
                if (next === null) return;
                event.preventDefault();
                onRatingChange?.(next);
                (event.currentTarget.parentElement?.children[next - 1] as HTMLElement | undefined)?.focus();
              }}
            >
              {star(i)}
            </button>
          ))}
        </div>
      ) : (
        <div role="img" aria-label={`${rating.toFixed(1)} out of ${maxRating}`} className="flex items-center gap-0.5">
          {stars.map((i) => <React.Fragment key={i}>{star(i)}</React.Fragment>)}
        </div>
      )}
      {name ? <input type="hidden" name={name} value={rating || ""} /> : null}
      {showValue ? <span data-slot="rating-value" className={valueSize({ size })}>{shown.toFixed(1)}</span> : null}
    </div>
  );
}

export { StarRating };
