"use server";

import { adminNotificationData } from "@/lib/admin-notifications";
import { revalidatePath } from "next/cache";
import { saveVerificationFile } from "@/lib/private-documents";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireBusinessSession } from "@/lib/business";
import { logAuditEvent } from "@/lib/audit";
import { businessReviewSnapshot } from "@/lib/business-review";

const IN_FLIGHT_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "NEEDS_CHANGES"] as const;

export async function submitVerificationDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  
  const { businessId, business } = await requireBusinessSession();
  if (!businessId) throw new Error("No active business");
  if (!business) throw new Error("Business not found.");
  if (!await db.businessUser.findFirst({where:{businessId,userId:session.user.id,role:{in:["OWNER","MANAGER"]}}})) throw new Error("Only owners and managers can manage verification documents.");

  const type = String(formData.get("type") || "").trim();
  let fileUrl = "";
  const file = formData.get("file");

  if (!type) throw new Error("Document type is required");

  // Handle actual file upload
  if (file instanceof File && file.size > 0) {
    fileUrl = await saveVerificationFile(file);
  }

  if (!fileUrl) throw new Error("File or File URL is required");

  const current = await db.businessVerification.findFirst({
    where: { businessId },
    orderBy: { submittedAt: "desc" }
  });

  const isInFlight = current && (IN_FLIGHT_STATUSES as readonly string[]).includes(current.status);
  const adminAlerts = await adminNotificationData(db,"businesses.manage",{type:"SYSTEM",title:"Business verification submitted",body:`${business.name} submitted a ${type.replaceAll("_"," ").toLowerCase()} document. Open the business verification queue to review the latest submission.`},session.user.id);

  if (isInFlight && current) {
    await db.$transaction([
      db.businessDocument.create({ data: { businessVerificationId: current.id, type, fileUrl } }),
      db.businessVerification.update({ where: { id: current.id }, data: { status: "SUBMITTED", submittedAt: new Date(), submittedProfile: businessReviewSnapshot(business) } }),
      db.businessProfile.update({ where: { id: businessId }, data: { verificationStatus: "SUBMITTED" } }),
      db.notification.createMany({data:adminAlerts})
    ]);
  } else {
    await db.$transaction([
      db.businessVerification.create({
        data: { businessId, submittedProfile: businessReviewSnapshot(business), documents: { create: { type, fileUrl } } }
      }),
      db.businessProfile.update({ where: { id: businessId }, data: { verificationStatus: "SUBMITTED" } }),
      db.notification.createMany({data:adminAlerts})
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
  revalidatePath("/admin/verification");
  return { success: true };
}

export async function deleteVerificationDocument(documentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const { businessId } = await requireBusinessSession();
  if (!businessId) throw new Error("No active business");
  if (!await db.businessUser.findFirst({where:{businessId,userId:session.user.id,role:{in:["OWNER","MANAGER"]}}})) throw new Error("Only owners and managers can manage verification documents.");

  const document = await db.businessDocument.findUnique({
    where: { id: documentId },
    include: { verification: { select: { businessId: true, status: true } } }
  });
  if (!document || document.verification.businessId !== businessId) {
    throw new Error("Document not found");
  }
  if (["APPROVED", "UNDER_REVIEW"].includes(document.verification.status)) throw new Error("Reviewed evidence cannot be removed. Submit a new verification document instead.");

  await db.businessDocument.delete({ where: { id: documentId } });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "BUSINESS",
    action: "business_verification_document_deleted",
    outcome: "SUCCESS",
    metadata: { businessId, documentId }
  });

  revalidatePath("/business/verification");
}
