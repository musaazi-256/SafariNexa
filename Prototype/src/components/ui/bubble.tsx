import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/** shadcn Bubble family: chat bubbles. default = brand green (sent), muted = received. */
function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="bubble-group" className={cn("flex min-w-0 flex-col gap-1", className)} {...props} />;
}

const bubbleVariants = cva("group/bubble relative flex w-fit min-w-0 max-w-[80%] flex-col gap-1 data-[align=end]:self-end group-data-[align=end]/message:self-end", {
  variants: {
    variant: {
      default: "[&>[data-slot=bubble-content]]:bg-secondary-foreground [&>[data-slot=bubble-content]]:text-white",
      secondary: "[&>[data-slot=bubble-content]]:bg-secondary [&>[data-slot=bubble-content]]:text-secondary-foreground",
      muted: "[&>[data-slot=bubble-content]]:border-border [&>[data-slot=bubble-content]]:bg-white [&>[data-slot=bubble-content]]:text-foreground",
      tinted: "[&>[data-slot=bubble-content]]:bg-primary/10 [&>[data-slot=bubble-content]]:text-foreground",
      outline: "[&>[data-slot=bubble-content]]:border-border [&>[data-slot=bubble-content]]:bg-background",
      ghost: "max-w-full [&>[data-slot=bubble-content]]:rounded-none [&>[data-slot=bubble-content]]:bg-transparent [&>[data-slot=bubble-content]]:p-0",
      destructive: "[&>[data-slot=bubble-content]]:bg-destructive/10 [&>[data-slot=bubble-content]]:text-destructive"
    }
  },
  defaultVariants: { variant: "default" }
});

function Bubble({ variant = "default", align = "start", className, ...props }: React.ComponentProps<"div"> & VariantProps<typeof bubbleVariants> & { align?: "start" | "end" }) {
  return <div data-slot="bubble" data-variant={variant} data-align={align} className={cn(bubbleVariants({ variant }), className)} {...props} />;
}

function BubbleContent({ asChild = false, className, ...props }: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";
  return <Comp data-slot="bubble-content" className={cn("w-fit min-w-0 max-w-full overflow-hidden whitespace-pre-wrap break-words rounded-2xl border border-transparent px-3.5 py-2.5 text-sm leading-relaxed", className)} {...props} />;
}

function BubbleReactions({ side = "bottom", align = "end", className, ...props }: React.ComponentProps<"div"> & { align?: "start" | "end"; side?: "top" | "bottom" }) {
  return (
    <div
      data-slot="bubble-reactions"
      className={cn(
        "absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-sm ring-2 ring-white",
        side === "top" ? "top-0 -translate-y-3/4" : "bottom-0 translate-y-3/4",
        align === "start" ? "left-3" : "right-3",
        className
      )}
      {...props}
    />
  );
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions };
