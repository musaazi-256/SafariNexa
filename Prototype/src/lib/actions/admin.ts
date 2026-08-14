"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { VerificationStatus } from "@prisma/client";

export async function updateVerificationStatus(verificationId: string, status: VerificationStatus, notes: string = "") {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const verification = await db.businessVerification.findUnique({
    where: { id: verificationId },
    include: { business: true }
  });

  if (!verification) {
    throw new Error("Verification record not found");
  }

  // Run in a transaction
  await db.$transaction(async (tx) => {
    // 1. Update verification record
    await tx.businessVerification.update({
      where: { id: verificationId },
      data: {
        status,
        reviewNotes: notes,
        reviewedAt: new Date(),
        reviewedByAdminId: session.user.id
      }
    });

    // 2. Sync status to the BusinessProfile
    await tx.businessProfile.update({
      where: { id: verification.businessId },
      data: {
        verificationStatus: status
      }
    });

    // 3. Simulated: Send email notification to business owner
    // In a production app, we would integrate Resend/SendGrid here.
    await tx.notification.create({
      data: {
        userId: session.user.id, // Should ideally be the business owner's ID
        type: "SYSTEM",
        title: `Business Verification ${status}`,
        body: `Your business verification for ${verification.business.name} has been marked as ${status}.`
      }
    });
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "ADMIN",
    action: "admin_update_verification_status",
    outcome: "SUCCESS",
    metadata: { verificationId, newStatus: status }
  });

  revalidatePath("/admin/(portal)/verification", "page");
  revalidatePath("/admin/(portal)/businesses", "page");
}
