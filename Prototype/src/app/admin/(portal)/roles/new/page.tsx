import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { CreateRoleForm } from "@/components/admin/create-role-form";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";

export default async function AdminNewRolePage() {
  await requireAdminSession("roles.manage");

  const permissions = await db.permission.findMany({
    where: { key: { not: "roles.manage" } },
    orderBy: { key: "asc" },
    select: { key: true }
  });

  return (
    <div className="max-w-[800px] mx-auto space-y-8 pb-20 font-sans">
      <Link href="/admin/roles" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to roles & permissions
      </Link>

      <div>
        <h1 className="type-page text-slate-900 mb-2">New permission level</h1>
        <p className="text-sm text-slate-500 font-semibold max-w-xl leading-relaxed">
          Create a new permission level with exactly the access it needs — nothing more. You can change what it grants later from the roles & permissions page.
        </p>
      </div>

      <CreateRoleForm permissions={permissions} />
    </div>
  );
}
