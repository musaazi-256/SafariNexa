import { PortalSearch } from "@/components/portal-search";
import { TableActionLink } from "@/components/ui/table-action-link";
import Link from "next/link";
import { Search, Filter, Download, Building2, ChevronsUpDown } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHero } from "@/components/page-hero";
import { VerificationStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { toVerificationStatus } from "@/lib/status";
import { Button } from "@/components/ui/button";

const TABS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "APPROVED", label: "Approved" },
  { value: "NEEDS_CHANGES", label: "Needs changes" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" }
];

export default async function AdminBusinessesPage({ searchParams }: { searchParams: { status?: string; page?: string; q?: string } }) {
  await requireAdminSession();

  const activeStatus = searchParams.status?.toUpperCase();
  const page = parsePage(searchParams.page);
  const q = searchParams.q?.trim();

  const where: any = {};
  if (activeStatus && ["NOT_STARTED","DRAFT","SUBMITTED","UNDER_REVIEW","NEEDS_CHANGES","APPROVED","REJECTED","SUSPENDED"].includes(activeStatus)) {
    where.verificationStatus = activeStatus;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { contactEmail: { contains: q, mode: "insensitive" } }
    ];
  }

  const [businesses, totalCount] = await Promise.all([
    db.businessProfile.findMany({
      where,
      include: { _count: { select: { listings: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.businessProfile.count({ where })
  ]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      <PageHero
        variant="portal"
        eyebrow="Admin portal"
        title="Businesses"
        description="Directory of every business on the platform, with verification state."
      />

      {/* Pill Filters */}
      <FilterTabs
        activeValue={!activeStatus || activeStatus === "ALL" ? "ALL" : activeStatus}
        tabs={TABS.map((tab) => {
          const params = new URLSearchParams();
          if (tab.value !== "ALL") params.set("status", tab.value.toLowerCase());
          if (q) params.set("q", q);
          return { value: tab.value, label: tab.label, href: `/admin/businesses?${params.toString()}` };
        })}
      />

      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <PortalSearch label="Search businesses" placeholder="Search businesses…" />
<PortalFilter />
<ExportVisibleRows />
        </div>
      </div>

      {/* Table Container */}
      {businesses.length === 0 ? (
        <EmptyState title="No businesses here" description="Nothing matches this filter right now." />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <span className="inline-flex items-center gap-1">Business</span>
                </TableHead>
                <TableHead>
                  <span className="inline-flex items-center gap-1">Type</span>
                </TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-center">
                  <span className="inline-flex items-center gap-1">Verification</span>
                </TableHead>
                <TableHead className="text-right">
                  <span className="inline-flex items-center gap-1 justify-end">Listings</span>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div className="flex items-center gap-3 pr-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <Link href={`/admin/businesses/${business.id}`} className="font-normal text-sm text-slate-700 truncate hover:text-primary hover:underline transition-colors">
                        {business.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="font-normal capitalize">{business.type.toLowerCase()}</TableCell>
                  <TableCell className="font-normal">{business.city ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <VerificationStatusBadge status={toVerificationStatus(business.verificationStatus)} />
                  </TableCell>
                  <TableCell className="text-right font-normal">{business._count.listings}</TableCell>
                  <TableCell className="text-right">
                    <TableActionLink href={`/admin/businesses/${business.id}`} description={`View ${business.name}`} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="border-t border-border bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">
              Showing {businesses.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} businesses
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPagesFor(totalCount)}
              buildHref={(p) => `/admin/businesses?${new URLSearchParams({ ...(activeStatus && activeStatus !== "ALL" ? { status: activeStatus.toLowerCase() } : {}), ...(q ? { q } : {}), page: String(p) }).toString()}`}
            />
          </div>

        </div>
      )}
    </div>
  );
}
import { ExportVisibleRows, PortalFilter } from "@/components/portal-tools";
