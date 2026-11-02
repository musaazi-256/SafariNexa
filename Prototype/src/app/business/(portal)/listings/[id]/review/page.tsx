import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { listingSnapshot, reviewInclude, submissionErrors } from "@/lib/listing-review";
import { submitListing, withdrawListing } from "@/lib/actions/listing-review";
import { ListingSubmissionContent } from "@/components/listing-submission-content";
import { Button } from "@/components/ui/button";

export default async function ListingReviewPage({ params, searchParams }: { params: {id: string}; searchParams: {incomplete?: string} }) {
  const { businessId, business } = await requireBusinessSession();
  const listing = await db.listing.findUnique({ where: { id: params.id }, include: reviewInclude });
  if (!listing || listing.businessId !== businessId) notFound();
  const history = await db.listingSubmission.findMany({ where: {listingId: listing.id}, orderBy: {submittedAt: "desc"} });
  const pending = history.find(item => ["SUBMITTED", "UNDER_REVIEW"].includes(item.status));
  const proposed=listing.status === "PUBLISHED" && listing.draftSnapshot ? listing.draftSnapshot as unknown as Parameters<typeof submissionErrors>[0] : listing;
  const errors = submissionErrors(proposed);
  return <div className="mx-auto max-w-4xl space-y-6 pb-16">
    <Link href="/business/listings" className="underline">Back to listings</Link>
    <h1 className="text-2xl font-bold">Submission & feedback: {listing.title}</h1>
    <p>Publication: {listing.status}. Review: {history[0]?.status.replaceAll("_", " ") || "Not submitted"}.</p>
    {business?.verificationStatus !== "APPROVED" && <p role="alert" className="rounded border border-orange-300 p-4">Business verification must be approved before this listing can be submitted. <Link href="/business/verification" className="underline">View business verification</Link>.</p>}
    {(listing.type === "ACCOMMODATION" || listing.type === "TOUR") && <Link className="block underline" href={`/business/listings/${listing.id}/availability`}>Manage operational availability and date-specific prices</Link>}
    <p className="rounded border p-4">Uploading a photo does not approve it. Submit the saved listing or draft revision below. Admin reviews every cover, gallery and room photo with the details. Pending submissions are locked. Published listings stay live with their approved information until a revision is approved.</p>
    <Link href={`/business/listings/${listing.id}/edit`} className="block underline">{listing.status === "PUBLISHED" ? "Edit a draft revision — keep approved listing live" : "Edit draft listing"}</Link>
    {errors.length > 0 && <div role={searchParams.incomplete ? "alert" : undefined} className="rounded border border-orange-300 p-4"><h2 className="font-bold">Before submitting</h2><ul className="list-inside list-disc">{errors.map(error => <li key={error}>{error}</li>)}</ul><Link className="underline" href={`/business/listings/${listing.id}/edit`}>Edit listing</Link></div>}
    {pending ? <form action={withdrawListing}><input type="hidden" name="listingId" value={listing.id}/><Button variant="outline">Withdraw to make changes</Button></form> : listing.status === "DRAFT" || listing.status === "PUBLISHED" && listing.draftSnapshot ? <form action={submitListing}><input type="hidden" name="listingId" value={listing.id}/><Button disabled={errors.length > 0 || business?.verificationStatus !== "APPROVED"}>Submit listing and photos for approval</Button></form> : null}
    <section className="space-y-3"><h2 className="text-xl font-bold">Review history</h2>{history.length ? history.map(item => <details key={item.id} className="rounded border p-4" open={item.id === history[0].id}><summary className="cursor-pointer font-semibold">{item.status.replaceAll("_", " ")} · {item.submittedAt.toLocaleString("en-GB", {timeZone: "Africa/Kampala"})}</summary><p className="my-3 whitespace-pre-wrap">{item.notes || "Awaiting admin review."}</p>{item.reviewedAt && <p className="mb-3 text-sm">Reviewed {item.reviewedAt.toISOString()}</p>}<details><summary className="cursor-pointer underline">View exact submitted information and photos</summary><ListingSubmissionContent value={item.snapshot}/></details></details>) : <p>No submissions yet.</p>}</section>
    <details className="rounded border p-4"><summary className="cursor-pointer font-bold">Preview {listing.draftSnapshot ? "draft revision" : "current saved information"} and photos</summary><ListingSubmissionContent value={listing.draftSnapshot || listingSnapshot(listing)}/></details>
  </div>;
}
