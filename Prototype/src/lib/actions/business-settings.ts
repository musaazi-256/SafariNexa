"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireBusinessSession } from "@/lib/business";
import { logAuditEvent } from "@/lib/audit";

export async function updateBusinessProfile(formData: FormData) {
  const { business, businessId } = await requireBusinessSession();
  if (!business || !businessId) throw new Error("Unauthorized");

  const name = String(formData.get("name") ?? "").trim();
  const contactEmail = String(formData.get("email") ?? "").trim();
  const contactPhone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  // Basic validation
  if (!name || !contactEmail || !contactPhone || !address || !city || !description) {
    throw new Error("Missing required fields");
  }

  await db.businessProfile.update({
    where: { id: businessId },
    data: {
      name,
      contactEmail,
      contactPhone,
      address,
      city,
      country: country || "Uganda",
      description,
    },
  });

  const session = await auth();
  if (session?.user) {
    await logAuditEvent({
      actorUserId: session.user.id,
      actorEmail: session.user.email ?? undefined,
      surface: "BUSINESS",
      action: "business_update_profile",
      outcome: "SUCCESS",
      metadata: { businessId }
    });
  }

  revalidatePath("/business/(portal)/settings", "page");
  revalidatePath("/business/(portal)/profile", "page");
}
