import { PortalToolbar } from "@/components/portal-toolbar";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PageHero } from "@/components/page-hero";
import { RecordFilter } from "@/components/record-filter";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/remote-image";
import { ListingSubmissionStatusBadge, VerificationStatusBadge } from "@/components/ui/status-badge";
import { toVerificationStatus } from "@/lib/status";

export default async function ListingQueue({searchParams}: {searchParams: {status?: string}}) {
  await requireAdminSession("businesses.manage");
  const statuses = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "NEEDS_CHANGES", "REJECTED", "WITHDRAWN"];
  const status = statuses.includes(searchParams.status || "") ? searchParams.status! : "SUBMITTED";
  const submissions = await db.listingSubmission.findMany({where: {status}, include: {listing: {include: {business: true}}}, orderBy: {submittedAt: "desc"}, take: 100});
  return <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
    <PageHero variant="portal" eyebrow="Admin portal" title="Listing review queue" description="Review submitted listing details, prices and photos before publication." />
    <PortalToolbar filters={<RecordFilter label="Review stage" name="status" defaultValue="SUBMITTED" value={status} options={statuses.map(value=>({value,label:value.toLowerCase().replaceAll("_"," ").replace(/^./,s=>s.toUpperCase()),}))}/>} />
    <div className="space-y-4">{submissions.map(item=><div key={item.id} className="bg-white rounded-2xl border border-border shadow-card p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"><div className="flex min-w-0 gap-4"><div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.listing.coverImageUrl && <RemoteImage src={item.listing.coverImageUrl} alt="" width={160} height={112} className="h-full w-full object-cover" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-slate-900">{item.listing.title}</h2><ListingSubmissionStatusBadge status={item.status} />{item.listing.business.verificationStatus !== "APPROVED" && <VerificationStatusBadge status={toVerificationStatus(item.listing.business.verificationStatus)} />}</div><p className="text-xs font-medium text-slate-500 mt-0.5">{item.listing.business.name} · {item.listing.type.toLowerCase()} · Submitted on {item.submittedAt.toLocaleDateString("en-GB",{timeZone:"Africa/Kampala"})}</p></div></div><Button asChild size="sm" className="font-medium text-xs"><Link href={`/admin/listings/${item.id}`}>Review listing</Link></Button></div>
      <p className="text-sm font-medium text-slate-500 leading-relaxed">Review the submitted information and photos. Business verification is checked separately.</p>
    </div>)}</div>
    {!submissions.length && <div className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-slate-500">No submissions in this status.</div>}
    <p className="text-xs font-medium text-slate-500">Showing up to 100 most recent {status.toLowerCase().replaceAll("_", " ")} submissions.</p>
  </div>;
}
