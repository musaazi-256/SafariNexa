import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** ReUI Frame (Tailwind 3 port): a soft tray holding one or more white panels (tables, lists, forms). */
const frameVariants = cva("relative flex flex-col rounded-2xl", {
  variants: {
    variant: { default: "border border-border bg-muted/50", inverse: "border border-border bg-white", ghost: "bg-muted/50" },
    // Panel padding follows the frame's spacing; FramePanel `flush` opts out (e.g. a table).
    spacing: {
      xs: "gap-1 p-1 [&>[data-slot=frame-panel]:not([data-flush])]:p-2",
      sm: "gap-1 p-1 [&>[data-slot=frame-panel]:not([data-flush])]:px-3 [&>[data-slot=frame-panel]:not([data-flush])]:py-3.5",
      default: "gap-1.5 p-1.5 [&>[data-slot=frame-panel]:not([data-flush])]:p-4",
      lg: "gap-2 p-2 [&>[data-slot=frame-panel]:not([data-flush])]:p-5"
    }
  },
  defaultVariants: { variant: "default", spacing: "default" }
});

function Frame({ className, variant, spacing, ...props }: React.ComponentProps<"div"> & VariantProps<typeof frameVariants>) {
  return <div data-slot="frame" data-spacing={spacing ?? "default"} className={cn(frameVariants({ variant, spacing }), className)} {...props} />;
}

function FramePanel({ className, fit, flush, ...props }: React.ComponentProps<"div"> & { fit?: boolean; flush?: boolean }) {
  return <div data-slot="frame-panel" data-flush={flush || undefined} className={cn("relative overflow-hidden rounded-xl border border-border bg-white shadow-sm", !fit && "grow", className)} {...props} />;
}

function FrameHeader({ className, ...props }: React.ComponentProps<"header">) {
  return <header data-slot="frame-panel-header" className={cn("flex flex-col gap-0.5 px-3 py-1.5", className)} {...props} />;
}

function FrameTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="frame-panel-title" className={cn("text-sm font-semibold", className)} {...props} />;
}

function FrameDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="frame-panel-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function FrameFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return <footer data-slot="frame-panel-footer" className={cn("flex flex-col gap-1 px-3 py-1.5", className)} {...props} />;
}

export { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle, frameVariants };
