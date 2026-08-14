import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { width: 100, height: 24 },
  md: { width: 140, height: 32 },
  lg: { width: 180, height: 40 }
} as const;

export const Logo = React.forwardRef<
  HTMLSpanElement,
  { size?: "sm" | "md" | "lg"; showWordmark?: boolean; className?: string }
>(({ size = "md", showWordmark = true, className, ...props }, ref) => {
  // If we shouldn't show wordmark, maybe we need a different icon-only SVG, 
  // but for now we'll just show the horizontal logo since that's what was requested.
  const dims = SIZES[size];

  return (
    <span ref={ref} className={cn("flex items-center", className)} {...props}>
      <Image 
        src="/logos/horizontal-white.svg" 
        alt="SafariNexa" 
        width={dims.width} 
        height={dims.height} 
        className="object-contain"
        priority
      />
    </span>
  );
});
Logo.displayName = "Logo";
