"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { AccommodationReservationFields, RoomTypeOption, AddOnOption } from "@/components/rooms/reservation-fields";
import { getAccommodationRoomsAction } from "@/lib/actions";

export function RoomPreviewModal({ listingId, title }: { listingId: string; title: string }) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<{
    basePriceMinor: number;
    maxGuests: number;
    roomTypes: RoomTypeOption[];
    addOns: AddOnOption[];
  } | null>(null);

  React.useEffect(() => {
    if (open && !data && !loading) {
      setLoading(true);
      getAccommodationRoomsAction(listingId)
        .then((res) => {
          setData(res);
        })
        .catch(console.error)
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, data, loading, listingId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="secondary" 
          className="relative z-20 mt-3 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          View Rooms & Prices
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-h-[85vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Select your dates and room to see the total price.</DialogDescription>
        </DialogHeader>
        
        {loading && !data ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : null}

        {data ? (
          <AccommodationReservationFields
            mode="link"
            listingId={listingId}
            listingTitle={title}
            basePriceMinor={data.basePriceMinor}
            maxGuests={data.maxGuests}
            roomTypes={data.roomTypes}
            addOns={data.addOns}
            isSignedIn={false}
            actionLabel="Add to Cart"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
