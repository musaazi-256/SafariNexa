import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

/** shadcn pagination primitives. Links use next/link so paging stays client-side. */
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav role="navigation" aria-label="Pagination" data-slot="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="pagination-content" className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = { isActive?: boolean; disabled?: boolean } & React.ComponentProps<typeof Link>;

function PaginationLink({ className, isActive, disabled, children, ...props }: PaginationLinkProps) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      data-slot="pagination-link"
      data-active={isActive || undefined}
      className={cn(
        "inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary",
        disabled && "pointer-events-none opacity-40",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

function PaginationPrevious({ className, ...props }: PaginationLinkProps) {
  return (
    <PaginationLink aria-label="Go to previous page" className={cn("pl-2.5", className)} {...props}>
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({ className, ...props }: PaginationLinkProps) {
  return (
    <PaginationLink aria-label="Go to next page" className={cn("pr-2.5", className)} {...props}>
      <span className="hidden sm:block">Next</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden data-slot="pagination-ellipsis" className={cn("flex h-9 w-9 items-center justify-center text-muted-foreground", className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious };
