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
    <div className="flex min-h-10 items-start justify-between gap-3">
      <div className="min-w-0 text-xs font-medium leading-5 text-slate-500">{help?<TableColumnLabel help={help}>{label}</TableColumnLabel>:label}</div>
      {Icon&&<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-500"><Icon className="h-4 w-4" aria-hidden={true}/></span>}
    </div>
    <p className={cn("mt-3 break-words font-semibold leading-tight tracking-tight text-slate-800 tabular-nums [overflow-wrap:anywhere]",compact?"text-lg":"text-2xl")}>{typeof value==="number"?value.toLocaleString("en-UG"):value??"—"}</p>
    <div className="mt-2 text-xs font-normal leading-5 text-slate-500">{description}</div>
    {href&&<div className="mt-auto pt-4"><div className="border-t border-slate-100 pt-3"><Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary" aria-label={`${actionLabel??"View details"}: ${label}`}>{actionLabel??"View details"}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true"/></Link></div></div>}
  </Card>;
}

export function StatGrid({children,columns=4}:{children:ReactNode;columns?:4|5}) {
  return <div className={cn("grid items-stretch gap-4 sm:grid-cols-2",columns===5?"lg:grid-cols-3 2xl:grid-cols-5":"xl:grid-cols-4")}>{children}</div>;
}
