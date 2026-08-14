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
    const activeSession = await requireAdminSession();

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
    await requireAdminSession();

    const caseId = String(formData.get("caseId"));
    const nextStatus = String(formData.get("status")) as PrismaSupportCaseStatus;

    await db.supportCase.update({ where: { id: caseId }, data: { status: nextStatus } });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs items={[{ label: "Support", href: "/admin/support" }, { label: supportCase.caseRef }]} />

          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {supportCase.caseRef} · {supportCase.category}
              </p>
              <h1 className="text-2xl font-extrabold">{supportCase.subject}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Opened by {supportCase.openedBy.name ?? supportCase.openedBy.email}
              </p>
            </div>
            <SupportCaseStatusBadge status={status} />
          </div>

          <div className="mb-6 mt-4 flex flex-wrap gap-2">
            {STATUS_OPTIONS.filter((option) => option.status !== supportCase.status).map((option) => (
              <form key={option.status} action={setCaseStatus}>
                <input type="hidden" name="caseId" value={supportCase.id} />
                <input type="hidden" name="status" value={option.status} />
                <Button type="submit" size="sm" variant="secondary">
                  {option.label}
                </Button>
              </form>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {supportCase.messages.map((message) => {
              const isAdmin = message.authorRole === "ADMIN";
              return (
                <Card key={message.id} className={cn("max-w-[85%]", isAdmin ? "ml-auto bg-primary/5" : "")}>
                  <CardContent className="pt-4">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isAdmin ? "SafariNexa support" : (message.author.name ?? "Customer")}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{message.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {message.createdAt.toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

      <SupportReplyForm caseId={supportCase.id} action={postAdminReply} />
    </div>
  );
}
