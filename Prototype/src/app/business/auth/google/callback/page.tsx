import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { safeReturnTo } from "@/lib/return-to";

export default async function BusinessGoogleCallbackPage({
  searchParams
}: {
  searchParams: { returnTo?: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/business/auth/sign-in?returnTo=${encodeURIComponent(safeReturnTo(searchParams.returnTo, "/business/dashboard"))}`);
  }

  if (session.user.businessIds.length > 0) {
    redirect(safeReturnTo(searchParams.returnTo, "/business/dashboard"));
  }

  // business_invitation: a pending invite for this email joins them automatically.
  const invitation = await db.businessInvitation.findFirst({
    where: { email: session.user.email?.toLowerCase(), status: "PENDING", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" }
  });

  if (invitation) {
    await db.$transaction([
      db.businessUser.create({ data: { businessId: invitation.businessId, userId: session.user.id, role: invitation.role } }),
      db.businessInvitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED" } })
    ]);
    redirect("/business/dashboard");
  }

  // business_profile_required: no membership, no invitation — start onboarding.
  redirect("/business/onboarding");
}
