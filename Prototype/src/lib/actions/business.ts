"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/business";
import { db } from "@/lib/db";

export async function setActiveBusiness(businessId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Sign in required.");

  // Never trust the client-picked id blindly — only switch to a business this
  // user actually belongs to. The session JWT might be stale, so query the DB.
  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    include: { businessUsers: true }
  });
  const memberBusinessIds = dbUser?.businessUsers.map((bu) => bu.businessId) || [];

  if (!memberBusinessIds.includes(businessId)) throw new Error("Not a member of this business.");
  cookies().set(ACTIVE_BUSINESS_COOKIE, businessId, { httpOnly: true, sameSite: "lax", path: "/" });
  revalidatePath("/business", "layout");
}
