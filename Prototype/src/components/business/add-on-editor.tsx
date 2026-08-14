"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddOnRow = { name: string; priceMinor: string; description: string };

const EMPTY_ADD_ON: AddOnRow = { name: "", priceMinor: "", description: "" };

export function AddOnEditor({ initial }: { initial: AddOnRow[] }) {
  const [rows, setRows] = React.useState<AddOnRow[]>(initial);

  function updateRow(index: number, patch: Partial<AddOnRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optional add-ons</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <input type="hidden" name="addOnCount" value={rows.length} />
        {rows.map((row, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Add-on name</Label>
              <Input name={`addOnName_${index}`} value={row.name} onChange={(e) => updateRow(index, { name: e.target.value })} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Price / night (UGX)</Label>
              <Input
                name={`addOnPrice_${index}`}
                type="number"
                min={0}
                value={row.priceMinor}
                onChange={(e) => updateRow(index, { priceMinor: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label>Description (optional)</Label>
              <Input name={`addOnDescription_${index}`} value={row.description} onChange={(e) => updateRow(index, { description: e.target.value })} />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-fit gap-1.5 sm:col-span-2"
              onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove add-on
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" className="w-fit gap-1.5" onClick={() => setRows((current) => [...current, EMPTY_ADD_ON])}>
          <Plus className="h-3.5 w-3.5" />
          Add add-on
        </Button>
      </CardContent>
    </Card>
  );
}
