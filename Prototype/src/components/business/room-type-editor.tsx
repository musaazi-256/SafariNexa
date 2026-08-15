"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/ui/image-uploader";

export type RoomTypeRow = {
  name: string;
  priceMinor: string;
  maxOccupancy: string;
  totalRooms: string;
  breakfastIncluded: boolean;
  description: string;
  images: string[];
};

const EMPTY_ROOM: RoomTypeRow = { name: "", priceMinor: "", maxOccupancy: "2", totalRooms: "1", breakfastIncluded: false, description: "", images: [] };

export function RoomTypeEditor({ initial }: { initial: RoomTypeRow[] }) {
  const [rows, setRows] = React.useState<RoomTypeRow[]>(initial.length > 0 ? initial : [EMPTY_ROOM]);

  function updateRow(index: number, patch: Partial<RoomTypeRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room types</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <input type="hidden" name="roomTypeCount" value={rows.length} />
        {rows.map((row, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Room name</Label>
              <Input name={`roomTypeName_${index}`} value={row.name} onChange={(e) => updateRow(index, { name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Price / night (UGX)</Label>
              <Input
                name={`roomTypePrice_${index}`}
                type="number"
                min={0}
                value={row.priceMinor}
                onChange={(e) => updateRow(index, { priceMinor: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Max occupancy</Label>
              <Input
                name={`roomTypeMaxOccupancy_${index}`}
                type="number"
                min={1}
                value={row.maxOccupancy}
                onChange={(e) => updateRow(index, { maxOccupancy: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Total rooms of this type</Label>
              <Input
                name={`roomTypeTotalRooms_${index}`}
                type="number"
                min={1}
                value={row.totalRooms}
                onChange={(e) => updateRow(index, { totalRooms: e.target.value })}
                required
              />
            </div>
            <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
              <input
                type="checkbox"
                name={`roomTypeBreakfast_${index}`}
                checked={row.breakfastIncluded}
                onChange={(e) => updateRow(index, { breakfastIncluded: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              Breakfast included
            </label>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Description (optional)</Label>
              <Input name={`roomTypeDescription_${index}`} value={row.description} onChange={(e) => updateRow(index, { description: e.target.value })} />
            </div>
            
            <div className="flex flex-col gap-1.5 sm:col-span-2 pt-2 border-t border-border mt-2">
              <Label>Room Photos</Label>
              <p className="text-xs text-muted-foreground mb-2">Upload photos specifically for this room type.</p>
              <ImageUploader name={`roomTypeImages_${index}`} multiple={true} defaultValue={row.images} />
            </div>
            
            {rows.length > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-fit gap-1.5 sm:col-span-2"
                onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove room
              </Button>
            ) : null}
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" className="w-fit gap-1.5" onClick={() => setRows((current) => [...current, EMPTY_ROOM])}>
          <Plus className="h-3.5 w-3.5" />
          Add room type
        </Button>
      </CardContent>
    </Card>
  );
}
