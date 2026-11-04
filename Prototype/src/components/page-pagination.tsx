import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { PageSizeSelect } from "@/components/page-pagination-size";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/** Pages to show: first, last, current ±1, padded near the ends; null = ellipsis. */
export function pageWindow(current: number, totalPages: number): Array<number | null> {
  const visible = new Set([1, totalPages, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => visible.add(page));
  if (current >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => visible.add(page));
  const out: Array<number | null> = [];
  for (const page of [...visible].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)) {
    const previous = out.at(-1);
    if (typeof previous === "number" && page > previous + 1) out.push(null);
    out.push(page);
  }
  return out;
}

function withPageSize(href: string, pageSize: number) {
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  if (pageSize === PAGE_SIZE) params.delete("perPage"); else params.set("perPage", String(pageSize));
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * ReUI c-pagination-15 layout: "Page X of Y" · numbered pages with ellipsis · optional "N / page" select.
 * Pass pageSize only on pages that read ?perPage (see parsePageSize); otherwise the select is hidden.
 */
export function Pagination({
  currentPage,
  totalPages,
  buildHref,
  pageSize,
  summary,
  className
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  pageSize?: number;
  /** Replaces the default "Page X of Y" text, e.g. "Showing 1–9 of 86 reviews". */
  summary?: React.ReactNode;
  /** Overrides the default outer spacing (mt-8), e.g. inside a table footer. */
  className?: string;
}) {
  const showSize = pageSize !== undefined;
  if (totalPages <= 1 && !showSize) return summary ? <p className={cn("text-sm text-muted-foreground", className)}>{summary}</p> : null;
  const current = Math.min(totalPages, Math.max(1, currentPage));
  const href = (page: number) => (showSize ? withPageSize(buildHref(page), pageSize) : buildHref(page));
  const sizeHrefs = showSize ? Object.fromEntries(PAGE_SIZE_OPTIONS.map((size) => [size, withPageSize(buildHref(1), size)])) : {};

  return (
    <PaginationRoot className={cn("mt-8", className)}>
      <PaginationContent className="w-full flex-wrap justify-between gap-3">
        <PaginationItem>
          <span className="text-sm text-muted-foreground">
            {summary ?? <>Page <span className="font-medium text-foreground">{current}</span> of{" "}<span className="font-medium text-foreground">{totalPages}</span></>}
          </span>
        </PaginationItem>
        <PaginationItem className="flex flex-wrap items-center gap-1">
          <PaginationPrevious href={href(Math.max(1, current - 1))} disabled={current === 1} />
          {pageWindow(current, totalPages).map((page, i) =>
            page === null ? (
              <PaginationEllipsis key={`gap-${i}`} />
            ) : (
              <PaginationLink key={page} href={href(page)} isActive={page === current}>
                {page}
              </PaginationLink>
            )
          )}
          <PaginationNext href={href(Math.min(totalPages, current + 1))} disabled={current === totalPages} />
        </PaginationItem>
        <PaginationItem>
          {showSize ? <PageSizeSelect value={pageSize} options={PAGE_SIZE_OPTIONS} hrefs={sizeHrefs} /> : <span aria-hidden="true" />}
        </PaginationItem>
      </PaginationContent>
    </PaginationRoot>
  );
}
