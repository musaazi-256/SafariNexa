"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterControl, type FilterOption } from "@/components/ui/filter-control";
import { updateFilterParams } from "@/lib/filter-navigation";

/** Server-backed filters keep the URL as the source of truth, including Back. */
export function RecordFilter({ label, name, value, options, defaultValue = "ALL", defaultParamValue }: {
  label: string;
  name: string;
  value: string;
  options: FilterOption[];
  defaultValue?: string;
  /** Some queues default to Submitted. All must then be explicit in the URL. */
  defaultParamValue?: string;
}) {
  const params = useSearchParams();
  const path = usePathname();
  const router = useRouter();
  return <FilterControl label={label} value={value} options={options} defaultValue={defaultValue} onValueChange={nextValue => {
    const next = updateFilterParams(new URLSearchParams(params.toString()), name,
      nextValue === defaultValue ? defaultParamValue : nextValue);
    router.push(`${path}${next.size ? `?${next}` : ""}`, { scroll: false });
  }} />;
}
