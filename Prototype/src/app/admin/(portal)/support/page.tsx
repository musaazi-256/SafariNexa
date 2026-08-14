import Link from "next/link";
import type { SupportCaseStatus as PrismaSupportCaseStatus } from "@prisma/client";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SupportCaseStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { toSupportCaseStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

const TABS: Array<{ value: PrismaSupportCaseStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_ON_CUSTOMER", label: "Waiting on customer" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" }
];

export default async function AdminSupportPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  await requireAdminSession();

  const activeStatus = (searchParams.status?.toUpperCase() as PrismaSupportCaseStatus | undefined) ?? undefined;
  const page = parsePage(searchParams.page);
  const where = activeStatus ? { status: activeStatus } : undefined;

  const [cases, totalCount] = await Promise.all([
    db.supportCase.findMany({
      where,
      include: { openedBy: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.supportCase.count({ where })
  ]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e613c] mb-1">ADMIN PORTAL</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Support issues</h1>
        <p className="text-[13px] text-slate-500 font-semibold max-w-2xl">Resolve booking, payment, and account issues raised across the platform.</p>
      </div>

      {/* Pill Filters */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.value === "ALL" ? !activeStatus : activeStatus === tab.value;
          const href = tab.value === "ALL" ? "/admin/support" : `/admin/support?status=${tab.value.toLowerCase()}`;
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

      {/* Table Container */}
      {cases.length === 0 ? (
        <EmptyState title="No cases here" description="Nothing matches this filter right now." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-6 py-3 items-center">
            <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Case</div>
            <div className="col-span-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Subject</div>
            <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Opened by</div>
            <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Category</div>
            <div className="col-span-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
            <div className="col-span-2 text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">Updated</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {cases.map((supportCase) => (
              <div key={supportCase.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors">
                
                <div className="col-span-2 font-bold text-[13px] text-slate-900 pr-4">
                  <Link href={`/admin/support/${supportCase.id}`} className="hover:text-[#1e613c] transition-colors">
                    {supportCase.caseRef}
                  </Link>
                </div>
                
                <div className="col-span-3 text-[13px] font-semibold text-slate-600 truncate pr-4">
                  {supportCase.subject}
                </div>
                
                <div className="col-span-2 text-[13px] font-semibold text-slate-600 truncate pr-4">
                  {supportCase.openedBy.name ?? supportCase.openedBy.email}
                </div>

                <div className="col-span-2 text-[13px] font-semibold text-slate-600 capitalize pr-4">
                  {supportCase.category.replaceAll("_", " ").toLowerCase()}
                </div>
                
                <div className="col-span-1 flex items-center pr-4">
                  <SupportCaseStatusBadge status={toSupportCaseStatus(supportCase.status)} />
                </div>
                
                <div className="col-span-2 text-[13px] font-semibold text-slate-500 text-right whitespace-nowrap">
                  {supportCase.updatedAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-slate-200 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">
              Showing {cases.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} cases
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPagesFor(totalCount)}
              buildHref={(p) => `/admin/support?${newSearchParams({ ...(activeStatus ? { status: activeStatus.toLowerCase() } : {}), page: String(p) }).toString()}`}
            />
          </div>

        </div>
      )}
    </div>
  );
}

// Helper since new URLSearchParams needs to be imported or handled natively
function newSearchParams(params: Record<string, string>) {
  return new URLSearchParams(params);
}
