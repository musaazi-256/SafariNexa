"use server";

import { notifyAdmins } from "@/lib/admin-notifications";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireBusinessSession } from "@/lib/business";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { listingSnapshot, reviewInclude, snapshotDigest, submissionErrors } from "@/lib/listing-review";
import { applyListingRevision,restoreListingForm } from "@/lib/listing-revisions";

export async function submitListing(form: FormData) {
  const { businessId, session } = await requireBusinessSession();
  const listingId = String(form.get("listingId") || "");
  await db.$transaction(async tx => {
    const listing = await tx.listing.findUnique({ where: { id: listingId }, include: { ...reviewInclude, business: true } });
    if (!listing || listing.businessId !== businessId || !await tx.businessUser.findFirst({ where: { businessId: listing.businessId, userId: session.user.id, role: { in: ["OWNER", "MANAGER"] } } })) throw new Error("Listing not found or access denied.");
    const isRevision=listing.status === "PUBLISHED" && Boolean(listing.draftForm && listing.draftSnapshot);
    if (listing.status !== "DRAFT" && !isRevision) throw new Error("Save a draft revision before submitting a published listing.");
    if (listing.business.verificationStatus !== "APPROVED") throw new Error("Business verification must be approved first.");
    const errors = submissionErrors(isRevision ? listing.draftSnapshot as unknown as Parameters<typeof submissionErrors>[0] : listing);
    if (errors.length) redirect(`/business/listings/${listingId}/review?incomplete=1`);
    if (await tx.listingSubmission.findFirst({ where: { listingId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } })) throw new Error("This listing is already awaiting review.");
    const { business, ...content } = listing; void business;
    await tx.listingSubmission.create({ data: { listingId, submittedBy: session.user.id, snapshot: isRevision ? listing.draftSnapshot! as Prisma.InputJsonObject : listingSnapshot(content), ...(isRevision ? {draftForm:listing.draftForm! as Prisma.InputJsonObject,baselineDigest:snapshotDigest(listingSnapshot(content))}:{}) } });
    await notifyAdmins(tx,"businesses.manage",{type:"SYSTEM",title:"Listing submitted for review",body:`${listing.title} has a new listing and photo submission. Open the listing review queue to inspect it.`},session.user.id);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/business/listings"); revalidatePath("/admin/listings");
  redirect(`/business/listings/${listingId}/review`);
}

export async function withdrawListing(form: FormData) {
  const { businessId, session } = await requireBusinessSession();
  const listingId = String(form.get("listingId") || "");
  await db.$transaction(async tx => {
    if (!businessId || !await tx.businessUser.findFirst({ where: { businessId, userId: session.user.id, role: { in: ["OWNER", "MANAGER"] } } })) throw new Error("Access denied.");
    await tx.listingSubmission.updateMany({ where: { listingId, listing: { businessId }, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } }, data: { status: "WITHDRAWN", notes: "Withdrawn by the business to make changes." } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath(`/business/listings/${listingId}/review`); revalidatePath("/admin/listings");
}

export async function decideListing(form: FormData) {
  const session = await requireAdminSession("businesses.manage");
  const id = String(form.get("submissionId") || "");
  const decision = String(form.get("decision") || "");
  const notes = String(form.get("notes") || "").trim();
  if (!["UNDER_REVIEW", "APPROVED", "NEEDS_CHANGES", "REJECTED"].includes(decision)) throw new Error("Invalid review decision.");
  if (decision !== "UNDER_REVIEW" && (!notes || notes.length > 5000)) throw new Error("Record your review reasons (1–5000 characters).");
  if (decision === "APPROVED" && ["photos", "accuracy", "pricing", "policies"].some(key => form.get(key) !== "on")) throw new Error("Complete every approval check.");
  await db.$transaction(async tx => {
    const submission = await tx.listingSubmission.findUnique({ where: { id }, include: { listing: { include: { ...reviewInclude, business: true } } } });
    if (!submission || !["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) throw new Error("This submission is no longer pending.");
    const { business, ...content } = submission.listing;
    if (snapshotDigest(listingSnapshot(content)) !== (submission.baselineDigest || snapshotDigest(submission.snapshot))) throw new Error("Listing content changed. Withdraw and resubmit before approval.");
    if (decision === "APPROVED") {
      const isRevision=Boolean(submission.draftForm && submission.baselineDigest);
      if (business.verificationStatus !== "APPROVED" || submission.listing.status !== (isRevision ? "PUBLISHED":"DRAFT") || submissionErrors(submission.snapshot as unknown as Parameters<typeof submissionErrors>[0]).length) throw new Error("Listing or business is not eligible for publication.");
      if(isRevision)await applyListingRevision(tx,content,restoreListingForm(submission.draftForm));
      await tx.listing.update({ where: { id: submission.listingId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
      if(isRevision)await tx.listing.update({where:{id:submission.listingId},data:{draftForm:Prisma.DbNull,draftSnapshot:Prisma.DbNull}});
    }
    await tx.listingSubmission.update({ where: { id }, data: { status: decision, notes: notes || "Review started.", reviewedBy: session.user.id, reviewedAt: new Date() } });
    const members = await tx.businessUser.findMany({ where: { businessId: submission.listing.businessId, role: { in: ["OWNER", "MANAGER"] } } });
    await tx.notification.createMany({ data: members.map(member => ({ userId: member.userId, type: "SYSTEM" as const, title: `Listing: ${decision.replaceAll("_", " ").toLowerCase()}`, body: `${submission.listing.title}: ${notes || "Review started."} See Business → Listings → Submission & feedback.` })) });
    await tx.auditLog.create({ data: { actorUserId: session.user.id, surface: "ADMIN", action: "listing.review", outcome: "SUCCESS", metadata: { submissionId: id, listingId: submission.listingId, decision, notes, checks: ["photos", "accuracy", "pricing", "policies"].filter(key => form.get(key) === "on") } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  revalidatePath("/", "layout");
  redirect(`/admin/listings/${id}`);
}
