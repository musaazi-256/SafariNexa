import Link from "next/link";
import { Search, Filter, Download, Building2, MoreVertical, ChevronsUpDown } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { VerificationStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { toVerificationStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
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

export default async function AdminBusinessesPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  await requireAdminSession();

  const activeStatus = searchParams.status?.toUpperCase();
  const page = parsePage(searchParams.page);
  const where = activeStatus ? { verificationStatus: activeStatus as never } : undefined;

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
      
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e613c] mb-1">ADMIN PORTAL</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Businesses</h1>
        <p className="text-[13px] text-slate-500 font-semibold max-w-2xl">Directory of every business on the platform, with verification state.</p>
      </div>

      {/* Pill Filters */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.value === "ALL" ? !activeStatus : activeStatus === tab.value;
          const href = tab.value === "ALL" ? "/admin/businesses" : `/admin/businesses?status=${tab.value.toLowerCase()}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[13px] font-bold transition-all",
                isActive 
                  ? "border-[#1e613c] bg-[#1e613c] text-white shadow-sm" 
                  : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search businesses..." 
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1e613c] focus:ring-1 focus:ring-[#1e613c] shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" className="h-10 text-[13px] font-bold border-slate-200 text-slate-700 bg-white shadow-sm flex-1 sm:flex-none">
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
          <Button variant="outline" className="h-10 text-[13px] font-bold border-slate-200 text-slate-700 bg-white shadow-sm flex-1 sm:flex-none">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Table Container */}
      {businesses.length === 0 ? (
        <EmptyState title="No businesses here" description="Nothing matches this filter right now." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-6 py-3 items-center">
            <div className="col-span-4 flex items-center gap-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
              Business <ChevronsUpDown className="h-3 w-3" />
            </div>
            <div className="col-span-2 flex items-center gap-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
              Type <ChevronsUpDown className="h-3 w-3" />
            </div>
            <div className="col-span-2 flex items-center gap-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              City
            </div>
            <div className="col-span-2 flex items-center gap-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider justify-center cursor-pointer">
              Verification <ChevronsUpDown className="h-3 w-3" />
            </div>
            <div className="col-span-1 flex items-center justify-end gap-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer">
              Listings <ChevronsUpDown className="h-3 w-3" />
            </div>
            <div className="col-span-1 text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Joined
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {businesses.map((business) => (
              <div key={business.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors">
                
                {/* Business Info */}
                <div className="col-span-4 flex items-center gap-3 pr-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4F2E8]">
                    <Building2 className="h-5 w-5 text-[#1e613c]" />
                  </div>
                  <span className="font-bold text-[14px] text-slate-900 truncate">{business.name}</span>
                </div>
                
                {/* Type */}
                <div className="col-span-2 text-[13px] font-semibold text-slate-600 capitalize">
                  {business.type.toLowerCase()}
                </div>
                
                {/* City */}
                <div className="col-span-2 text-[13px] font-semibold text-slate-600">
                  {business.city ?? "—"}
                </div>
                
                {/* Verification */}
                <div className="col-span-2 flex justify-center">
                  <VerificationStatusBadge status={toVerificationStatus(business.verificationStatus)} />
                </div>
                
                {/* Listings */}
                <div className="col-span-1 text-[13px] font-bold text-slate-900 text-right pr-4">
                  {business._count.listings}
                </div>
                
                {/* Joined & Actions */}
                <div className="col-span-1 flex items-center justify-between pl-4">
                  <span className="text-[12px] font-semibold text-slate-500 whitespace-nowrap">
                    {business.createdAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 -mr-2">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-slate-200 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">
              Showing {businesses.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} businesses
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPagesFor(totalCount)}
              buildHref={(p) => `/admin/businesses?${new URLSearchParams({ ...(activeStatus ? { status: activeStatus.toLowerCase() } : {}), page: String(p) }).toString()}`}
            />
          </div>

        </div>
      )}
    </div>
  );
}
