"use client";
import { RecordSort } from "@/components/record-sort";
export { TableExportButton as ExportVisibleRows } from "@/components/ui/table-export";

/** URL-backed sorting preserves the current search/filter and resets pagination. */
export function ReviewSort() {
  return <RecordSort label="Sort reviews" defaultValue="newest" options={[
    { value: "newest", label: "Newest reviews" },
    { value: "highest", label: "Highest rating" },
    { value: "lowest", label: "Lowest rating" }
  ]} />;
}
