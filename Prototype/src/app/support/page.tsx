import Link from "next/link";
import { redirect } from "next/navigation";
import { LifeBuoy, Plus } from "lucide-react";

import { auth } from "@/auth";
import { AccountLayout } from "@/components/account-layout";
import { SupportCaseForm } from "@/components/forms/support-case-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SupportCaseStatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { generateCaseRef } from "@/lib/support";
import { toSupportCaseStatus } from "@/lib/status";

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fsupport");

  const cases = await db.supportCase.findMany({
    where: { openedByUserId: session.user.id },
    orderBy: { createdAt: "desc" }
  });

  async function openSupportCase(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in?returnTo=%2Fsupport");

    const subject = String(formData.get("subject") ?? "").trim();
    const category = String(formData.get("category") ?? "Other");
    const message = String(formData.get("message") ?? "").trim();
    if (!subject || !message) return;

    const created = await db.supportCase.create({
      data: {
        caseRef: generateCaseRef(),
        openedByUserId: activeSession.user.id,
        subject,
        category,
        messages: {
          create: { authorUserId: activeSession.user.id, authorRole: "CUSTOMER", body: message }
        }
      }
    });

    redirect(`/support/${created.id}`);
  }

  return (
    <AccountLayout
      eyebrow="Account"
      title="Support centre"
      description="Bookings, payments, refunds, business verification, safety, and account access."
    >
      <div className="mb-6 flex items-center justify-between gap-3 bg-muted/30 p-4 rounded-2xl">
        <h2 className="text-lg font-bold">Your cases</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand-green hover:bg-brand-green/90 text-white font-bold rounded-xl px-4">
              <Plus className="h-4 w-4 mr-2" />
              Open a new case
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border-none shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold">Open a support case</DialogTitle>
              <DialogDescription>We&apos;ll get back to you here and notify you of any updates.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <SupportCaseForm action={openSupportCase} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {cases.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No support cases yet" description="Open a case if you need help with a booking, payment, or anything else." />
      ) : (
        <div className="flex flex-col gap-4">
          {cases.map((supportCase) => (
            <Link key={supportCase.id} href={`/support/${supportCase.id}`}>
              <Card className="transition-all hover:shadow-md hover:-translate-y-1 border-none shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 pb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-green mb-1.5">
                      {supportCase.caseRef} · {supportCase.category}
                    </p>
                    <h3 className="font-extrabold text-lg">{supportCase.subject}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Updated {supportCase.updatedAt.toLocaleDateString("en-UG", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <SupportCaseStatusBadge status={toSupportCaseStatus(supportCase.status)} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
