import Link from "next/link";
import { ListingSubmissionContent } from "@/components/listing-submission-content";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { updateVerificationStatus } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
export default async function VerificationDetail({ params }: { params: { id: string } }) {
  await requireAdminSession();
  const record = await db.businessVerification.findUnique({ where: { id: params.id }, include: { business: true, documents: true } });
  if (!record) notFound();
  async function decide(data: FormData) {
    "use server";
    await requireAdminSession();
    const status = String(data.get("status"));
    if (!["APPROVED", "REJECTED", "NEEDS_CHANGES", "UNDER_REVIEW"].includes(status)) throw new Error("Invalid decision");
    await updateVerificationStatus(params.id, status as "APPROVED" | "REJECTED" | "NEEDS_CHANGES" | "UNDER_REVIEW", String(data.get("notes") ?? "").slice(0,5000));
  }
  return <div className="mx-auto max-w-3xl space-y-6">
    <Link href="/admin/verification" className="underline">Back to verification queue</Link>
    <h1 className="text-2xl font-bold break-words">{record.business.name}</h1><p>Status: {record.status.replaceAll("_"," ")}</p>
    <details className="rounded border p-4" open><summary className="cursor-pointer font-bold">Submitted business information</summary>{!record.submittedProfile && <p>Legacy submission: no historical profile snapshot was recorded. Current business information is shown below.</p>}<ListingSubmissionContent value={record.submittedProfile || record.business}/></details>
    <ul className="space-y-2">{record.documents.map(doc => <li key={doc.id}>{doc.type}: <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="underline">Open document</a></li>)}</ul>
    {!record.documents.length && <p>No documents submitted.</p>}
    <form action={decide} className="space-y-4"><label className="block">Reviewer notes<textarea name="notes" maxLength={5000} required defaultValue={record.reviewNotes ?? ""} className="mt-2 min-h-28 w-full rounded-xl border p-3"/></label>
    <div className="flex flex-wrap gap-3">{(["UNDER_REVIEW","NEEDS_CHANGES","APPROVED","REJECTED"] as const).map(status => <Button key={status} type="submit" name="status" value={status} variant={status === "APPROVED" ? "default" : "outline"}>{status.replaceAll("_"," ")}</Button>)}</div></form>
  </div>;
}
