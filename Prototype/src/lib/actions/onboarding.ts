"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { saveVerificationFile } from "@/lib/private-documents";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { businessReviewSnapshot } from "@/lib/business-review";

export async function submitBusinessOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Parse fields
  const type = "GENERAL";
  const businessName = String(formData.get("businessName") || "Untitled Business");
  const registrationNumber = String(formData.get("registrationNumber") || "").trim() || undefined;
  const address = String(formData.get("address") || "").trim() || undefined;
  const description = String(formData.get("description") || "").trim() || undefined;
  const contactName = String(formData.get("contactName") || "").trim() || undefined;
  const contactRole = String(formData.get("contactRole") || "").trim() || undefined;
  const contactEmail = String(formData.get("contactEmail") || session.user.email || "");
  const contactPhone = String(formData.get("contactPhone") || "");
  const city = "Kampala"; // Default — refined later in Business Settings
  const country = "Uganda"; // Default
  
  // Handle file uploads
  const documentsToCreate: { type: string; fileUrl: string }[] = [];
  
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("doc_") && value instanceof File && value.size > 0) {
      const docType = key.replace("doc_", "").toUpperCase();
      
      documentsToCreate.push({ type: docType, fileUrl: await saveVerificationFile(value) });
    }
  }

  if (documentsToCreate.length === 0) throw new Error("Please upload a registration document.");

  // Slug generation (rudimentary for demo)
  const slugBase = businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

  // Run in a transaction
  const business = await db.$transaction(async (tx) => {
    // 1. Create the BusinessProfile
    const profile = await tx.businessProfile.create({
      data: {
        name: businessName,
        slug,
        type,
        registrationNumber,
        address,
        description,
        contactName,
        contactRole,
        contactEmail,
        contactPhone,
        city,
        country,
        verificationStatus: "SUBMITTED"
      }
    });

    // 2. Link the user as OWNER
    await tx.businessUser.create({
      data: {
        businessId: profile.id,
        userId: session.user.id,
        role: "OWNER"
      }
    });

    // 3. Create the Verification record
    await tx.businessVerification.create({
      data: {
        businessId: profile.id,
        status: "SUBMITTED",
        submittedProfile: businessReviewSnapshot(profile),
        documents: {
          create: documentsToCreate
        }
      }
    });

    return profile;
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "BUSINESS",
    action: "business_onboarding_submitted",
    outcome: "SUCCESS",
    metadata: { businessId: business.id }
  });

  revalidatePath("/business/(portal)/dashboard", "layout");
  return { success: true };
}
