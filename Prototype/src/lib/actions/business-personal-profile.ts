"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

export type PersonalProfileState = { error?: string };

export async function updateBusinessPersonalProfile(_state: PersonalProfileState, formData: FormData): Promise<PersonalProfileState> {
  const { session, businessId } = await requireBusinessSession();
  if (!businessId) throw new Error("A business membership is required.");
  const membership = await db.businessUser.findUnique({
    where: { businessId_userId: { businessId, userId: session.user.id } },
    select: { id: true }
  });
  if (!membership) throw new Error("A business membership is required.");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || name.length > 100) return { error: "Enter your full name using 100 characters or fewer." };
  if (phone.length > 40) return { error: "Enter a phone number using 40 characters or fewer." };

  // Personal details belong to the signed-in account, never the business or another member.
  await db.user.update({ where: { id: session.user.id }, data: { name, phone: phone || null } });
  await logAuditEvent({ actorUserId: session.user.id, actorEmail: session.user.email ?? undefined,
    surface: "BUSINESS", action: "business_update_personal_profile", outcome: "SUCCESS", metadata: { businessId } });
  revalidatePath("/business", "layout");
  revalidatePath("/profile");
  revalidatePath("/profile/messages");
  revalidatePath("/admin/users");
  redirect("/business/profile");
}
