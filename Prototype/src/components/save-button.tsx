"use client";

import * as React from "react";
import { Heart } from "lucide-react";

import { toggleSavedItem } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function SaveButton({
  listingId,
  initialSaved,
  path,
  showLabel,
  className
}: {
  listingId: string;
  initialSaved: boolean;
  /** Path to revalidate after toggling, e.g. the saved-items list. */
  path?: string;
  /** Renders as a "♥ Save" text row instead of the default floating icon-only circle. */
  showLabel?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, startTransition] = React.useTransition();

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setSaved((current) => !current);
    startTransition(async () => {
      try {
        const result = await toggleSavedItem(listingId, path);
        setSaved(result.saved);
      } catch {
        setSaved((current) => !current);
      }
    });
  }

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        className={cn(
          "flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60",
          saved && "text-destructive",
          className
        )}
      >
        <Heart className={cn("h-4 w-4", saved ? "fill-destructive text-destructive" : "")} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground transition-colors hover:text-destructive disabled:opacity-60",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", saved ? "fill-destructive text-destructive" : "")} />
    </button>
  );
}
