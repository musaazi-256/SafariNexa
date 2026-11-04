"use client";

import { useRouter } from "next/navigation";

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

/** "N / page" select. Navigates to the first page with the chosen page size. */
export function PageSizeSelect({ value, options, hrefs }: { value: number; options: number[]; hrefs: Record<number, string> }) {
  const router = useRouter();
  return (
    <NativeSelect aria-label="Rows per page" className="w-32" value={value} onChange={(event) => router.push(hrefs[Number(event.target.value)])}>
      {options.map((size) => <NativeSelectOption key={size} value={size}>{size} / page</NativeSelectOption>)}
    </NativeSelect>
  );
}
