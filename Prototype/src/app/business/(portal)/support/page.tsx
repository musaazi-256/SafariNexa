import Link from "next/link";
import { redirect } from "next/navigation";
import { LifeBuoy, Plus } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { SupportCaseForm } from "@/components/forms/support-case-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SupportCaseStatusBadge } from "@/components/ui/status-badge";
import { notifyAdmins } from "@/lib/admin-notifications";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { BUSINESS_SUPPORT_CATEGORIES, generateCaseRef } from "@/lib/support";
import { toSupportCaseStatus } from "@/lib/status";

/** Business-side support centre: cases opened from the business portal (surface BUSINESS). */
export default async function BusinessSupportPage({ searchParams }: { searchParams: { new?: string } }) {
  const { session, businessId, business } = await requireBusinessSession();

  const [cases, bookings] = await Promise.all([
    db.supportCase.findMany({ where: { openedByUserId: session.user.id, surface: "BUSINESS" }, orderBy: { updatedAt: "desc" }, include: { relatedBooking: { select: { bookingRef: true } } } }),
    businessId ? db.booking.findMany({ where: { businessId }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, bookingRef: true, listing: { select: { title: true } } } }) : []
  ]);

  async function openBusinessCase(formData: FormData) {
    "use server";
    const { session: active, businessId: activeBusinessId } = await requireBusinessSession();
    const subject = String(formData.get("subject") ?? "").trim();
    const category = String(formData.get("category") ?? "Other");
    const message = String(formData.get("message") ?? "").trim();
    const requestedBooking = String(formData.get("relatedBookingId") ?? "");
    if (!subject || !message || !(BUSINESS_SUPPORT_CATEGORIES as readonly string[]).includes(category)) return;
    // Only link a booking that belongs to the business the user is working in.
    const relatedBooking = requestedBooking && activeBusinessId ? await db.booking.findFirst({ where: { id: requestedBooking, businessId: activeBusinessId }, select: { id: true } }) : null;

    const created = await db.$transaction(async (tx) => {
      const record = await tx.supportCase.create({
        data: {
          caseRef: generateCaseRef(),
          openedByUserId: active.user.id,
          surface: "BUSINESS",
          subject,
          category,
          relatedBookingId: relatedBooking?.id,
          messages: { create: { authorUserId: active.user.id, authorRole: "BUSINESS", body: message } }
        }
      });
      await notifyAdmins(tx, "support.manage", { type: "SUPPORT_UPDATE", title: "New business support case", body: `${record.caseRef}: ${record.subject}`, relatedSupportCaseId: record.id }, active.user.id);
      return record;
    });
    redirect(`/business/support/${created.id}`);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHero variant="portal" eyebrow="Business portal" title="Support" description={`Get help from SafariNexa with bookings, payouts, listings and verification${business ? ` for ${business.name}` : ""}.`} />
        <Dialog defaultOpen={searchParams.new === "1"}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" />Open a new case</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl border border-border shadow-floating">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">Open a support case</DialogTitle>
              <DialogDescription>Our team replies here and you&apos;ll get a notification for every update.</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <SupportCaseForm
                action={openBusinessCase}
                categories={BUSINESS_SUPPORT_CATEGORIES}
                subjectPlaceholder="e.g. Payout for October has not arrived"
                bookings={bookings.map((b) => ({ id: b.id, label: `${b.bookingRef} · ${b.listing.title}` }))}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {cases.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No support cases yet" description="Open a case if you need help with a booking, payout, listing review or verification." />
      ) : (
        <div className="flex flex-col gap-4">
          {cases.map((supportCase) => (
            <Link key={supportCase.id} href={`/business/support/${supportCase.id}`}>
              <Card className="rounded-2xl transition-shadow hover:shadow-card-hover">
                <CardContent className="flex flex-col justify-between gap-4 pb-6 pt-6 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-widest text-primary">{supportCase.caseRef} · {supportCase.category}{supportCase.relatedBooking ? ` · ${supportCase.relatedBooking.bookingRef}` : ""}</p>
                    <h3 className="break-words text-lg font-semibold">{supportCase.subject}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Updated {supportCase.updatedAt.toLocaleDateString("en-UG", { dateStyle: "medium" })}</p>
                  </div>
                  <SupportCaseStatusBadge status={toSupportCaseStatus(supportCase.status)} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
