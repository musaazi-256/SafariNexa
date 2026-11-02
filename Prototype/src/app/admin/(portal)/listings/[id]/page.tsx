import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { ListingSubmissionContent } from "@/components/listing-submission-content";
import { decideListing } from "@/lib/actions/listing-review";
import { Button } from "@/components/ui/button";

export default async function ReviewListing({params}: {params: {id: string}}) {
  await requireAdminSession("businesses.manage");
  const submission = await db.listingSubmission.findUnique({where: {id: params.id}, include: {listing: {include: {business: true}}}});
  if (!submission) notFound();
  const pending = ["SUBMITTED", "UNDER_REVIEW"].includes(submission.status);
  return <div className="mx-auto max-w-4xl space-y-6 pb-16"><Link href="/admin/listings" className="underline">Back to listing queue</Link><h1 className="text-2xl font-bold">Review listing submission</h1><p>{submission.listing.title} · {submission.status.replaceAll("_", " ")}</p><Link href={`/admin/businesses/${submission.listing.businessId}`} className="underline">Business: {submission.listing.business.name} ({submission.listing.business.verificationStatus})</Link><p>Submitted {submission.submittedAt.toISOString()} · submitter {submission.submittedBy}</p><p>Review the saved submission below, including all cover, gallery and room images. Approval publishes this exact content. Missing or inappropriate images require changes; upload alone is not approval.</p><section className="rounded border p-4"><ListingSubmissionContent value={submission.snapshot}/></section>
  {submission.notes && <section className="rounded border p-4"><h2 className="font-bold">Reviewer feedback</h2><p className="whitespace-pre-wrap">{submission.notes}</p><p className="text-sm">Reviewer: {submission.reviewedBy || "Business"} · {submission.reviewedAt?.toISOString()}</p></section>}
  {pending && <form action={decideListing} className="space-y-4 rounded border p-4"><input type="hidden" name="submissionId" value={submission.id}/><h2 className="text-xl font-bold">Review decision</h2><fieldset className="space-y-3"><legend className="mb-2">Approval checklist (all required to approve)</legend>{Object.entries({photos: "I inspected every cover, gallery and room photo for relevance and appropriateness.", accuracy: "Description, location and category details are complete and consistent.", pricing: "Prices, units, room/capacity and booking information are clear.", policies: "Cancellation terms and applicable business evidence have been reviewed."}).map(([key, text]) => <label key={key} className="flex items-start gap-3"><input type="checkbox" name={key} className="mt-1"/>{text}</label>)}</fieldset><label className="block font-semibold" htmlFor="review-notes">Reasons / changes required (visible to the business)</label><textarea id="review-notes" name="notes" required maxLength={5000} rows={4} className="w-full rounded border p-3"/><div className="flex flex-wrap gap-3"><Button name="decision" value="UNDER_REVIEW" variant="outline">Start review</Button><Button name="decision" value="NEEDS_CHANGES" variant="outline">Request changes</Button><Button name="decision" value="REJECTED" variant="destructive">Reject</Button><Button name="decision" value="APPROVED">Approve and publish</Button></div></form>}
  </div>;
}
