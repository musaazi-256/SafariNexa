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
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-bold transition-all",
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-white text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  isActive ? "bg-white/20 text-primary-foreground" : "bg-secondary text-foreground"
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
