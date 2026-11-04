import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** shadcn Field family (Tailwind 3 port). Layout for label + control + help + error. */
function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return <fieldset data-slot="field-set" className={cn("flex flex-col gap-6", className)} {...props} />;
}

function FieldLegend({ className, variant = "legend", ...props }: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return <legend data-slot="field-legend" data-variant={variant} className={cn("mb-3 font-medium", variant === "legend" ? "text-base" : "text-sm", className)} {...props} />;
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn("group/field-group flex w-full flex-col gap-6 [&>[data-slot=field-group]]:gap-4", className)} {...props} />;
}

const fieldVariants = cva("group/field flex w-full gap-3 data-[invalid=true]:text-destructive", {
  variants: {
    orientation: {
      vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
      horizontal: "flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:items-start [&>[role=checkbox]]:mt-0.5",
      responsive: "flex-col sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto [&>.sr-only]:w-auto"
    }
  },
  defaultVariants: { orientation: "vertical" }
});

function Field({ className, orientation = "vertical", ...props }: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return <div role="group" data-slot="field" data-orientation={orientation} className={cn(fieldVariants({ orientation }), className)} {...props} />;
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-content" className={cn("flex flex-1 flex-col gap-1.5 leading-snug", className)} {...props} />;
}

function FieldLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",
        // A label wrapping a whole Field becomes a selectable card.
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-xl has-[>[data-slot=field]]:border has-[>[data-slot=field]]:border-border [&>[data-slot=field]]:p-4",
        "has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/5",
        className
      )}
      {...props}
    />
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-label" className={cn("flex w-fit items-center gap-2 text-sm font-medium leading-snug group-data-[disabled=true]/field:opacity-50", className)} {...props} />;
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="field-description" className={cn("text-sm font-normal leading-normal text-muted-foreground [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4", className)} {...props} />;
}

function FieldSeparator({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="field-separator" data-content={!!children} className={cn("relative -my-2 h-5 text-sm", className)} {...props}>
      <Separator className="absolute inset-0 top-1/2" />
      {children ? <span className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground">{children}</span> : null}
    </div>
  );
}

function FieldError({ className, children, errors, ...props }: React.ComponentProps<"div"> & { errors?: Array<{ message?: string } | undefined> }) {
  const messages = children ? null : [...new Set((errors ?? []).map((e) => e?.message).filter(Boolean))] as string[];
  if (!children && !messages?.length) return null;
  return (
    <div role="alert" data-slot="field-error" className={cn("text-sm font-normal text-destructive", className)} {...props}>
      {children ?? (messages!.length === 1 ? messages![0] : <ul className="ml-4 flex list-disc flex-col gap-1">{messages!.map((m) => <li key={m}>{m}</li>)}</ul>)}
    </div>
  );
}

export { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle };
