import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, Pencil, Send } from "lucide-react";

import { ListingPreview, type PreviewListing } from "@/components/business/listing-preview";
import { Button } from "@/components/ui/button";
import { ListingStatusBadge, ListingSubmissionStatusBadge } from "@/components/ui/status-badge";
import { submitListing } from "@/lib/actions/listing-review";
import { requireBusinessSession } from "@/lib/business";
import { publicListingHref } from "@/lib/business-getting-started";
import { db } from "@/lib/db";
import { reviewInclude, submissionErrors } from "@/lib/listing-review";

export const metadata = { title: "Listing preview - SafariNexa Business" };

export default async function ListingPreviewPage({ params }: { params: { id: string } }) {
  const { businessId, business } = await requireBusinessSession();
  const listing = await db.listing.findUnique({ where: { id: params.id }, include: { ...reviewInclude, submissions: { orderBy: { submittedAt: "desc" }, take: 1 } } });
  if (!listing || listing.businessId !== businessId) notFound();

  // A published listing with a pending revision previews the revision; otherwise the saved listing.
  const isRevision = listing.status === "PUBLISHED" && Boolean(listing.draftSnapshot);
  const content = (isRevision ? listing.draftSnapshot : listing) as unknown as PreviewListing;
  const review = listing.submissions[0]?.status ?? "NOT_SUBMITTED";
  const pending = ["SUBMITTED", "UNDER_REVIEW"].includes(review);
  const errors = submissionErrors(content as unknown as Parameters<typeof submissionErrors>[0]);
  const verified = business?.verificationStatus === "APPROVED";
  const canSubmit = !pending && (listing.status === "DRAFT" || isRevision);

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Eye className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Preview: how travellers will see {isRevision ? "your revision" : "this listing"}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <ListingStatusBadge status={listing.status} /><ListingSubmissionStatusBadge status={review} />
                {listing.status === "PUBLISHED" && !isRevision && <Link className="underline" href={publicListingHref(listing)}>Open live page</Link>}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link href={`/business/listings/${listing.id}/edit`}><Pencil />Edit</Link></Button>
            {canSubmit && (
              <form action={submitListing}>
                <input type="hidden" name="listingId" value={listing.id} />
                <Button size="sm" disabled={errors.length > 0 || !verified}><Send />Submit for approval</Button>
              </form>
            )}
            {pending && <Button asChild size="sm" variant="secondary"><Link href={`/business/listings/${listing.id}/review`}>Awaiting review</Link></Button>}
          </div>
        </div>
        {canSubmit && (errors.length > 0 || !verified) && (
          <div role="status" className="mt-3 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm">
            <p className="font-medium">Before you can submit</p>
            <ul className="mt-1 list-inside list-disc text-muted-foreground">
              {!verified && <li>Your business must be verified. <Link href="/business/verification" className="underline">View verification</Link></li>}
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </div>
        )}
      </div>

      <ListingPreview listing={content} businessName={business?.name ?? ""} />
    </div>
  );
}
