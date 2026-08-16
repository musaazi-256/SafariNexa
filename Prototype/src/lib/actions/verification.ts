"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireBusinessSession } from "@/lib/business";
import { logAuditEvent } from "@/lib/audit";

const IN_FLIGHT_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "NEEDS_CHANGES"] as const;

export async function submitVerificationDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  
  const { businessId } = await requireBusinessSession();
  if (!businessId) throw new Error("No active business");

  const type = String(formData.get("type") || "").trim();
  let fileUrl = String(formData.get("fileUrl") || "").trim();
  const file = formData.get("file");

  if (!type) throw new Error("Document type is required");

  // Handle actual file upload
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    
    const ext = path.extname(file.name) || ".pdf";
    const filename = `doc_${type.toLowerCase()}_${Date.now()}${ext}`;
    await fs.writeFile(path.join(uploadDir, filename), buffer);
    
    fileUrl = `/uploads/${filename}`;
  }

  if (!fileUrl) throw new Error("File or File URL is required");

  const current = await db.businessVerification.findFirst({
    where: { businessId },
    orderBy: { submittedAt: "desc" }
  });

  const isInFlight = current && (IN_FLIGHT_STATUSES as readonly string[]).includes(current.status);

  if (isInFlight && current) {
    await db.$transaction([
      db.businessDocument.create({ data: { businessVerificationId: current.id, type, fileUrl } }),
      db.businessVerification.update({ where: { id: current.id }, data: { status: "SUBMITTED", submittedAt: new Date() } }),
      db.businessProfile.update({ where: { id: businessId }, data: { verificationStatus: "SUBMITTED" } })
    ]);
  } else {
    await db.$transaction([
      db.businessVerification.create({
        data: { businessId, documents: { create: { type, fileUrl } } }
      }),
      db.businessProfile.update({ where: { id: businessId }, data: { verificationStatus: "SUBMITTED" } })
    ]);
  }
  
  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "BUSINESS",
    action: "business_verification_document_uploaded",
    outcome: "SUCCESS",
    metadata: { businessId, type, fileUrl }
  });

  revalidatePath("/business/verification");
  return { success: true };
}
