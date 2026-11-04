"use client";

import { PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuItem } from "@/components/ui/dropdown-menu";

export type FilterOption = { value: string; label: string; count?: number };

/** A single-choice facet, following the shadcn Tasks toolbar pattern. */
export function FilterControl({ label, value, options, onValueChange, defaultValue = "ALL", disabled = false }: {
  label: string;
  value: string;
  options: FilterOption[];
  onValueChange: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
}) {
  const selected = options.find(option => option.value === value);
  const active = Boolean(selected && value !== defaultValue);
  const showSelection = Boolean(selected && (active || !["ALL", "all"].includes(defaultValue)));
  const fallback = options.find(option => option.value === defaultValue) ?? options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled}
          className="filter-trigger rounded-[6px] border-border" aria-label={`${label}: ${selected?.label ?? fallback?.label ?? "All"}`}>
          <PlusCircle aria-hidden="true" className="text-muted-foreground" />
          {label}
          {showSelection && <><span aria-hidden="true" className="mx-1 h-4 border-l" /><span className="max-w-52 truncate rounded-[4px] bg-muted px-1.5 py-0.5 text-xs font-normal">{selected!.label}</span></>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-[6px] p-1">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs normal-case tracking-normal">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={selected?.value ?? fallback?.value} onValueChange={onValueChange}>
          {options.map(option => <DropdownMenuRadioItem key={option.value} value={option.value}>
            <span className="flex-1">{option.label}</span>
            {option.count !== undefined && <span className="ml-auto pl-3 font-mono text-xs text-muted-foreground">{option.count}</span>}
          </DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
        {active && <><DropdownMenuSeparator /><DropdownMenuItem className="justify-center rounded-[4px] py-2 text-xs font-normal" onSelect={() => onValueChange(defaultValue)}><X aria-hidden="true" className="h-3.5 w-3.5" />Reset {label.toLowerCase()}</DropdownMenuItem></>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
