"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Wifi, Bath, BedDouble, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function RoomDetailsModal({
  name,
  description,
  images,
  maxOccupancy,
  breakfastIncluded,
  amenities,
  trigger
}: {
  name: string;
  description: string | null;
  images: string[];
  maxOccupancy: number;
  breakfastIncluded: boolean;
  amenities: string[];
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  
  const validImages = React.useMemo(() => images?.filter((img) => img && img.trim().length > 0) || [], [images]);

  const nextImage = React.useCallback(() => {
    setActiveIndex((current) => (current + 1) % validImages.length);
  }, [validImages.length]);

  const prevImage = React.useCallback(() => {
    setActiveIndex((current) => (current - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <button className="text-sm font-semibold text-blue-600 hover:underline focus-visible:outline-none">
            More details &gt;
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden p-0 sm:p-0">
        <div className="flex-1 overflow-y-auto pb-8">
        <DialogHeader className="sr-only p-6 pb-0">
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>Detailed information about {name}</DialogDescription>
        </DialogHeader>

        {validImages.length > 0 ? (
          <div className="group relative h-64 w-full overflow-hidden bg-muted sm:h-80">
            <Image src={validImages[activeIndex]} alt={name} fill sizes="(max-width: 640px) 100vw, 768px" className="object-cover transition-opacity duration-300" />
            {validImages.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-foreground shadow-md transition-transform hover:scale-110 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-foreground shadow-md transition-transform hover:scale-110 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {validImages.map((_, i) => (
                    <div key={i} className={`h-2 rounded-full transition-all ${i === activeIndex ? "w-4 bg-white" : "w-2 bg-white/50"}`} />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-brand-green to-[#062617] sm:h-80">
            <BedDouble className="h-10 w-10 text-white/50" />
          </div>
        )}

        <div className="px-6 pt-6">
          <h2 className="text-2xl font-bold">{name}</h2>
          
          <div className="mt-6 grid grid-cols-2 gap-6 rounded-xl border border-border p-6 sm:grid-cols-4">
            <div className="flex flex-col gap-2">
              <UsersIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Sleeps {maxOccupancy}</span>
            </div>
            {breakfastIncluded ? (
              <div className="flex flex-col gap-2">
                <CoffeeIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Breakfast</span>
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <Wifi className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Free Wi-Fi</span>
            </div>
            <div className="flex flex-col gap-2">
              <BedDouble className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Comfortable</span>
            </div>
          </div>

          {description ? (
            <p className="mt-8 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}

          <Separator className="my-8" />

          <h3 className="mb-4 text-xl font-bold">Room amenities</h3>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <div>
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <Bath className="h-5 w-5" />
                Bathroom
              </div>
              <ul className="flex flex-col gap-2 pl-7 text-sm text-muted-foreground">
                <li className="list-disc">Towels provided</li>
                <li className="list-disc">Toilet paper</li>
                <li className="list-disc">Soap & Shampoo</li>
              </ul>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2 font-semibold">
                <Wifi className="h-5 w-5" />
                Internet
              </div>
              <ul className="flex flex-col gap-2 pl-7 text-sm text-muted-foreground">
                <li className="list-disc">Free Wi-Fi</li>
              </ul>
            </div>
            {amenities.length > 0 ? (
              <div className="col-span-1 sm:col-span-2">
                <div className="mb-3 flex items-center gap-2 font-semibold">
                  <Plus className="h-5 w-5" />
                  General Accommodation Amenities
                </div>
                <ul className="grid grid-cols-1 gap-2 pl-7 text-sm text-muted-foreground sm:grid-cols-2">
                  {amenities.map(a => (
                    <li key={a} className="list-disc">{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CoffeeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}
