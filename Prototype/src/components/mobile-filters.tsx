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
        <Button variant="outline" size="sm" className="flex h-9 items-center gap-1.5 rounded-full border-border bg-white px-3.5 text-sm font-medium text-slate-700 shadow-none hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 lg:hidden">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Filter results</SheetTitle>
        </SheetHeader>
        <div>
          <SearchFilters locations={locations} />
        </div>
        <div className="sticky bottom-0 mt-6 border-t border-slate-100 bg-white pt-4"><Button type="button" className="h-10 w-full rounded-full text-sm" onClick={() => setOpen(false)}>Show results</Button></div>
      </SheetContent>
    </Sheet>
  );
}
