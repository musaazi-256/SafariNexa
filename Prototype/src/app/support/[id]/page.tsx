import { adminNotificationData } from "@/lib/admin-notifications";
import { ConversationMessages } from "@/components/messages/conversation";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SupportReplyForm } from "@/components/forms/support-reply-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SupportCaseStatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { toSupportCaseStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

export default async function SupportCaseDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/support/${params.id}`)}`);

  const supportCase = await db.supportCase.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } } }
  });
  if (!supportCase || supportCase.openedByUserId !== session.user.id) notFound();

  const status = toSupportCaseStatus(supportCase.status);
  const isClosed = status === "resolved" || status === "closed";

  async function postSupportReply(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/support/${params.id}`)}`);

    const caseId = String(formData.get("caseId"));
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;

    const target = await db.supportCase.findUnique({ where: { id: caseId } });
    if (!target || target.openedByUserId !== activeSession.user.id) throw new Error("Support case not found.");

    const alerts=await adminNotificationData(db,"support.manage",{type:"SUPPORT_UPDATE",title:"Customer replied to a support case",body:`${target.caseRef}: ${target.subject}`,relatedSupportCaseId:target.id},activeSession.user.id);
    await db.$transaction([
      db.supportMessage.create({ data: { supportCaseId: caseId, authorUserId: activeSession.user.id, authorRole: "CUSTOMER", body } }),
      db.supportCase.update({ where: { id: caseId }, data: { updatedAt: new Date(), ...( ["CLOSED", "RESOLVED"].includes(target.status) ? { status: "OPEN", closedAt: null } : {} ) } }),
      db.notification.createMany({data:alerts})
    ]);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="max-w-3xl pb-20 pt-6">
          <Breadcrumbs items={[{ label: "Support", href: "/support" }, { label: supportCase.caseRef }]} />

          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {supportCase.caseRef} · {supportCase.category}
              </p>
              <h1 className="text-2xl font-semibold">{supportCase.subject}</h1>
            </div>
            <SupportCaseStatusBadge status={status} />
          </div>

          {isClosed ? (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              This case is {status === "resolved" ? "resolved" : "closed"}. You can still reply if you need to reopen it.
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="max-h-[560px] min-h-[260px] overflow-y-auto bg-[#FAFBFA] p-4 sm:p-6"><ConversationMessages currentUserId={session.user.id} messages={supportCase.messages.map(message => ({ id: message.id, content: message.body, senderId: message.authorUserId, senderName: message.author.name ?? (message.authorRole === "ADMIN" ? "SafariNexa support" : "Customer"), createdAt: message.createdAt }))} /></div>
            <SupportReplyForm caseId={supportCase.id} action={postSupportReply} />
          </div>


        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
