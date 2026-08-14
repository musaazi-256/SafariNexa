import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { safeReturnTo } from "@/lib/return-to";

export default async function AdminGoogleCallbackPage({
  searchParams
}: {
  searchParams: { returnTo?: string };
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/admin/auth/access-denied");
  }
  redirect(safeReturnTo(searchParams.returnTo, "/admin/dashboard"));
}
