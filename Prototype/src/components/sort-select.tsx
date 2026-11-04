"use client";

import { RecordSort } from "@/components/record-sort";

const OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" }
];

export function SortSelect() {
  return <RecordSort label="Sort search results" defaultValue="recommended" options={OPTIONS} />;
}
