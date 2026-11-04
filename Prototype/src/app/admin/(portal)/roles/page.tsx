import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { updateRolePermissions } from "@/lib/actions/roles";

const PERMISSION_LABELS: Record<string, string> = {
  "businesses.manage": "Review business verification & listing submissions",
  "users.manage": "Invite admins and suspend/reactivate access",
  "payments.manage": "Approve refunds and settle payouts",
  "support.manage": "Reply to and close support cases",
  "reviews.moderate": "Moderate customer reviews",
  "roles.manage": "Define permission levels (Super Admin only — can't be granted)"
};

export default async function AdminRolesPage() {
  await requireAdminSession("roles.manage");

  const [roles, permissions] = await Promise.all([
    db.role.findMany({
      include: { permissions: { include: { permission: true } }, _count: { select: { adminUsers: true } } },
      orderBy: { name: "asc" }
    }),
    db.permission.findMany({ orderBy: { key: "asc" } })
  ]);

  // "roles.manage" is only ever held by Super Admin, via the hardcoded
  // role-name bypass in requireAdminSession() — never through a RolePermission
  // row — so it's never offered as a grantable checkbox for any other level.
  const grantablePermissions = permissions.filter((p) => p.key !== "roles.manage");

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 pb-20 font-sans">
      <PageHero
        variant="portal"
        eyebrow="Admin portal"
        title="Roles & permissions"
        description="Permission levels define exactly what an invited admin can do. Changes here apply immediately to everyone holding that level."
      />

      <div className="flex justify-end">
        <Button asChild className="h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-full"><Link href="/admin/roles/new">
            New permission level
          </Link></Button>
      </div>

      <div className="space-y-5">
        {roles.map((role) => {
          const isSuperAdmin = role.name === "Super Admin";
          const grantedKeys = new Set(role.permissions.map((rp) => rp.permission.key));

          return (
            <div key={role.id} className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">{role.name}</h2>
                    {isSuperAdmin && <ShieldCheck className="h-4 w-4 text-[#1e613c]" />}
                  </div>
                  {role.description && <p className="text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">{role.description}</p>}
                </div>
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                  {role._count.adminUsers} {role._count.adminUsers === 1 ? "admin" : "admins"}
                </span>
              </div>

              {isSuperAdmin ? (
                <div className="p-6">
                  <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                    Full access to all administrative functions. This permission level cannot be restricted.
                  </p>
                </div>
              ) : (
                <form action={updateRolePermissions.bind(null, role.id)} className="p-6 space-y-3">
                  {grantablePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={permission.key}
                        defaultChecked={grantedKeys.has(permission.key)}
                        className="mt-0.5"
                      />
                      <span>
                        {PERMISSION_LABELS[permission.key] ?? permission.key}
                        <span className="block text-xs font-mono text-slate-500">{permission.key}</span>
                      </span>
                    </label>
                  ))}
                  <div className="pt-2">
                    <Button type="submit" variant="outline" className="h-8 px-4 text-xs font-medium rounded-full">
                      Save permissions
                    </Button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
