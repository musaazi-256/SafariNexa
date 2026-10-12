import Link from "next/link";
import { Search, Filter } from "lucide-react";
import type { UserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHero } from "@/components/page-hero";
import { AdminAccessStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { toggleAdminUserStatus } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { toAdminAccessStatus } from "@/lib/status";

const TABS: Array<{ value: UserRole | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "CUSTOMER", label: "Customers" },
  { value: "BUSINESS_OWNER", label: "Business owners" },
  { value: "BUSINESS_STAFF", label: "Business staff" },
  { value: "ADMIN", label: "Admins" }
];

export default async function AdminUsersPage({ searchParams }: { searchParams: { role?: string; page?: string; q?: string } }) {
  await requireAdminSession();

  const activeRole = (searchParams.role?.toUpperCase() as UserRole | undefined) ?? undefined;
  const page = parsePage(searchParams.page);
  const q = searchParams.q?.trim();

  const where: any = {};
  if (activeRole) {
    where.role = activeRole;
  }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } }
    ];
  }

  const [users, totalCount] = await Promise.all([
    db.user.findMany({
      where,
      include: { adminUser: { include: { role: true } }, businessUsers: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.user.count({ where })
  ]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      <PageHero
        variant="portal"
        eyebrow="Admin portal"
        title="Users & access"
        description="Customer, business, and admin accounts, with admin access control."
      />

      {/* Pill Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <FilterTabs
          activeValue={activeRole ?? "ALL"}
          tabs={TABS.map((tab) => {
            const params = new URLSearchParams();
            if (tab.value !== "ALL") params.set("role", tab.value.toLowerCase());
            if (q) params.set("q", q);
            return { value: tab.value, label: tab.label, href: `/admin/users?${params.toString()}` };
          })}
        />
        <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <form className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            {activeRole && (activeRole as string) !== "ALL" && <input type="hidden" name="role" value={activeRole.toLowerCase()} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search users..."
              className="w-full h-9 pl-9 pr-4 rounded-full border border-slate-200 text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
            />
          </form>
          <Button variant="outline" className="h-9 px-4 text-[13px] font-bold border-slate-200 text-slate-700 bg-white shadow-sm rounded-full shrink-0">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            Filter
          </Button>
          <Link href="/admin/users/new">
            <Button className="h-9 px-4 text-[13px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full shrink-0">
              Add user
            </Button>
          </Link>
        </div>
      </div>

      {/* Table Container */}
      {users.length === 0 ? (
        <EmptyState title="No users here" description="Nothing matches this filter right now." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">User</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Admin access</TableHead>
                <TableHead className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Businesses</TableHead>
                <TableHead className="text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50">
                  <TableCell className="pl-6 font-bold text-[13px] text-slate-900">{user.name ?? "—"}</TableCell>
                  <TableCell className="text-[13px] font-semibold text-slate-600 truncate">{user.email}</TableCell>
                  <TableCell className="text-[13px] font-semibold text-slate-900 capitalize">
                    {user.role === "BUSINESS_OWNER" ? "Business Owner" : user.role === "BUSINESS_STAFF" ? "Business Staff" : user.role === "ADMIN" ? "Admin" : "Customer"}
                  </TableCell>
                  <TableCell>
                    {user.adminUser ? (
                      <AdminAccessStatusBadge status={toAdminAccessStatus(user.adminUser.status)} />
                    ) : (
                      <span className="text-[13px] font-semibold text-slate-400">Not an admin</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[13px] font-bold text-slate-900">{user.businessUsers.length}</TableCell>
                  <TableCell className="pr-6 text-right">
                    {user.adminUser && user.adminUser.status !== "INVITED" ? (
                      <form action={toggleAdminUserStatus.bind(null, user.adminUser.id)} className="inline-block">
                        <Button type="submit" variant="outline" className={`h-7 px-3 text-[11px] font-bold shadow-none rounded-full ${user.adminUser.status === "ACTIVE" ? "text-slate-600 border-slate-200 hover:bg-slate-50" : "text-primary border-primary/30 hover:bg-primary/10"}`}>
                          {user.adminUser.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                        </Button>
                      </form>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="border-t border-slate-200 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">
              Showing {users.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} users
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPagesFor(totalCount)}
              buildHref={(p) => `/admin/users?${new URLSearchParams({ ...(activeRole ? { role: activeRole.toLowerCase() } : {}), ...(q ? { q } : {}), page: String(p) }).toString()}`}
            />
          </div>

        </div>
      )}
    </div>
  );
}
