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
  if (activeStatus && activeStatus !== "ALL") {
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
          <form className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            {activeStatus && activeStatus !== "ALL" && <input type="hidden" name="status" value={activeStatus.toLowerCase()} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search businesses..."
              className="w-full h-9 pl-9 pr-4 rounded-full border border-slate-200 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
            />
          </form>
          <Button variant="outline" className="h-9 px-4 text-[13px] font-bold border-slate-200 text-slate-700 bg-white shadow-sm rounded-full shrink-0">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            Filter
          </Button>
          <Button variant="outline" className="h-9 px-4 text-[13px] font-bold border-slate-200 text-slate-700 bg-white shadow-sm rounded-full shrink-0 hidden lg:inline-flex">
            <Download className="h-4 w-4 mr-2 text-slate-400" />
            Export
          </Button>
        </div>
      </div>

      {/* Table Container */}
      {businesses.length === 0 ? (
        <EmptyState title="No businesses here" description="Nothing matches this filter right now." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1 cursor-pointer">Business <ChevronsUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1 cursor-pointer">Type <ChevronsUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">City</TableHead>
                <TableHead className="text-center text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1 cursor-pointer">Verification <ChevronsUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1 cursor-pointer justify-end">Listings <ChevronsUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {businesses.map((business) => (
                <TableRow key={business.id} className="hover:bg-slate-50/50">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3 pr-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <Link href={`/admin/businesses/${business.id}`} className="font-bold text-[14px] text-slate-900 truncate hover:text-primary hover:underline transition-colors">
                        {business.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] font-semibold text-slate-600 capitalize">{business.type.toLowerCase()}</TableCell>
                  <TableCell className="text-[13px] font-semibold text-slate-600">{business.city ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <VerificationStatusBadge status={toVerificationStatus(business.verificationStatus)} />
                  </TableCell>
                  <TableCell className="text-right text-[13px] font-bold text-slate-900">{business._count.listings}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <Link href={`/admin/businesses/${business.id}`}>
                      <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] font-bold text-slate-600 border-slate-200 shadow-none rounded-full hover:bg-slate-50">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="border-t border-slate-200 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">
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
