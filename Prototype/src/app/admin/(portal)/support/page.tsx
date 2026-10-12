import Link from "next/link";
import type { SupportCaseStatus as PrismaSupportCaseStatus } from "@prisma/client";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHero } from "@/components/page-hero";
import { SupportCaseStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { toSupportCaseStatus } from "@/lib/status";

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
      <PageHero
        variant="portal"
        eyebrow="Admin portal"
        title="Support issues"
        description="Resolve booking, payment, and account issues raised across the platform."
      />

      {/* Pill Filters */}
      <FilterTabs
        activeValue={activeStatus ?? "ALL"}
        tabs={TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
          href: tab.value === "ALL" ? "/admin/support" : `/admin/support?status=${tab.value.toLowerCase()}`
        }))}
      />

      {/* Table Container */}
      {cases.length === 0 ? (
        <EmptyState title="No cases here" description="Nothing matches this filter right now." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Case</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Subject</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Opened by</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Category</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((supportCase) => (
                <TableRow key={supportCase.id} className="hover:bg-slate-50/50">
                  <TableCell className="pl-6 font-bold text-[13px] text-slate-900">
                    <Link href={`/admin/support/${supportCase.id}`} className="hover:text-primary transition-colors">
                      {supportCase.caseRef}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] font-semibold text-slate-600">{supportCase.subject}</TableCell>
                  <TableCell className="text-[13px] font-semibold text-slate-600">{supportCase.openedBy.name ?? supportCase.openedBy.email}</TableCell>
                  <TableCell className="text-[13px] font-semibold text-slate-600 capitalize">{supportCase.category.replaceAll("_", " ").toLowerCase()}</TableCell>
                  <TableCell><SupportCaseStatusBadge status={toSupportCaseStatus(supportCase.status)} /></TableCell>
                  <TableCell className="pr-6 text-right text-[13px] font-semibold text-slate-500 whitespace-nowrap">
                    {supportCase.updatedAt.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="border-t border-slate-200 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">
              Showing {cases.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} cases
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPagesFor(totalCount)}
              buildHref={(p) => `/admin/support?${new URLSearchParams({ ...(activeStatus ? { status: activeStatus.toLowerCase() } : {}), page: String(p) }).toString()}`}
            />
          </div>

        </div>
      )}
    </div>
  );
}
