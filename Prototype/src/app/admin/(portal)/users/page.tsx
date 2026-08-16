import Link from "next/link";
import { Search, Filter, Download } from "lucide-react";
import type { UserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { AdminAccessStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { toAdminAccessStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

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

  async function toggleAdminAccess(formData: FormData) {
    "use server";
    await requireAdminSession();

    const adminUserId = String(formData.get("adminUserId"));
    const nextStatus = String(formData.get("nextStatus")) as "ACTIVE" | "SUSPENDED";

    await db.adminUser.update({ where: { id: adminUserId }, data: { status: nextStatus } });
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e613c] mb-1">ADMIN PORTAL</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Users & access</h1>
        <p className="text-[13px] text-slate-500 font-semibold max-w-2xl">Customer, business, and admin accounts, with admin access control.</p>
      </div>

      {/* Pill Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = tab.value === "ALL" ? !activeRole : (activeRole as string) === tab.value;
            const params = new URLSearchParams();
            if (tab.value !== "ALL") params.set("role", tab.value.toLowerCase());
            if (q) params.set("q", q);
            const href = `/admin/users?${params.toString()}`;
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
        <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          <form className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            {activeRole && (activeRole as string) !== "ALL" && <input type="hidden" name="role" value={activeRole.toLowerCase()} />}
            <input 
              type="search" 
              name="q" 
              defaultValue={q} 
              placeholder="Search users..." 
              className="w-full h-9 pl-9 pr-4 rounded-full border border-slate-200 text-[13px] outline-none focus:border-[#1e613c] focus:ring-1 focus:ring-[#1e613c] transition-all bg-white"
            />
          </form>
          <Button variant="outline" className="h-9 px-4 text-[13px] font-bold border-slate-200 text-slate-700 bg-white shadow-sm rounded-full shrink-0">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            Filter
          </Button>
          <Link href="/admin/users/new">
            <Button className="h-9 px-4 text-[13px] font-bold bg-[#1e613c] text-white hover:bg-[#15462b] shadow-sm rounded-full shrink-0">
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
          
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-6 py-3 items-center">
            <div className="col-span-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider">User</div>
            <div className="col-span-3 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Email</div>
            <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Role</div>
            <div className="col-span-2 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Admin access</div>
            <div className="col-span-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Businesses</div>
            <div className="col-span-1 text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">Action</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors">
                
                <div className="col-span-3 font-bold text-[13px] text-slate-900 pr-4">
                  {user.name ?? "—"}
                </div>
                
                <div className="col-span-3 text-[13px] font-semibold text-slate-600 truncate pr-4">
                  {user.email}
                </div>
                
                <div className="col-span-2 text-[13px] font-semibold text-slate-900 capitalize pr-4">
                  {user.role === "BUSINESS_OWNER" ? "Business Owner" : user.role === "BUSINESS_STAFF" ? "Business Staff" : user.role === "ADMIN" ? "Admin" : "Customer"}
                </div>
                
                <div className="col-span-2 flex items-center pr-4">
                  {user.adminUser ? (
                    <AdminAccessStatusBadge status={toAdminAccessStatus(user.adminUser.status)} />
                  ) : (
                    <span className="text-[13px] font-semibold text-slate-400">Not an admin</span>
                  )}
                </div>
                
                <div className="col-span-1 text-[13px] font-bold text-slate-900">
                  {user.businessUsers.length}
                </div>
                
                <div className="col-span-1 flex justify-end">
                  {user.adminUser && user.adminUser.status !== "INVITED" ? (
                    <form action={toggleAdminAccess}>
                      <input type="hidden" name="adminUserId" value={user.adminUser.id} />
                      <input type="hidden" name="nextStatus" value={user.adminUser.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"} />
                      <Button type="submit" variant="outline" className={`h-7 px-3 text-[11px] font-bold shadow-none rounded-full ${user.adminUser.status === "ACTIVE" ? "text-slate-600 border-slate-200 hover:bg-slate-50" : "text-[#1e613c] border-[#1e613c]/30 hover:bg-[#E4F2E8]"}`}>
                        {user.adminUser.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                      </Button>
                    </form>
                  ) : null}
                </div>

              </div>
            ))}
          </div>

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
