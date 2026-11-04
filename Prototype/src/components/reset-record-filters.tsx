"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const FACETS = ["status", "type", "role", "read", "filter", "period"];
export function ResetRecordFilters() {
  const params = useSearchParams(), path = usePathname(), router = useRouter();
  if (!FACETS.some(key=>params.has(key))) return null;
  return <Button type="button" variant="ghost" size="sm" className="h-9 rounded-[6px] px-2 text-muted-foreground" onClick={()=>{
    const next = new URLSearchParams(params.toString());
    for (const key of [...FACETS,"page"]) next.delete(key);
    router.push(`${path}${next.size?`?${next}`:""}`,{scroll:false});
  }}>Reset filters<X aria-hidden="true" className="h-3.5 w-3.5" /></Button>;
}
