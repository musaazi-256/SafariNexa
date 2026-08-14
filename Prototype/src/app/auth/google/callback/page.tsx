import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { safeReturnTo } from "@/lib/return-to";

export default async function CustomerGoogleCallbackPage({
  searchParams
}: {
  searchParams: { returnTo?: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(safeReturnTo(searchParams.returnTo, "/"))}`);
  }
  redirect(safeReturnTo(searchParams.returnTo, "/"));
}
