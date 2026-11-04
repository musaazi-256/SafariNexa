"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** shadcn InputGroup (Tailwind 3 port): an input or textarea with inline/block addons. */
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex w-full min-w-0 items-center rounded-xl border border-input bg-white transition-shadow",
        "h-11 has-[>textarea]:h-auto has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col",
        "has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30",
        "has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-destructive/20",
        className
      )}
      {...props}
    />
  );
}

const addonVariants = cva("flex h-auto cursor-text select-none items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground [&>svg]:h-4 [&>svg]:w-4", {
  variants: {
    align: {
      "inline-start": "order-first pl-3",
      "inline-end": "order-last pr-3",
      "block-start": "order-first w-full justify-start px-3 pt-3",
      "block-end": "order-last w-full justify-start px-3 pb-3"
    }
  },
  defaultVariants: { align: "inline-start" }
});

function InputGroupAddon({ className, align = "inline-start", ...props }: React.ComponentProps<"div"> & VariantProps<typeof addonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(addonVariants({ align }), className)}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        event.currentTarget.parentElement?.querySelector<HTMLElement>("input, textarea")?.focus();
      }}
      {...props}
    />
  );
}

function InputGroupButton({ className, type = "button", variant = "ghost", ...props }: React.ComponentProps<typeof Button>) {
  return <Button type={type} variant={variant} size="sm" className={cn("h-8 shadow-none", className)} {...props} />;
}

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg]:h-4 [&_svg]:w-4", className)} {...props} />;
}

const controlClass = "min-w-0 flex-1 border-0 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input-group-control" className={cn(controlClass, "h-full px-3", className)} {...props} />;
}

function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="input-group-control" className={cn(controlClass, "w-full resize-none px-3 py-3 leading-relaxed", className)} {...props} />;
}

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea };
