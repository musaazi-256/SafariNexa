"use client";

import { useSearchParams } from "next/navigation";
import { RecordFilter } from "@/components/record-filter";
import { RECORD_PERIODS } from "@/lib/record-date-filter";

export function RecordDateFilter({label}:{label:string}) {
  const params = useSearchParams();
  const value = RECORD_PERIODS.some(option=>option.value===params.get("period")) ? params.get("period")! : "ALL";
  return <RecordFilter label={label} name="period" value={value} options={RECORD_PERIODS} />;
}
