"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function TableColumnLabel({ children, help }: { children: React.ReactNode; help: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label={`About ${typeof children === "string" ? children : "this column"}`} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-500 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs whitespace-normal text-left text-xs font-normal leading-relaxed">{help}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}
