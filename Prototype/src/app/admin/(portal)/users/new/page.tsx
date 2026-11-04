import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { InviteAdminForm } from "@/components/admin/invite-admin-form";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";

export default async function AdminNewUserPage() {
  await requireAdminSession("users.manage");

  const roles = await db.role.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, description: true } });

  return (
    <div className="max-w-[800px] mx-auto space-y-8 pb-20 font-sans">

      {/* Back Link */}
      <Link href="/admin/users" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to users
      </Link>

      {/* Header */}
      <div>
        <h1 className="type-page text-slate-900 mb-2">Invite Admin User</h1>
        <p className="text-sm text-slate-500 font-semibold max-w-xl leading-relaxed">
          Send an invitation to grant administrative access to the SafariNexa portal, scoped to the permission level you choose. If they already have an account, their permissions will be elevated.
        </p>
      </div>

      <InviteAdminForm roles={roles} />

    </div>
  );
}
