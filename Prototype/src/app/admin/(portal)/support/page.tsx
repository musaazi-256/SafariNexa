import { PortalToolbar } from "@/components/portal-toolbar";
import { TableColumnLabel } from "@/components/ui/table-column-label";
import Link from "next/link";
import type { SupportCaseStatus as PrismaSupportCaseStatus } from "@prisma/client";

import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/page-pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RecordFilter } from "@/components/record-filter";
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

  const requestedStatus = searchParams.status?.toUpperCase();
  const activeStatus = TABS.some(option=>option.value===requestedStatus && option.value!=="ALL") ? requestedStatus as PrismaSupportCaseStatus : undefined;
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
      <PortalToolbar tableId="admin-support" filters={<RecordFilter label="Case status" name="status" defaultValue="ALL"
        value={activeStatus ?? "ALL"}
        options={TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
        }))}
      />} />

      {/* Table Container */}
      {cases.length === 0 ? (
        <EmptyState title="No cases here" description="Nothing matches this filter right now." />
      ) : (
        <div>
          <Table externalTools tableId="admin-support" aria-label="Support cases">
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Opened by</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right"><TableColumnLabel help="The most recent saved update to this support case.">Updated</TableColumnLabel></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((supportCase) => (
                <TableRow key={supportCase.id}>
                  <TableCell className="font-normal">
                    <Link href={`/admin/support/${supportCase.id}`} className="hover:text-primary transition-colors">
                      {supportCase.caseRef}
                    </Link>
                  </TableCell>
                  <TableCell className="font-normal">{supportCase.subject}</TableCell>
                  <TableCell className="font-normal">{supportCase.openedBy.name ?? supportCase.openedBy.email}</TableCell>
                  <TableCell className="font-normal capitalize">{supportCase.category.replaceAll("_", " ").toLowerCase()}</TableCell>
                  <TableCell><SupportCaseStatusBadge status={toSupportCaseStatus(supportCase.status)}  perspective="staff" /></TableCell>
                  <TableCell className="text-right font-normal whitespace-nowrap">
                    {supportCase.updatedAt.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="border-t border-border bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">
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
