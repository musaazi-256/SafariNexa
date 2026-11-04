import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { ConversationMessages } from "@/components/messages/conversation";
import { notFound } from "next/navigation";
import type { SupportCaseStatus as PrismaSupportCaseStatus } from "@prisma/client";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { SupportReplyForm } from "@/components/forms/support-reply-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SupportCaseStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { toSupportCaseStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: Array<{ status: PrismaSupportCaseStatus; label: string }> = [
  { status: "OPEN", label: "Reopen" },
  { status: "IN_PROGRESS", label: "Mark in progress" },
  { status: "WAITING_ON_CUSTOMER", label: "Waiting on customer" },
  { status: "RESOLVED", label: "Resolve" },
  { status: "CLOSED", label: "Close" }
];

export default async function AdminSupportCaseDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAdminSession();

  const supportCase = await db.supportCase.findUnique({
    where: { id: params.id },
    include: {
      openedBy: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } }
    }
  });
  if (!supportCase) notFound();

  const status = toSupportCaseStatus(supportCase.status);

  async function postAdminReply(formData: FormData) {
    "use server";
    const activeSession = await requireAdminSession("support.manage");

    const caseId = String(formData.get("caseId"));
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;

    const target = await db.supportCase.findUnique({ where: { id: caseId } });
    if (!target) return;

    await db.$transaction([
      db.supportMessage.create({ data: { supportCaseId: caseId, authorUserId: activeSession.user.id, authorRole: "ADMIN", body } }),
      db.supportCase.update({ where: { id: caseId }, data: { updatedAt: new Date() } }),
      db.notification.create({
        data: {
          userId: target.openedByUserId,
          type: "SUPPORT_UPDATE",
          title: "New reply on your support case",
          body: `${target.caseRef}: ${body.length > 120 ? `${body.slice(0, 117)}...` : body}`,
          relatedSupportCaseId: target.id
        }
      })
    ]);
  }

  async function setCaseStatus(formData: FormData) {
    "use server";
    await requireAdminSession("support.manage");

    const caseId = String(formData.get("caseId"));
    const nextStatus = String(formData.get("status")) as PrismaSupportCaseStatus;

    if (!STATUS_OPTIONS.some(option=>option.status===nextStatus)) throw new Error("Choose a valid support status.");
    await db.$transaction(async tx=>{
      const target=await tx.supportCase.findUnique({where:{id:caseId}});
      if(!target||target.status===nextStatus)return;
      await tx.supportCase.update({where:{id:caseId},data:{status:nextStatus,closedAt:["CLOSED","RESOLVED"].includes(nextStatus)?new Date():null}});
      await tx.notification.create({data:{userId:target.openedByUserId,type:"SUPPORT_UPDATE",title:"Support case status updated",body:`${target.caseRef}: ${nextStatus.toLowerCase().replaceAll("_"," ")}. Open your support case for details.`,relatedSupportCaseId:caseId}});
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs items={[{ label: "Support", href: "/admin/support" }, { label: supportCase.caseRef }]} />

          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {supportCase.caseRef} · {supportCase.category}
              </p>
              <h1 className="type-page ">{supportCase.subject}</h1>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Opened by {supportCase.openedBy.name ?? supportCase.openedBy.email}
              </p>
            </div>
            <SupportCaseStatusBadge status={status}  perspective="staff" />
          </div>

          <div className="mb-6 mt-4 flex flex-wrap gap-2">
            {STATUS_OPTIONS.filter((option) => option.status !== supportCase.status).map((option) => (
              <form key={option.status} action={setCaseStatus}>
                <input type="hidden" name="caseId" value={supportCase.id} />
                <input type="hidden" name="status" value={option.status} />
                {option.status === "CLOSED" ? (
                  <ConfirmSubmit
                    title="Close this case?"
                    description="The case will be closed and the customer will no longer be able to reply to it. You can reopen it later."
                    confirmLabel="Close case"
                    trigger={<Button size="sm" variant="secondary">{option.label}</Button>}
                  />
                ) : (
                  <Button type="submit" size="sm" variant="secondary">
                    {option.label}
                  </Button>
                )}
              </form>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="max-h-[560px] min-h-[260px] overflow-y-auto bg-[#FAFBFA] p-4 sm:p-6"><ConversationMessages outgoingSenderIds={supportCase.messages.filter(message => message.authorRole === "ADMIN").map(message => message.authorUserId)} currentUserId={session.user.id} messages={supportCase.messages.map(message => ({ id: message.id, content: message.body, senderId: message.authorUserId, senderName: message.author.name ?? (message.authorRole === "ADMIN" ? "SafariNexa support" : "Customer"), createdAt: message.createdAt }))} /></div>
            <SupportReplyForm caseId={supportCase.id} action={postAdminReply} />
          </div>


    </div>
  );
}
