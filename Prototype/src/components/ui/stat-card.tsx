import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TableColumnLabel } from "@/components/ui/table-column-label";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number | null | undefined;
  description: ReactNode;
  icon?: LucideIcon;
  help?: string;
  href?: string;
  actionLabel?: string;
  compact?: boolean;
};

/** One visual hierarchy for recorded metrics; a destination is always an explicit link. */
export function StatCard({label,value,description,icon:Icon,help,href,actionLabel,compact=false}:StatCardProps) {
  return <Card role="group" aria-label={label} data-slot="stat-card" className={cn("flex h-full flex-col",compact?"p-3":"min-h-40 p-5")}>
    <div className={cn("flex items-start justify-between gap-3",compact?"min-h-6":"min-h-10")}>
      <div className="min-w-0 text-xs font-medium leading-5 text-slate-500">{help?<TableColumnLabel help={help}>{label}</TableColumnLabel>:label}</div>
      {Icon&&<span className={cn("flex shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-500",compact?"h-6 w-6":"h-8 w-8")}><Icon className={compact?"h-3.5 w-3.5":"h-4 w-4"} aria-hidden={true}/></span>}
    </div>
    <p className={cn("break-words font-semibold leading-tight tracking-tight text-slate-800 tabular-nums [overflow-wrap:anywhere]",compact?"mt-1 text-lg":"mt-3 text-2xl")}>{typeof value==="number"?value.toLocaleString("en-UG"):value??"—"}</p>
    <div className={cn("text-xs font-normal text-slate-500",compact?"mt-1 leading-4":"mt-2 leading-5")}>{description}</div>
    {href&&<div className={cn("mt-auto",compact?"pt-2":"pt-4")}><div className={compact?undefined:"border-t border-slate-100 pt-3"}><Link href={href} className="inline-flex min-h-6 items-center gap-1 text-xs font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary" aria-label={`${actionLabel??"View details"}: ${label}`}>{actionLabel??"View details"}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true"/></Link></div></div>}
  </Card>;
}

export function StatGrid({children,columns=4}:{children:ReactNode;columns?:4|5}) {
  return <div className={cn("grid items-stretch gap-4 sm:grid-cols-2",columns===5?"lg:grid-cols-3 2xl:grid-cols-5":"xl:grid-cols-4")}>{children}</div>;
}
