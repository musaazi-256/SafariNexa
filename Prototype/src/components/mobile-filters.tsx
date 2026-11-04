"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SearchFilters } from "@/components/search-filters";

export function MobileFilters({locations}:{locations?:Array<{value:string;label:string}>}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 rounded-[6px] lg:hidden">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="shrink-0 border-b px-6 py-5 text-left">
          <SheetTitle>Filter results</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <SearchFilters locations={locations} />
        </div>
        <div className="shrink-0 border-t bg-background px-6 py-4"><Button type="button" className="h-9 w-full rounded-[6px] text-sm" onClick={() => setOpen(false)}>Show results</Button></div>
      </SheetContent>
    </Sheet>
  );
}
