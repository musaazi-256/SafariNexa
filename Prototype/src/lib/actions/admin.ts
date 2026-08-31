"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { VerificationStatus, UserRole, AdminUserStatus } from "@prisma/client";

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

    // 3. Send email notification to business owners
    // In a production app, we would integrate Resend/SendGrid here.
    const owners = await tx.businessUser.findMany({
      where: { businessId: verification.businessId, role: "OWNER" }
    });

    for (const owner of owners) {
      await tx.notification.create({
        data: {
          userId: owner.userId,
          type: "SYSTEM",
          title: `Business Verification ${status}`,
          body: `Your business verification for ${verification.business.name} has been marked as ${status}.`
        }
      });
    }
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

export async function inviteAdmin(email: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  // Find "Super Admin" role
  let superAdminRole = await db.role.findUnique({ where: { name: "Super Admin" } });
  if (!superAdminRole) {
    superAdminRole = await db.role.create({ data: { name: "Super Admin" } });
  }

  await db.$transaction(async (tx) => {
    // Check if user exists
    let targetUser = await tx.user.findUnique({ where: { email: normalizedEmail } });
    
    if (!targetUser) {
      // Create a skeleton user for the admin
      targetUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          role: "ADMIN",
        }
      });
    } else {
      // Promote existing user to ADMIN
      await tx.user.update({
        where: { id: targetUser.id },
        data: { role: "ADMIN" }
      });
    }

    // Check if AdminUser already exists
    const existingAdminUser = await tx.adminUser.findUnique({ where: { userId: targetUser.id } });
    if (!existingAdminUser) {
      await tx.adminUser.create({
        data: {
          userId: targetUser.id,
          roleId: superAdminRole.id,
          status: "INVITED"
        }
      });
    } else if (existingAdminUser.status === "SUSPENDED") {
       await tx.adminUser.update({
         where: { id: existingAdminUser.id },
         data: { status: "ACTIVE" }
       });
    }
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "ADMIN",
    action: "admin_invite_user",
    outcome: "SUCCESS",
    metadata: { targetEmail: normalizedEmail }
  });

  revalidatePath("/admin/(portal)/users", "page");
}

export async function toggleAdminUserStatus(adminUserId: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const adminUser = await db.adminUser.findUnique({
    where: { id: adminUserId },
    include: { user: true }
  });
  if (!adminUser) {
    throw new Error("Admin user not found");
  }
  if (adminUser.userId === session.user.id) {
    throw new Error("You cannot change your own admin access");
  }
  if (adminUser.status !== "ACTIVE" && adminUser.status !== "SUSPENDED") {
    throw new Error("This admin's access cannot be toggled from its current state");
  }

  // Derived from the current DB record rather than trusting any client-submitted
  // value, so a tampered form field can't force an invalid transition.
  const nextStatus: AdminUserStatus = adminUser.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

  await db.adminUser.update({ where: { id: adminUserId }, data: { status: nextStatus } });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "ADMIN",
    action: "admin_toggle_user_access",
    outcome: "SUCCESS",
    metadata: { targetAdminUserId: adminUserId, targetUserEmail: adminUser.user.email, newStatus: nextStatus }
  });

  revalidatePath("/admin/(portal)/users", "page");
}

export async function updateAdminProfile(name: string, phone: string) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name, phone }
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "ADMIN",
    action: "admin_update_profile",
    outcome: "SUCCESS",
    metadata: { name, phone }
  });

  revalidatePath("/admin/(portal)/profile");
}
