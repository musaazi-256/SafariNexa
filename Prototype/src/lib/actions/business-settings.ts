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
  const description = String(formData.get("description") ?? "").trim();

  // Basic validation
  if (!name || !contactEmail || !contactPhone || !address || !description) {
    throw new Error("Missing required fields");
  }

  // To support city/country from a single address field, we'll store it in city for now
  // In a real app, this might be broken down.
  await db.businessProfile.update({
    where: { id: businessId },
    data: {
      name,
      contactEmail,
      contactPhone,
      city: address,
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
