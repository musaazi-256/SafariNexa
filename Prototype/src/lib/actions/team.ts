"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireBusinessSession } from "@/lib/business";
import { logAuditEvent } from "@/lib/audit";
import { BusinessUserRole } from "@prisma/client";

export async function inviteTeamMember(formData: FormData) {
  const { business, businessId } = await requireBusinessSession();
  const session = await auth();
  if (!business || !businessId || !session?.user) throw new Error("Unauthorized");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "STAFF") as BusinessUserRole;

  if (!email) throw new Error("Email is required");

  // Verify sender is OWNER or MANAGER
  const senderMembership = await db.businessUser.findUnique({
    where: { businessId_userId: { businessId, userId: session.user.id } }
  });
  if (!senderMembership || (senderMembership.role !== "OWNER" && senderMembership.role !== "MANAGER")) {
    throw new Error("Only owners or managers can invite team members");
  }

  // Check if already a member
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await db.businessUser.findUnique({
      where: { businessId_userId: { businessId, userId: existingUser.id } }
    });
    if (existingMembership) {
      throw new Error("User is already a member of this business");
    }
  }

  // Check for pending invitation
  const existingInv = await db.businessInvitation.findFirst({
    where: { businessId, email, status: "PENDING" }
  });
  if (existingInv) {
    throw new Error("An invitation is already pending for this email");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await db.businessInvitation.create({
    data: {
      businessId,
      email,
      role,
      token,
      invitedByUserId: session.user.id,
      expiresAt
    }
  });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "BUSINESS",
    action: "business_invite_member",
    outcome: "SUCCESS",
    metadata: { businessId, targetEmail: email, role }
  });

  revalidatePath("/business/(portal)/settings", "page");
}

export async function cancelInvitation(invitationId: string) {
  const { businessId } = await requireBusinessSession();
  const session = await auth();
  if (!businessId || !session?.user) throw new Error("Unauthorized");

  const invitation = await db.businessInvitation.findUnique({ where: { id: invitationId } });
  if (!invitation || invitation.businessId !== businessId) {
    throw new Error("Invitation not found");
  }

  // Verify sender is OWNER or MANAGER
  const senderMembership = await db.businessUser.findUnique({
    where: { businessId_userId: { businessId, userId: session.user.id } }
  });
  if (!senderMembership || (senderMembership.role !== "OWNER" && senderMembership.role !== "MANAGER")) {
    throw new Error("Only owners or managers can manage invitations");
  }

  await db.businessInvitation.delete({ where: { id: invitationId } });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "BUSINESS",
    action: "business_cancel_invitation",
    outcome: "SUCCESS",
    metadata: { businessId, invitationId }
  });

  revalidatePath("/business/(portal)/settings", "page");
}

export async function removeTeamMember(memberId: string) {
  const { businessId } = await requireBusinessSession();
  const session = await auth();
  if (!businessId || !session?.user) throw new Error("Unauthorized");

  const member = await db.businessUser.findUnique({ where: { id: memberId } });
  if (!member || member.businessId !== businessId) {
    throw new Error("Member not found");
  }

  if (member.role === "OWNER") {
    throw new Error("Cannot remove the business owner");
  }

  // Verify sender is OWNER or MANAGER
  const senderMembership = await db.businessUser.findUnique({
    where: { businessId_userId: { businessId, userId: session.user.id } }
  });
  if (!senderMembership || (senderMembership.role !== "OWNER" && senderMembership.role !== "MANAGER")) {
    throw new Error("Only owners or managers can remove team members");
  }

  await db.businessUser.delete({ where: { id: memberId } });

  await logAuditEvent({
    actorUserId: session.user.id,
    actorEmail: session.user.email ?? undefined,
    surface: "BUSINESS",
    action: "business_remove_member",
    outcome: "SUCCESS",
    metadata: { businessId, removedMemberId: memberId }
  });

  revalidatePath("/business/(portal)/settings", "page");
}
