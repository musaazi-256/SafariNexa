"use client";

import * as React from "react";
import Image from "next/image";
import { BedDouble, Coffee, Users, ChevronLeft, ChevronRight, Image as ImageIcon, Waves, ParkingCircle, DoorOpen, Wifi, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

import { RoomDetailsModal } from "@/components/rooms/room-details-modal";
import { formatUGX } from "@/lib/booking";

export function RoomPreviewCard({
  room,
  accommodationAmenities
}: {
  room: {
    id: string;
    name: string;
    description: string | null;
    images: string[];
    priceMinor: number;
    maxOccupancy: number;
    breakfastIncluded: boolean;
  };
  accommodationAmenities: string[];
}) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const hasImages = room.images && room.images.length > 0;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % room.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + room.images.length) % room.images.length);
  };

  const handleReserve = () => {
    // Dispatch custom event to tell the right sidebar widget to select this room
    const event = new CustomEvent("selectRoom", { detail: { roomId: room.id } });
    window.dispatchEvent(event);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all sm:flex-row">
      {/* Left side: Image Carousel */}
      <div className="relative h-64 w-full shrink-0 bg-muted sm:h-auto sm:w-[320px]">
        {hasImages ? (
          <>
            <div className="absolute top-0 left-0 z-10 w-full p-3">
              <span className="inline-block rounded-md bg-brand-blue px-3 py-1 text-sm font-semibold text-white shadow-sm">
                Our lowest price
              </span>
            </div>
            <Image
              src={room.images[currentImageIndex]}
              alt={`${room.name} image ${currentImageIndex + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover transition-opacity duration-300"
            />
            {room.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white hover:scale-105 transition-transform"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white hover:scale-105 transition-transform"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white flex items-center gap-1.5 backdrop-blur-sm">
                  <ImageIcon className="h-3.5 w-3.5" />
                  {room.images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-green to-[#062617]">
            <BedDouble className="h-8 w-8 text-white/50" />
          </div>
        )}
      </div>

      {/* Right side: Content */}
      <div className="flex flex-1 flex-col p-5 sm:flex-row sm:p-6">
        
        {/* Features Column */}
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-4">{room.name}</h3>
          
          <ul className="space-y-2.5 text-sm text-foreground/80 mb-6">
            <li className="flex items-center gap-3 text-success font-medium">
              <Waves className="h-4 w-4" />
              <span>Water view</span>
            </li>
            <li className="flex items-center gap-3 text-success font-medium">
              <ParkingCircle className="h-4 w-4" />
              <span>Parking included</span>
            </li>
            <li className="flex items-center gap-3">
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
              <span>1 bedroom</span>
            </li>
            <li className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Sleeps {room.maxOccupancy}</span>
            </li>
            <li className="flex items-center gap-3">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              <span>1 Double Bed</span>
            </li>
            {room.breakfastIncluded && (
              <li className="flex items-center gap-3">
                <Coffee className="h-4 w-4 text-muted-foreground" />
                <span>Breakfast for 1</span>
              </li>
            )}
            <li className="flex items-center gap-3">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <span>Free WiFi</span>
            </li>
          </ul>

          <div className="space-y-1 mb-4">
            <div className="flex items-center gap-1 text-sm font-medium text-success">
              Fully refundable <Info className="h-3.5 w-3.5 text-success/80" />
            </div>
            <div className="text-xs text-muted-foreground">Before Tue, Aug 11</div>
          </div>

          <RoomDetailsModal
            name={room.name}
            description={room.description}
            images={room.images}
            maxOccupancy={room.maxOccupancy}
            breakfastIncluded={room.breakfastIncluded}
            amenities={accommodationAmenities}
            trigger={
              <button className="text-sm font-semibold text-brand-blue hover:underline focus-visible:outline-none">
                More details &gt;
              </button>
            }
          />
        </div>

        {/* Pricing & Action Column */}
        <div className="mt-6 flex flex-col justify-end sm:mt-0 sm:ml-6 sm:w-48 sm:items-end sm:text-right border-t sm:border-t-0 sm:border-l border-border pt-6 sm:pt-0 sm:pl-6">
          <div className="mb-4 hidden sm:block w-full">
            <div className="rounded-md bg-brand-blue/10 px-3 py-1.5 text-xs font-semibold text-brand-blue text-center flex items-center justify-center gap-1.5">
              Member Price $38 off
            </div>
          </div>
          
          <div className="flex flex-row sm:flex-col justify-between items-end sm:items-end w-full mb-4">
            <div className="text-sm text-brand-red font-medium sm:hidden">
              We have 1 left
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold">{formatUGX(room.priceMinor)}</div>
              <div className="text-xs text-muted-foreground font-medium mt-1">Total with taxes and fees</div>
            </div>
          </div>
          
          <div className="hidden sm:block text-xs text-brand-red font-medium mb-3 w-full text-left">
            We have 1 left
          </div>

          <Button 
            className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold h-11"
            onClick={handleReserve}
          >
            Reserve
          </Button>
          
          <div className="text-[11px] text-muted-foreground text-center w-full mt-2">
            You will not be charged yet
          </div>
        </div>

      </div>
    </div>
  );
}
