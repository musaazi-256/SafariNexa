import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { InviteAdminForm } from "@/components/admin/invite-admin-form";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";

export default async function AdminNewUserPage() {
  await requireAdminSession("users.manage");

  const roles = await db.role.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, description: true } });

  return (
    <div className="max-w-[800px] mx-auto space-y-6 pb-20">

      {/* Back Link */}
      <PageHeader back={{href:"/admin/users",label:"Back to users"}} title={<>Invite admin user</>} description={<>
          Send an invitation to grant administrative access to the SafariNexa portal, scoped to the permission level you choose. If they already have an account, their permissions will be elevated.
        </>} />

      <InviteAdminForm roles={roles} />

    </div>
  );
}
