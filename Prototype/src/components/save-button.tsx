"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { toggleSavedItem } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function SaveButton({
  listingId,
  initialSaved,
  isSignedIn = true,
  path,
  showLabel,
  className
}: {
  listingId: string;
  initialSaved: boolean;
  isSignedIn?: boolean;
  /** Path to revalidate after toggling, e.g. the saved-items list. */
  path?: string;
  /** Renders as a "♥ Save" text row instead of the default floating icon-only circle. */
  showLabel?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, startTransition] = React.useTransition();
  const router = useRouter();

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!isSignedIn) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
      router.push(`/auth/sign-in?returnTo=${encodeURIComponent(currentPath)}`);
      return;
    }

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
          "flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-red-600 disabled:opacity-60",
          saved && "border-red-200 bg-red-50 text-red-600",
          className
        )}
      >
        <Heart className={cn("h-4 w-4 transition-transform active:scale-125", saved ? "fill-red-500 text-red-500" : "text-slate-400")} />
        <span>{saved ? "Saved" : "Save"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save to favorites"}
      className={cn(
        "flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:bg-white hover:text-red-600 disabled:opacity-60",
        saved && "bg-white text-red-600",
        className
      )}
    >
      <Heart className={cn("h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform active:scale-125", saved ? "fill-red-500 text-red-500" : "text-slate-600")} />
    </button>
  );
}
