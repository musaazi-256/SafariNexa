"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const ProgressContext = React.createContext<{ value: number; labelId: string }>({ value: 0, labelId: "" });

/**
 * Progress bar (shadcn/ReUI API). Optional children render a header row, e.g.
 * <Progress value={40}><ProgressLabel>Uploading</ProgressLabel><ProgressValue /></Progress>.
 */
function Progress({ value = 0, max = 100, className, indicatorClassName, children, ...props }: React.ComponentProps<"div"> & { value?: number | null; max?: number; indicatorClassName?: string }) {
  const pct = Math.min(100, Math.max(0, ((value ?? 0) / max) * 100));
  const labelId = React.useId();
  const bar = (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value ?? 0)}
      aria-labelledby={children ? labelId : undefined}
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/15", children ? undefined : className)}
      {...(children ? {} : props)}
    >
      <div data-slot="progress-indicator" className={cn("h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none", indicatorClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
  if (!children) return bar;
  return (
    <ProgressContext.Provider value={{ value: pct, labelId }}>
      <div data-slot="progress-root" className={cn("flex w-full flex-col gap-2", className)} {...props}>
        <div className="flex items-center justify-between gap-2">{children}</div>
        {bar}
      </div>
    </ProgressContext.Provider>
  );
}

function ProgressLabel({ className, ...props }: React.ComponentProps<"span">) {
  const { labelId } = React.useContext(ProgressContext);
  return <span id={labelId} data-slot="progress-label" className={cn("text-sm font-medium", className)} {...props} />;
}

function ProgressValue({ className, ...props }: React.ComponentProps<"span">) {
  const { value } = React.useContext(ProgressContext);
  return <span data-slot="progress-value" className={cn("text-sm tabular-nums text-muted-foreground", className)} {...props}>{Math.round(value)}%</span>;
}

export { Progress, ProgressLabel, ProgressValue };
