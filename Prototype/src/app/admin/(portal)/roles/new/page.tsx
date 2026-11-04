import { PageHeader } from "@/components/page-header";
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
    <div className="max-w-[800px] mx-auto space-y-6 pb-20">
      <PageHeader back={{href:"/admin/roles",label:"Back to roles & permissions"}} title={<>New permission level</>} description={<>
          Create a new permission level with exactly the access it needs — nothing more. You can change what it grants later from the roles & permissions page.
        </>} />

      <CreateRoleForm permissions={permissions} />
    </div>
  );
}
