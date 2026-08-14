import { redirect } from "next/navigation";

import { auth } from "@/auth";

/** Every real admin page needs this same check — extracted here so it isn't
 * re-derived ad hoc on every page, mirroring requireBusinessSession in lib/business.ts. */
export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/admin/login");
  return session;
}
