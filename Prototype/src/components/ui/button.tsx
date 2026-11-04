"use client";

import * as React from "react"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-brand-green-dark text-primary-foreground shadow-sm hover:opacity-90 active:opacity-80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-muted hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4",
        lg: "h-12 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, disabled, children, type, name, value, ...props }, ref) => {
    const form = useFormStatus();
    const formPending = !asChild && type !== "button" && form.pending;
    const busy = loading || (formPending && (!name || form.data?.get(name) === String(value)));
    const unavailable = disabled || loading || formPending;
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        {...props}
        type={asChild ? undefined : type}
        name={name}
        value={value}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={asChild ? undefined : unavailable}
        aria-disabled={unavailable || undefined}
        aria-busy={busy || undefined}
        tabIndex={asChild && unavailable ? -1 : props.tabIndex}
        onClickCapture={unavailable ? (event) => { event.preventDefault(); event.stopPropagation(); } : props.onClickCapture}
      >
        {asChild ? children : <>{busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}{busy && loadingText ? loadingText : children}</>}
      </Comp>
    );
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
