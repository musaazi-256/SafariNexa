import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { ConversationMessages } from "@/components/messages/conversation";
import { PageHero } from "@/components/page-hero";
import { SupportReplyForm } from "@/components/forms/support-reply-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SupportCaseStatusBadge } from "@/components/ui/status-badge";
import { adminNotificationData } from "@/lib/admin-notifications";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { toSupportCaseStatus } from "@/lib/status";

export default async function BusinessSupportCasePage({ params }: { params: { id: string } }) {
  const { session } = await requireBusinessSession();
  const supportCase = await db.supportCase.findUnique({
    where: { id: params.id },
    include: {
      relatedBooking: { select: { id: true, bookingRef: true, businessId: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true } } } }
    }
  });
  if (!supportCase || supportCase.openedByUserId !== session.user.id || supportCase.surface !== "BUSINESS") notFound();

  const status = toSupportCaseStatus(supportCase.status);
  const isClosed = status === "resolved" || status === "closed";

  async function postBusinessReply(formData: FormData) {
    "use server";
    const { session: active } = await requireBusinessSession();
    const caseId = String(formData.get("caseId"));
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;
    const target = await db.supportCase.findUnique({ where: { id: caseId } });
    if (!target || target.openedByUserId !== active.user.id || target.surface !== "BUSINESS") throw new Error("Support case not found.");
    const alerts = await adminNotificationData(db, "support.manage", { type: "SUPPORT_UPDATE", title: "Business replied to a support case", body: `${target.caseRef}: ${target.subject}`, relatedSupportCaseId: target.id }, active.user.id);
    await db.$transaction([
      db.supportMessage.create({ data: { supportCaseId: caseId, authorUserId: active.user.id, authorRole: "BUSINESS", body } }),
      db.supportCase.update({ where: { id: caseId }, data: { updatedAt: new Date(), ...(["CLOSED", "RESOLVED"].includes(target.status) ? { status: "OPEN", closedAt: null } : {}) } }),
      db.notification.createMany({ data: alerts })
    ]);
  }

  const fmt = (date: Date) => date.toLocaleString("en-UG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Africa/Kampala" });
  const booking = supportCase.relatedBooking;
  const details: Array<[string, React.ReactNode]> = [
    ["Case reference", supportCase.caseRef],
    ["Category", supportCase.category],
    ["Opened", fmt(supportCase.createdAt)],
    ["Last updated", fmt(supportCase.updatedAt)],
    ...(supportCase.closedAt ? [["Closed", fmt(supportCase.closedAt)] as [string, React.ReactNode]] : []),
    ["Related booking", booking ? (session.user.businessIds.includes(booking.businessId) ? <Link key="b" href={`/business/bookings/${booking.id}`} className="text-primary underline underline-offset-4">{booking.bookingRef}</Link> : booking.bookingRef) : "None"]
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/business/support"><ArrowLeft />Back to support</Link></Button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHero variant="portal" eyebrow={`${supportCase.caseRef} · ${supportCase.category}`} title={supportCase.subject} description="Your conversation with the SafariNexa support team." />
        <SupportCaseStatusBadge status={status} />
      </div>

      {isClosed ? (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          This case is {status === "resolved" ? "resolved" : "closed"}. Replying reopens it.
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>Replies from SafariNexa appear here and in your notifications.</CardDescription>
          </CardHeader>
          <div className="max-h-[560px] min-h-[260px] overflow-y-auto border-y border-border bg-[#FAFBFA] p-4 sm:p-6">
            <ConversationMessages currentUserId={session.user.id} messages={supportCase.messages.map((message) => ({ id: message.id, content: message.body, senderId: message.authorUserId, senderName: message.authorRole === "ADMIN" ? "SafariNexa support" : message.author.name ?? "You", createdAt: message.createdAt }))} />
          </div>
          <SupportReplyForm caseId={supportCase.id} action={postBusinessReply} />
        </Card>
        <aside className="min-w-0">
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
        </aside>
      </div>
    </div>
  );
}
