import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

/** Every real admin page needs this same check — extracted here so it isn't
 * re-derived ad hoc on every page, mirroring requireBusinessSession in lib/business.ts. */
export async function requireAdminSession(permission?: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/admin/login");
  const admin = await db.adminUser.findUnique({ where: { userId: session.user.id }, include: { role: { include: { permissions: { include: { permission: true } } } } } });
  if (!admin || admin.status !== "ACTIVE") redirect("/admin/login");
  if (permission && admin.role.name !== "Super Admin" && !admin.role.permissions.some(p => p.permission.key === permission)) {
    redirect("/admin/auth/access-denied");
  }
  return session;
}
