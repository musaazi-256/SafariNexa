import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, ClipboardList, Clock, AlertTriangle } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { RemoteImage } from "@/components/remote-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { ListingStatusBadge, ListingSubmissionStatusBadge, VerificationStatusBadge } from "@/components/ui/status-badge";
import { requireBusinessSession } from "@/lib/business";
import { publicListingHref } from "@/lib/listing-links";
import { db } from "@/lib/db";
import { toVerificationStatus } from "@/lib/status";

export const metadata = { title: "Verification outcomes - SafariNexa Business" };

const fmt = (d?: Date | null) => d ? d.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "Africa/Kampala" }) : null;

const BUSINESS_OUTCOME: Record<string, { heading: string; body: string }> = {
  NOT_STARTED: { heading: "Not submitted yet", body: "Upload your business documents to start verification. Listings can't be submitted until your business is approved." },
  DRAFT: { heading: "Draft saved", body: "Your verification is saved but hasn't been sent for review." },
  SUBMITTED: { heading: "Waiting for review", body: "Your documents have been submitted. You'll be notified when a reviewer records a decision." },
  UNDER_REVIEW: { heading: "Under review", body: "A SafariNexa reviewer is checking your documents." },
  NEEDS_CHANGES: { heading: "Changes requested", body: "The reviewer needs more information. Read their notes, update your documents and resubmit." },
  APPROVED: { heading: "Business verified", body: "Your business is approved. You can now submit listings for approval." },
  REJECTED: { heading: "Not approved", body: "Your business verification was not approved. Read the reviewer's notes or contact support." },
  SUSPENDED: { heading: "Suspended", body: "Your verification is on hold and your listings are hidden. Contact support." }
};

function listingAction(listing: { id: string; type: string; status: string }, review: string) {
  if (review === "NEEDS_CHANGES") return { href: `/business/listings/${listing.id}/edit`, label: "Edit and resubmit" };
  if (listing.status === "ARCHIVED") return { href: `/business/listings/${listing.id}/preview`, label: "Preview" };
  if (review === "NOT_SUBMITTED" || review === "WITHDRAWN") return { href: `/business/listings/${listing.id}/preview`, label: "Preview and submit" };
  if (listing.status === "PUBLISHED") return { href: publicListingHref(listing), label: "View live listing" };
  return { href: `/business/listings/${listing.id}/review`, label: "View details" };
}

export default async function VerificationOutcomesPage() {
  const { business, businessId } = await requireBusinessSession();
  if (!business || !businessId) return <EmptyState title="No business linked" description="Your account isn't attached to a business yet." />;

  const [verification, listings] = await Promise.all([
    db.businessVerification.findFirst({ where: { businessId }, orderBy: { submittedAt: "desc" }, include: { _count: { select: { documents: true } } } }),
    db.listing.findMany({ where: { businessId }, orderBy: { updatedAt: "desc" }, include: { submissions: { orderBy: { submittedAt: "desc" }, take: 1 } } })
  ]);

  const outcome = BUSINESS_OUTCOME[business.verificationStatus] ?? BUSINESS_OUTCOME.NOT_STARTED;
  // Listings published before reviews existed (seed/demo data) count as approved and live.
  const PRIORITY: Record<string, number> = { NEEDS_CHANGES: 0, REJECTED: 1, SUBMITTED: 2, UNDER_REVIEW: 2, NOT_SUBMITTED: 3, WITHDRAWN: 3, APPROVED: 4 };
  const reviews = listings
    .map((l) => ({ listing: l, submission: l.submissions[0], review: l.submissions[0]?.status ?? (l.status === "PUBLISHED" ? "APPROVED" : "NOT_SUBMITTED") }))
    .sort((a, b) => (PRIORITY[a.review] ?? 5) - (PRIORITY[b.review] ?? 5) + (a.listing.status === "ARCHIVED" ? 10 : 0) - (b.listing.status === "ARCHIVED" ? 10 : 0));
  const approved = reviews.filter((r) => r.review === "APPROVED").length;
  const pending = reviews.filter((r) => ["SUBMITTED", "UNDER_REVIEW"].includes(r.review)).length;
  const action = reviews.filter((r) => ["NEEDS_CHANGES", "REJECTED"].includes(r.review)).length;
  const tone = business.verificationStatus === "APPROVED" ? "border-success/30 bg-success/5" : ["NEEDS_CHANGES", "REJECTED", "SUSPENDED"].includes(business.verificationStatus) ? "border-warning/40 bg-warning/5" : "border-border bg-card";

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <PageHero variant="portal" eyebrow="Verification" title="Verification outcomes" description="See the review decisions for your business and each of your listings, with the reviewer's notes." />

      <section aria-labelledby="business-outcome" className={`rounded-2xl border p-5 shadow-card sm:p-6 ${tone}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Business verification · {business.name}</p>
              <h2 id="business-outcome" className="mt-1 type-card">{outcome.heading}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{outcome.body}</p>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                {verification && <div><dt className="text-xs text-muted-foreground">Submitted</dt><dd className="font-medium">{fmt(verification.submittedAt)}</dd></div>}
                {verification?.reviewedAt && <div><dt className="text-xs text-muted-foreground">Decision recorded</dt><dd className="font-medium">{fmt(verification.reviewedAt)}</dd></div>}
                {verification && <div><dt className="text-xs text-muted-foreground">Documents</dt><dd className="font-medium">{verification._count.documents}</dd></div>}
              </dl>
            </div>
          </div>
          <VerificationStatusBadge status={toVerificationStatus(business.verificationStatus)} />
        </div>
        {verification?.reviewNotes?.trim() && (
          <blockquote className="mt-5 rounded-xl border border-border bg-background p-4 text-sm leading-relaxed">
            <p className="text-xs font-semibold text-muted-foreground">Reviewer notes</p>
            <p className="mt-1 whitespace-pre-wrap">{verification.reviewNotes}</p>
          </blockquote>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant={business.verificationStatus === "APPROVED" ? "outline" : "default"}>
            <Link href="/business/settings/verification">{business.verificationStatus === "NEEDS_CHANGES" ? "Update documents" : business.verificationStatus === "NOT_STARTED" ? "Upload documents" : "View documents"}<ArrowRight /></Link>
          </Button>
          {["REJECTED", "SUSPENDED"].includes(business.verificationStatus) && <Button asChild variant="outline"><Link href="/business/support?new=1">Contact support</Link></Button>}
        </div>
      </section>

      <StatGrid columns={5}>
        <StatCard compact label="Listings approved" value={approved} icon={CheckCircle2} description="Approved on their latest review" />
        <StatCard compact label="Awaiting review" value={pending} icon={Clock} description="Submitted or under review" />
        <StatCard compact label="Need your action" value={action} icon={AlertTriangle} description="Changes requested or rejected" />
      </StatGrid>

      <section aria-labelledby="listing-outcomes" className="space-y-3">
        <h2 id="listing-outcomes" className="type-section">Listing reviews</h2>
        {reviews.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No listings yet" description="Create a listing, then submit it for approval. Its outcome will appear here." action={<Button asChild><Link href="/business/listings/new">Create listing</Link></Button>} />
        ) : reviews.map(({ listing, submission, review }) => {
          const next = listingAction(listing, review);
          return (
            <article key={listing.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {listing.coverImageUrl && <RemoteImage src={listing.coverImageUrl} alt="" width={192} height={128} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="type-label font-semibold">{listing.title}</h3>
                    <ListingSubmissionStatusBadge status={review} />
                    <ListingStatusBadge status={listing.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">
                    {listing.type.toLowerCase()}
                    {submission && <> · Submitted {fmt(submission.submittedAt)}</>}
                    {submission?.reviewedAt && <> · Reviewed {fmt(submission.reviewedAt)}</>}
                  </p>
                  {submission?.notes && submission.reviewedAt && (
                    <p className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/40 p-3 text-sm leading-relaxed"><span className="font-semibold">Reviewer notes: </span>{submission.notes}</p>
                  )}
                  {review === "NOT_SUBMITTED" && <p className="mt-2 text-sm text-muted-foreground">{listing.status === "ARCHIVED" ? "Archived. Not shown to travellers." : "Not submitted for approval yet."}</p>}
                  {!submission && listing.status === "PUBLISHED" && <p className="mt-2 text-sm text-muted-foreground">Live on SafariNexa{listing.publishedAt ? ` since ${fmt(listing.publishedAt)}` : ""}.</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                  <Button asChild size="sm" variant={["NEEDS_CHANGES", "NOT_SUBMITTED"].includes(review) ? "default" : "outline"}><Link href={next.href}>{next.label}</Link></Button>
                  <Button asChild size="sm" variant="ghost"><Link href={`/business/listings/${listing.id}/review`}>Review history</Link></Button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
