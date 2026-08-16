"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

export async function submitBusinessOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Parse fields
  const type = "GENERAL";
  const businessName = String(formData.get("businessName") || "Untitled Business");
  const contactEmail = String(formData.get("contactEmail") || session.user.email || "");
  const contactPhone = String(formData.get("contactPhone") || "");
  const city = String(formData.get("city") || "Kampala");
  const country = "Uganda"; // Default
  
  // Handle file uploads
  const documentsToCreate: { type: string; fileUrl: string }[] = [];
  
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("doc_") && value instanceof File && value.size > 0) {
      const docType = key.replace("doc_", "").toUpperCase();
      
      const buffer = Buffer.from(await value.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      
      const ext = path.extname(value.name) || ".pdf";
      const filename = `doc_${docType.toLowerCase()}_${Date.now()}${ext}`;
      await fs.writeFile(path.join(uploadDir, filename), buffer);
      
      documentsToCreate.push({
        type: docType,
        fileUrl: `/uploads/${filename}`
      });
    }
  }

  // Fallback for dev mode / no upload
  if (documentsToCreate.length === 0) {
    documentsToCreate.push({
      type: "REGISTRATION_CERTIFICATE",
      fileUrl: "https://example.com/doc.pdf"
    });
  }

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
