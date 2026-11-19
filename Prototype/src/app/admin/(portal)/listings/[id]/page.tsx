import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, ClipboardCheck, ClipboardList, History, MessageSquare } from "lucide-react";

import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { ApprovalChecklist, DocumentReview, ListingEvidenceProvider, PhotoReview, type EvidenceDocument, type PhotoGroup } from "@/components/admin/listing-evidence-review";
import { ListingSubmissionContent } from "@/components/listing-submission-content";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ListingSubmissionStatusBadge, VerificationStatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { decideListing } from "@/lib/actions/listing-review";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { toVerificationStatus } from "@/lib/status";
import { documentLink } from "@/lib/document-link";
import { isDemoMode } from "@/lib/dev-mode";

const fmt = (d?: Date | null) => d ? d.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Kampala" }) : "—";

const DOC_LABELS: Record<string, string> = { INCORPORATION: "Certificate of incorporation", LICENSES: "Licences & permits", TAX: "Tax documents", IDENTITY: "Identity document", OTHER: "Other document" };
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : []);

/** Every photo in the submitted snapshot, grouped the way travellers meet them. */
function photoGroups(snapshot: Record<string, unknown>): PhotoGroup[] {
  const cover = typeof snapshot.coverImageUrl === "string" && snapshot.coverImageUrl ? snapshot.coverImageUrl : null;
  const gallery = strings(snapshot.images).filter((src) => src !== cover);
  const acc = snapshot.accommodation as { roomTypes?: Array<{ name?: string; images?: unknown }> } | null | undefined;
  const rooms = (acc?.roomTypes ?? []).map((r, i) => ({ label: `Room · ${r.name || `Room ${i + 1}`}`, images: strings(r.images) }));
  return [{ label: "Cover photo", images: cover ? [cover] : [] }, { label: "Gallery", images: gallery }, ...rooms];
}

export default async function ReviewListing({ params }: { params: { id: string } }) {
  await requireAdminSession("businesses.manage");
  const submission = await db.listingSubmission.findUnique({ where: { id: params.id }, include: { listing: { include: { business: true } } } });
  if (!submission) notFound();
  const { listing } = submission;
  const [people, history] = await Promise.all([
    db.user.findMany({ where: { id: { in: [submission.submittedBy, submission.reviewedBy].filter(Boolean) as string[] } }, select: { id: true, name: true, email: true } }),
    db.listingSubmission.findMany({ where: { listingId: listing.id, id: { not: submission.id } }, orderBy: { submittedAt: "desc" }, take: 10 })
  ]);
  const who = (id?: string | null) => { const p = people.find((u) => u.id === id); return p?.name || p?.email || "Unknown user"; };
  const pending = ["SUBMITTED", "UNDER_REVIEW"].includes(submission.status);
  const snapshot = submission.snapshot as Record<string, unknown>;
  const groups = photoGroups(snapshot);
  // Business evidence: documents from the most recent verification that has any.
  const verification = await db.businessVerification.findFirst({ where: { businessId: listing.businessId, documents: { some: {} } }, orderBy: { submittedAt: "desc" }, include: { documents: { orderBy: { uploadedAt: "asc" } } } });
  const demo = isDemoMode();
  const documents: EvidenceDocument[] = (verification?.documents ?? []).map((doc) => {
    const href = documentLink(doc.fileUrl, doc.type, demo, doc.id);
    return { id: doc.id, kind: "file", label: DOC_LABELS[doc.type] ?? doc.type.replaceAll("_", " "), detail: `Business verification · uploaded ${doc.uploadedAt.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "Africa/Kampala" })}`, href, inlineHref: href.startsWith("/api/documents/") ? `${href}?view=inline` : href };
  });
  const restaurant = snapshot.restaurant as { menuUrl?: string | null } | null | undefined;
  if (restaurant?.menuUrl) documents.push({ id: "menu", kind: "link", label: "Menu", detail: "Linked from the listing", href: restaurant.menuUrl });
  const businessVerified = listing.business.verificationStatus === "APPROVED";

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/admin/listings"><ArrowLeft />Back to listing queue</Link></Button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHero variant="portal" eyebrow="Listing verification" title={listing.title} description="Open every photo and document, check the details, then record your decision. Approval publishes exactly this content." />
        <ListingSubmissionStatusBadge status={submission.status} />
      </div>

      <ListingEvidenceProvider submissionId={submission.id} groups={groups} documents={documents}>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <PhotoReview groups={groups} title={listing.title} />
          <DocumentReview businessName={listing.business.name} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" />Listing details</CardTitle>
              <CardDescription>Every field exactly as submitted. Approval publishes this content.</CardDescription>
            </CardHeader>
            <CardContent><ListingSubmissionContent value={submission.snapshot} hideImages /></CardContent>
          </Card>
        </div>

        <aside className="min-w-0 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-primary" />Submission</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Business</dt><dd className="mt-0.5 flex flex-wrap items-center gap-2 font-medium"><Link href={`/admin/businesses/${listing.businessId}`} className="underline">{listing.business.name}</Link><VerificationStatusBadge status={toVerificationStatus(listing.business.verificationStatus)} /></dd></div>
                <div><dt className="text-xs text-muted-foreground">Listing type</dt><dd className="mt-0.5 font-medium capitalize">{listing.type.toLowerCase()}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Kind</dt><dd className="mt-0.5 font-medium">{submission.draftForm && submission.baselineDigest ? "Revision of a live listing" : "New listing"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Submitted</dt><dd className="mt-0.5 font-medium">{fmt(submission.submittedAt)} by {who(submission.submittedBy)}</dd></div>
                {submission.reviewedAt && <div><dt className="text-xs text-muted-foreground">Last decision</dt><dd className="mt-0.5 font-medium">{fmt(submission.reviewedAt)} by {who(submission.reviewedBy)}</dd></div>}
              </dl>
              <Button asChild variant="outline" size="sm" className="mt-4"><Link href={`/admin/businesses/${listing.businessId}/listings/${listing.id}`}>View listing record</Link></Button>
            </CardContent>
          </Card>

          {!businessVerified && <p role="alert" className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm leading-relaxed">This business isn&apos;t verified yet, so the listing can&apos;t be approved. <Link href="/admin/verification" className="underline">Open business verification</Link>.</p>}

          {submission.notes && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4 text-primary" />Feedback sent to the business</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm leading-relaxed">{submission.notes}</p></CardContent>
            </Card>
          )}

          {pending && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="h-4 w-4 text-primary" />Review decision</CardTitle>
                <CardDescription>Open every photo and document, then tick each check to approve. Notes are sent to the business.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={decideListing} className="space-y-5">
                  <input type="hidden" name="submissionId" value={submission.id} />
                  <ApprovalChecklist />
                  <div className="space-y-2">
                    <Label htmlFor="review-notes">Reasons or changes required</Label>
                    <Textarea id="review-notes" name="notes" required maxLength={5000} rows={4} placeholder="e.g. Replace the blurry bathroom photo and add the cancellation terms." />
                  </div>
                  <div className="grid gap-2">
                    <ConfirmSubmit name="decision" value="APPROVED" destructive={false} title="Approve and publish?" description={<><strong>{listing.title}</strong> will go live on the public marketplace and can be booked by travellers straight away.</>} previewField="notes" previewLabel="Notes sent to the business" confirmLabel="Approve and publish" trigger={<Button className="w-full" disabled={!businessVerified}>Approve and publish</Button>} />
                    <Button name="decision" value="NEEDS_CHANGES" variant="outline" className="w-full">Request changes</Button>
                    {submission.status === "SUBMITTED" && <Button name="decision" value="UNDER_REVIEW" variant="ghost" className="w-full" formNoValidate>Mark as under review</Button>}
                    <ConfirmSubmit name="decision" value="REJECTED" title="Reject this listing?" description={<><strong>{listing.title}</strong> will not be published. The business will see your reasons.</>} previewField="notes" previewLabel="Reasons sent to the business" confirmLabel="Reject listing" trigger={<Button variant="destructive" className="w-full">Reject</Button>} />
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {history.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-primary" />Earlier submissions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {history.map((h) => (
                  <Link key={h.id} href={`/admin/listings/${h.id}`} className="block rounded-xl border border-border p-3 text-sm hover:bg-muted/40">
                    <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{fmt(h.submittedAt)}</span><ListingSubmissionStatusBadge status={h.status} /></div>
                    {h.notes && <p className="mt-1 line-clamp-2 text-muted-foreground">{h.notes}</p>}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
      </ListingEvidenceProvider>
    </div>
  );
}
