"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { updateFilterParams } from "@/lib/filter-navigation";
import type { FilterOption } from "@/components/ui/filter-control";

export function RecordSort({ label, options, defaultValue }: { label: string; options: FilterOption[]; defaultValue: string }) {
  const params = useSearchParams(), path = usePathname(), router = useRouter();
  const requested = params.get("sort");
  const value = options.some(option => option.value === requested) ? requested! : defaultValue;
  return <Select value={value} onValueChange={value => {
    const next = updateFilterParams(new URLSearchParams(params.toString()), "sort", value === defaultValue ? undefined : value);
    router.push(`${path}${next.size ? `?${next}` : ""}`, { scroll: false });
  }}>
    <SelectTrigger aria-label={label} className="filter-sort"><SelectValue /></SelectTrigger>
    <SelectContent className="rounded-[6px]"><>{options.map(option => <SelectItem className="rounded-[4px]" key={option.value} value={option.value}>{option.label}</SelectItem>)}</></SelectContent>
  </Select>;
}
