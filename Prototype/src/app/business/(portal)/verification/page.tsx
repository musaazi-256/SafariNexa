import { FileText } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VerificationStatusBadge } from "@/components/ui/status-badge";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { toVerificationStatus } from "@/lib/status";

const IN_FLIGHT_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "NEEDS_CHANGES"] as const;

export default async function BusinessVerificationPage() {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <>
        <PageHero variant="portal" eyebrow="Business portal" title="Business verification" description="Submit documents and track approval." />
        <EmptyState title="No business linked to this account" description="Your account isn't attached to a verified business yet." />
      </>
    );
  }

  const latestVerification = await db.businessVerification.findFirst({
    where: { businessId },
    include: { documents: true },
    orderBy: { submittedAt: "desc" }
  });

  async function submitDocument(formData: FormData) {
    "use server";
    const { businessId: activeBusinessId } = await requireBusinessSession();
    if (!activeBusinessId) return;

    const type = String(formData.get("type") ?? "").trim();
    const fileUrl = String(formData.get("fileUrl") ?? "").trim();
    if (!type || !fileUrl) return;

    const current = await db.businessVerification.findFirst({
      where: { businessId: activeBusinessId },
      orderBy: { submittedAt: "desc" }
    });

    const isInFlight = current && (IN_FLIGHT_STATUSES as readonly string[]).includes(current.status);

    if (isInFlight && current) {
      await db.$transaction([
        db.businessDocument.create({ data: { businessVerificationId: current.id, type, fileUrl } }),
        db.businessVerification.update({ where: { id: current.id }, data: { status: "SUBMITTED", submittedAt: new Date() } }),
        db.businessProfile.update({ where: { id: activeBusinessId }, data: { verificationStatus: "SUBMITTED" } })
      ]);
    } else {
      await db.$transaction([
        db.businessVerification.create({
          data: { businessId: activeBusinessId, documents: { create: { type, fileUrl } } }
        }),
        db.businessProfile.update({ where: { id: activeBusinessId }, data: { verificationStatus: "SUBMITTED" } })
      ]);
    }
  }

  return (
    <>
      <PageHero variant="portal"
        eyebrow="Business portal"
        title="Business verification"
        description="Submit documents and track approval before publishing or receiving bookings."
      />

      <div>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Status</h2>
            <VerificationStatusBadge status={toVerificationStatus(business.verificationStatus)} />
          </div>

          {latestVerification?.reviewNotes ? (
            <Card className="mb-6 border-warning/30 bg-warning/10">
              <CardContent className="pt-6">
                <p className="text-sm font-semibold">Notes from the review team</p>
                <p className="mt-1 text-sm text-muted-foreground">{latestVerification.reviewNotes}</p>
              </CardContent>
            </Card>
          ) : null}

          <h2 className="mb-3 text-lg font-bold">Documents</h2>
          {latestVerification && latestVerification.documents.length > 0 ? (
            <div className="mb-6 flex flex-wrap gap-2">
              {latestVerification.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {doc.type}
                </a>
              ))}
            </div>
          ) : (
            <EmptyState title="No documents yet" description="Upload registration documents, licenses, and other evidence below." className="mb-6" />
          )}

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-bold">Add a document</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registration documents, licenses, tax IDs, and other evidence. Submitting moves your business back into review.
              </p>
              <form action={submitDocument} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="type">Document type</Label>
                  <Input id="type" name="type" placeholder="e.g. Business registration certificate" required />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="fileUrl">File URL</Label>
                  <Input id="fileUrl" name="fileUrl" type="url" placeholder="https://…" required />
                </div>
                <Button type="submit">Submit for review</Button>
              </form>
            </CardContent>
          </Card>
      </div>
    </>
  );
}
