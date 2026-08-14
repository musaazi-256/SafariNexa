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

    await db.$transaction([
      db.supportMessage.create({ data: { supportCaseId: caseId, authorUserId: activeSession.user.id, authorRole: "CUSTOMER", body } }),
      db.supportCase.update({ where: { id: caseId }, data: { updatedAt: new Date() } })
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
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {supportCase.caseRef} · {supportCase.category}
              </p>
              <h1 className="text-2xl font-extrabold">{supportCase.subject}</h1>
            </div>
            <SupportCaseStatusBadge status={status} />
          </div>

          {isClosed ? (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              This case is {status === "resolved" ? "resolved" : "closed"}. You can still reply if you need to reopen it.
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            {supportCase.messages.map((message) => {
              const isCustomer = message.authorRole === "CUSTOMER";
              return (
                <Card key={message.id} className={cn("max-w-[85%]", isCustomer ? "ml-auto bg-primary/5" : "")}>
                  <CardContent className="pt-4">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {isCustomer ? "You" : (message.author.name ?? "SafariNexa support")}
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

          <SupportReplyForm caseId={supportCase.id} action={postSupportReply} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
