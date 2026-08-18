"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function HomeSection({
  eyebrow,
  title,
  description,
  moreHref,
  children
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  moreHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs font-extrabold uppercase tracking-wide text-primary">{eyebrow}</p> : null}
          <h2 className={cn("text-2xl font-extrabold text-secondary-foreground sm:text-3xl", eyebrow && "mt-1")}>{title}</h2>
          {description ? <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{description}</p> : null}
        </div>
        {moreHref ? (
          <Link href={moreHref} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
            More details
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ScrollRow({ children }: { children: React.ReactNode }) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div ref={scrollRef} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 sm:mx-0 sm:px-0">
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-floating outline outline-[0.25px] outline-border transition-colors hover:bg-secondary sm:flex"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-floating outline outline-[0.25px] outline-border transition-colors hover:bg-secondary sm:flex"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
