"use client";

import * as React from "react";
import Image from "next/image";
import {
  BedDouble,
  Coffee,
  Users,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Waves,
  ParkingCircle,
  DoorOpen,
  Wifi,
  Info,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { RoomDetailsModal } from "@/components/rooms/room-details-modal";
import { formatUGX } from "@/lib/booking";

function getFeatureIcon(featureName: string) {
  const lower = featureName.toLowerCase();
  if (lower.includes("water") || lower.includes("lake") || lower.includes("river") || lower.includes("sea") || lower.includes("ocean")) {
    return <Waves className="h-4 w-4 text-emerald-600 shrink-0" />;
  }
  if (lower.includes("parking")) {
    return <ParkingCircle className="h-4 w-4 text-emerald-600 shrink-0" />;
  }
  if (lower.includes("wifi") || lower.includes("internet")) {
    return <Wifi className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
  if (lower.includes("breakfast")) {
    return <Coffee className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
  if (lower.includes("bed")) {
    return <BedDouble className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
  return <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />;
}

export function RoomPreviewCard({
  room,
  accommodationAmenities,
  cancellationPolicy,
  isLowestPrice = false
}: {
  room: {
    id: string;
    name: string;
    description: string | null;
    images: string[];
    priceMinor: number;
    maxOccupancy: number;
    totalRooms?: number;
    breakfastIncluded: boolean;
    bedType?: string | null;
    bedrooms?: number | null;
    roomFeatures?: string[] | null;
    isRefundable?: boolean | null;
    refundPolicyText?: string | null;
    discountNotice?: string | null;
  };
  accommodationAmenities: string[];
  cancellationPolicy?: string | null;
  isLowestPrice?: boolean;
}) {
  const validImages = React.useMemo(() => room.images?.filter((img) => img && img.trim().length > 0) || [], [room.images]);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const hasImages = validImages.length > 0;

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  };

  const handleReserve = () => {
    // Dispatch custom event to tell the right sidebar widget to select this room
    const event = new CustomEvent("selectRoom", { detail: { roomId: room.id } });
    window.dispatchEvent(event);
  };

  const roomFeaturesList = room.roomFeatures && room.roomFeatures.length > 0 ? room.roomFeatures : null;
  const bedroomsCount = room.bedrooms ?? 1;
  const bedTypeLabel = room.bedType || "1 Double Bed";
  const totalRoomsLeft = room.totalRooms && room.totalRooms > 0 ? room.totalRooms : 1;
  const isRefundable = room.isRefundable !== false;
  const refundText = room.refundPolicyText || cancellationPolicy || "Before check-in";

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all sm:flex-row">
      {/* Left side: Image Carousel */}
      <div className="relative h-64 w-full shrink-0 bg-muted sm:h-auto sm:w-[320px]">
        {hasImages ? (
          <>
            {isLowestPrice && (
              <div className="absolute top-0 left-0 z-10 w-full p-3">
                <span className="inline-block rounded-md bg-brand-blue px-3 py-1 text-sm font-semibold text-white shadow-sm">
                  Our lowest price
                </span>
              </div>
            )}
            <Image
              src={validImages[currentImageIndex]}
              alt={`${room.name} image ${currentImageIndex + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover transition-opacity duration-300"
            />
            {validImages.length > 1 && (
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
                  {validImages.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#0d5932]">
            <BedDouble className="h-10 w-10 text-white/80" />
          </div>
        )}
      </div>

      {/* Right side: Content */}
      <div className="flex flex-1 flex-col p-5 sm:flex-row sm:p-6">
        
        {/* Features Column */}
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-4">{room.name}</h3>
          
          <ul className="space-y-2.5 text-sm text-foreground/80 mb-6">
            {/* Display configured room highlights if provided */}
            {roomFeaturesList ? (
              roomFeaturesList.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  {getFeatureIcon(feat)}
                  <span>{feat}</span>
                </li>
              ))
            ) : null}

            {/* Standard Room Specs */}
            <li className="flex items-center gap-3">
              <DoorOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{bedroomsCount} bedroom{bedroomsCount > 1 ? "s" : ""}</span>
            </li>
            <li className="flex items-center gap-3">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Sleeps {room.maxOccupancy}</span>
            </li>
            <li className="flex items-center gap-3">
              <BedDouble className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{bedTypeLabel}</span>
            </li>
            {room.breakfastIncluded && (
              <li className="flex items-center gap-3">
                <Coffee className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Breakfast for 1</span>
              </li>
            )}
          </ul>

          <div className="space-y-1 mb-4">
            <div className={`flex items-center gap-1 text-sm font-medium ${isRefundable ? "text-emerald-700 font-semibold" : "text-amber-700"}`}>
              {isRefundable ? "Fully refundable" : "Non-refundable"} <Info className="h-3.5 w-3.5 opacity-80" />
            </div>
            <div className="text-xs text-muted-foreground">{refundText}</div>
          </div>

          <RoomDetailsModal
            name={room.name}
            description={room.description}
            images={room.images}
            maxOccupancy={room.maxOccupancy}
            breakfastIncluded={room.breakfastIncluded}
            amenities={accommodationAmenities}
            trigger={
              <button className="text-sm font-bold text-foreground hover:underline focus-visible:outline-none">
                More details &gt;
              </button>
            }
          />
        </div>

        {/* Pricing & Action Column */}
        <div className="mt-6 flex flex-col justify-end sm:mt-0 sm:ml-6 sm:w-48 sm:items-end sm:text-right border-t sm:border-t-0 sm:border-l border-border pt-6 sm:pt-0 sm:pl-6">
          {room.discountNotice ? (
            <div className="mb-4 hidden sm:block w-full">
              <div className="text-xs font-bold text-emerald-800 bg-emerald-50 rounded px-2 py-1 text-center border border-emerald-200">
                {room.discountNotice}
              </div>
            </div>
          ) : null}
          
          <div className="flex flex-row sm:flex-col justify-between items-end sm:items-end w-full mb-4">
            <div className="text-sm text-foreground font-semibold sm:hidden">
              We have {totalRoomsLeft} left
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold">{formatUGX(room.priceMinor)}</div>
              <div className="text-xs text-muted-foreground font-medium mt-1">Total with taxes and fees</div>
            </div>
          </div>
          
          <div className="hidden sm:block text-xs text-foreground font-semibold mb-3 w-full text-left">
            We have {totalRoomsLeft} left
          </div>

          <Button 
            className="w-full bg-[#0d5932] hover:bg-[#0a4526] text-white font-bold h-11"
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
