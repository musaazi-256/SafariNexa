import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { PortalSearch } from "@/components/portal-search";
import { TableColumnLabel } from "@/components/ui/table-column-label";
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
import { toggleAdminUserStatus, updateAdminUserRole } from "@/lib/actions/admin";
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
  const session = await requireAdminSession();
  const canManageRoles = session.user.adminRoleName === "Super Admin";

  const roleParam = searchParams.role?.toUpperCase();
  const activeRole = roleParam && ["CUSTOMER", "BUSINESS_OWNER", "BUSINESS_STAFF", "ADMIN", "SUPER_ADMIN"].includes(roleParam) ? roleParam as UserRole : undefined;
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

  const [users, totalCount, roles] = await Promise.all([
    db.user.findMany({
      where,
      include: { adminUser: { include: { role: true } }, businessUsers: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.user.count({ where }),
    canManageRoles ? db.role.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([])
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
          <PortalSearch label="Search users" placeholder="Search users…" />
<PortalFilter />
          <Button asChild className="h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full shrink-0"><Link href="/admin/users/new">
              Add user
            </Link></Button>
        </div>
      </div>

      {/* Table Container */}
      {users.length === 0 ? (
        <EmptyState title="No users here" description="Nothing matches this filter right now." />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead><TableColumnLabel help="Whether this user can currently sign in to the admin portal.">Admin access</TableColumnLabel></TableHead>
                <TableHead><TableColumnLabel help="The role that determines which administrative actions this user can perform.">Permission level</TableColumnLabel></TableHead>
                <TableHead>Businesses</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-normal">{user.name ?? "—"}</TableCell>
                  <TableCell className="font-normal truncate">{user.email}</TableCell>
                  <TableCell className="font-normal capitalize">
                    {user.role === "BUSINESS_OWNER" ? "Business Owner" : user.role === "BUSINESS_STAFF" ? "Business Staff" : user.role === "ADMIN" ? "Admin" : "Customer"}
                  </TableCell>
                  <TableCell>
                    {user.adminUser ? (
                      <AdminAccessStatusBadge status={toAdminAccessStatus(user.adminUser.status)} />
                    ) : (
                      <span className="text-sm font-normal text-slate-500">Not an admin</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!user.adminUser ? (
                      <span className="text-sm font-normal text-slate-500">—</span>
                    ) : canManageRoles && user.id !== session.user.id ? (
                      <form action={updateAdminUserRole.bind(null, user.adminUser.id)} className="flex items-center gap-2">
                        <select
                          name="roleId"
                          defaultValue={user.adminUser.roleId}
                          className="form-control form-control-compact font-normal"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                        <Button type="submit" variant="outline" className="h-8 px-3 text-xs font-normal shadow-none rounded-full">
                          Save
                        </Button>
                      </form>
                    ) : (
                      <span className="text-sm font-normal text-slate-700">{user.adminUser.role.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-normal">{user.businessUsers.length}</TableCell>
                  <TableCell className="text-right">
                    {user.adminUser && user.adminUser.status !== "INVITED" ? (
                      <form action={toggleAdminUserStatus.bind(null, user.adminUser.id)} className="inline-block">
                        {user.adminUser.status === "ACTIVE" ? (
                          <ConfirmSubmit
                            title={`Suspend ${user.name ?? user.email}?`}
                            description="They will lose access to the admin portal straight away. You can reactivate them later."
                            confirmLabel="Suspend admin"
                            trigger={
                              <Button variant="outline" className="h-7 px-3 text-xs font-normal shadow-none rounded-full text-slate-600 border-border hover:bg-slate-50">
                                Suspend
                              </Button>
                            }
                          />
                        ) : (
                          <Button type="submit" variant="outline" className="h-7 px-3 text-xs font-normal shadow-none rounded-full text-primary border-primary/30 hover:bg-primary/10">
                            Reactivate
                          </Button>
                        )}
                      </form>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="border-t border-border bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">
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
import { ExportVisibleRows, PortalFilter } from "@/components/portal-tools";
