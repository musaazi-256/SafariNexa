import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { ConversationMessages } from "@/components/messages/conversation";
import { notFound } from "next/navigation";
import type { SupportCaseStatus as PrismaSupportCaseStatus } from "@prisma/client";

import { SupportReplyForm } from "@/components/forms/support-reply-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportCaseStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { toSupportCaseStatus } from "@/lib/status";

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
      openedBy: { select: { name: true, email: true, businessUsers: { select: { business: { select: { name: true } } } } } },
      relatedBooking: { select: { id: true, bookingRef: true } },
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

  const opener = supportCase.openedBy.name ?? supportCase.openedBy.email;
  const fmt = (date: Date) => date.toLocaleString("en-UG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Africa/Kampala" });
  const details: Array<[string, React.ReactNode]> = [
    ["Case reference", supportCase.caseRef],
    ["Category", supportCase.category],
    ["Raised from", supportCase.surface.charAt(0) + supportCase.surface.slice(1).toLowerCase() + " portal"],
    ["Opened by", <span key="opener" className="flex flex-col"><span>{opener}</span>{supportCase.openedBy.name ? <span className="text-xs font-normal text-muted-foreground">{supportCase.openedBy.email}</span> : null}</span>],
    ...(supportCase.surface === "BUSINESS" && supportCase.openedBy.businessUsers.length ? [["Opener's businesses", supportCase.openedBy.businessUsers.map((m) => m.business.name).join(", ")] as [string, React.ReactNode]] : []),
    ["Opened", fmt(supportCase.createdAt)],
    ["Last updated", fmt(supportCase.updatedAt)],
    ...(supportCase.closedAt ? [["Closed", fmt(supportCase.closedAt)] as [string, React.ReactNode]] : []),
    ["Related booking", supportCase.relatedBooking ? <Link key="booking" href={`/admin/bookings/${supportCase.relatedBooking.id}`} className="text-primary underline underline-offset-4">{supportCase.relatedBooking.bookingRef}</Link> : "None"]
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/admin/support"><ArrowLeft />Back to support</Link></Button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHero variant="portal" eyebrow={`${supportCase.caseRef} · ${supportCase.category}`} title={supportCase.subject} description={`Opened by ${opener}. Reply to the customer and keep the case status current.`} />
        <SupportCaseStatusBadge status={status} perspective="staff" />
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>{supportCase.messages.length} {supportCase.messages.length === 1 ? "message" : "messages"}. Replies notify the customer.</CardDescription>
          </CardHeader>
          <div className="max-h-[560px] min-h-[260px] overflow-y-auto border-y border-border bg-[#FAFBFA] p-4 sm:p-6">
            <ConversationMessages outgoingSenderIds={supportCase.messages.filter(message => message.authorRole === "ADMIN").map(message => message.authorUserId)} currentUserId={session.user.id} messages={supportCase.messages.map(message => ({ id: message.id, content: message.body, senderId: message.authorUserId, senderName: message.author.name ?? (message.authorRole === "ADMIN" ? "SafariNexa support" : message.authorRole === "BUSINESS" ? "Business" : "Customer"), createdAt: message.createdAt }))} />
          </div>
          <SupportReplyForm caseId={supportCase.id} action={postAdminReply} />
        </Card>

        <aside className="min-w-0 space-y-6">
          <Card>
            <CardHeader><CardTitle>Case details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm">
                {details.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Update case status</CardTitle>
              <CardDescription>The customer is notified when the status changes.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {STATUS_OPTIONS.filter((option) => option.status !== supportCase.status).map((option) => (
                <form key={option.status} action={setCaseStatus}>
                  <input type="hidden" name="caseId" value={supportCase.id} />
                  <input type="hidden" name="status" value={option.status} />
                  {option.status === "CLOSED" ? (
                    <ConfirmSubmit
                      title="Close this case?"
                      description="The case will be closed and the customer will no longer be able to reply to it. You can reopen it later."
                      confirmLabel="Close case"
                      trigger={<Button variant="outline" className="w-full">{option.label}</Button>}
                    />
                  ) : (
                    <Button type="submit" variant={option.status === "RESOLVED" ? "default" : "outline"} className="w-full">
                      {option.label}
                    </Button>
                  )}
                </form>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
