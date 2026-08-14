"use client";

import Image from "next/image";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

export function PhotoLightbox({
  images,
  title,
  open,
  activeIndex,
  onOpenChange,
  onIndexChange
}: {
  images: string[];
  title: string;
  open: boolean;
  activeIndex: number;
  onOpenChange: (open: boolean) => void;
  onIndexChange: (index: number) => void;
}) {
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < images.length - 1;

  function goPrev() {
    if (canGoPrev) onIndexChange(activeIndex - 1);
  }

  function goNext() {
    if (canGoNext) onIndexChange(activeIndex + 1);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowLeft") goPrev();
    if (event.key === "ArrowRight") goNext();
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 animate-fade-in" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col outline-none"
          onKeyDown={handleKeyDown}
          aria-label={`${title} — photo ${activeIndex + 1} of ${images.length}`}
        >
          <DialogPrimitive.Title className="sr-only">{title} photos</DialogPrimitive.Title>
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <span className="text-sm font-medium text-white/80">
              {activeIndex + 1} / {images.length}
            </span>
            <DialogPrimitive.Close className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-4 sm:px-16">
            {images[activeIndex] ? (
              <Image
                src={images[activeIndex]}
                alt={`${title} — photo ${activeIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            ) : null}

            <button
              type="button"
              onClick={goPrev}
              disabled={!canGoPrev}
              aria-label="Previous photo"
              className={cn(
                "absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground transition-opacity hover:bg-white sm:left-6",
                !canGoPrev && "pointer-events-none opacity-0"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext}
              aria-label="Next photo"
              className={cn(
                "absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground transition-opacity hover:bg-white sm:right-6",
                !canGoNext && "pointer-events-none opacity-0"
              )}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
