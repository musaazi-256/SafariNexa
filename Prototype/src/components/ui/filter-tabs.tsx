"use client";

import { useSearchParams } from "next/navigation";
import { filterHref } from "@/lib/filter-navigation";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface FilterTab {
  value: string;
  label: string;
  href: string;
  /** Omit when the count isn't backed by a real query — a fake number is worse than no number. */
  count?: number;
}

/** Shared status-filter pill bar for admin/business portal list pages. Real
 * `<Link>`s driving a URL query param, not client-side ARIA tabs — shadcn's
 * `Tabs` primitive is the wrong tool here since these are real navigations. */
export function FilterTabs({ tabs, activeValue }: { tabs: FilterTab[]; activeValue: string }) {
  const params=useSearchParams();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;
        return (
          <Link
            key={tab.value}
            href={filterHref(tab.href,new URLSearchParams(params.toString()))}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-all",
              isActive
                ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                : "border-border bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums leading-none",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
