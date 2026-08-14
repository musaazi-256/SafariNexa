import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const ACTIVE_BUSINESS_COOKIE = "active_business";

/** Every real business page needs: signed in, and (if linked) the BusinessProfile row
 * itself — extracted here so it isn't re-derived ad hoc on every page.
 *
 * A user can belong to more than one business (see the multi-business tester seeded
 * in prisma/seed.ts) — `active_business` picks which one is in view, defaulting to
 * the first when unset or when the cookie points at a business the user doesn't
 * actually belong to (never trust the cookie value blindly). */
export async function requireBusinessSession() {
  const session = await auth();
  if (!session?.user) redirect("/business/auth/sign-in");

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    include: { businessUsers: true }
  });

  const memberBusinessIds = dbUser?.businessUsers.map((bu) => bu.businessId) || [];
  const cookieBusinessId = cookies().get(ACTIVE_BUSINESS_COOKIE)?.value;
  const businessId = (cookieBusinessId && memberBusinessIds.includes(cookieBusinessId) ? cookieBusinessId : memberBusinessIds[0]) as
    | string
    | undefined;

  const [business, businesses] = await Promise.all([
    businessId ? db.businessProfile.findUnique({ where: { id: businessId } }) : null,
    memberBusinessIds.length > 0
      ? db.businessProfile.findMany({ where: { id: { in: memberBusinessIds } }, orderBy: { name: "asc" } })
      : []
  ]);

  return { session, businessId, business, businesses };
}
