import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, FileText, ExternalLink, ClipboardCheck, ArrowLeft } from "lucide-react";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { updateVerificationStatus } from "@/lib/actions/admin";
import { documentLink } from "@/lib/document-link";
import { isDemoMode } from "@/lib/dev-mode";
import { toVerificationStatus } from "@/lib/status";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { VerificationStatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";

export default async function VerificationDetail({ params }: { params: { id: string } }) {
  await requireAdminSession();
  const record = await db.businessVerification.findUnique({ where: { id: params.id }, include: { business: true, documents: true } });
  if (!record) notFound();
  const profile = (record.submittedProfile && typeof record.submittedProfile === "object" && !Array.isArray(record.submittedProfile) ? record.submittedProfile : record.business) as Record<string, unknown>;
  const fields = [["name", "Business name"], ["registrationNumber", "Registration number"], ["contactName", "Contact name"], ["contactRole", "Contact role"], ["contactEmail", "Contact email"], ["contactPhone", "Contact phone"], ["address", "Address"], ["city", "City"], ["country", "Country"]];
  async function decide(data: FormData) {
    "use server";
    await requireAdminSession("businesses.manage");
    const status = String(data.get("status"));
    if (!["APPROVED", "REJECTED", "NEEDS_CHANGES", "UNDER_REVIEW"].includes(status)) throw new Error("Invalid decision");
    await updateVerificationStatus(params.id, status as "APPROVED" | "REJECTED" | "NEEDS_CHANGES" | "UNDER_REVIEW", String(data.get("notes") ?? "").slice(0,5000));
  }
  return <div className="mx-auto max-w-6xl space-y-6 pb-16">
    <Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/admin/verification"><ArrowLeft />Back to verification queue</Link></Button>
    <div className="flex flex-wrap items-start justify-between gap-4"><PageHero variant="portal" eyebrow="Business verification" title={record.business.name} description="Review the business information and supporting documents before recording your decision." /><VerificationStatusBadge status={toVerificationStatus(record.status)} /></div>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Business information</CardTitle><CardDescription>{record.submittedProfile ? "Information saved with this submission." : "Current business profile. An earlier copy was not retained with this submission."}</CardDescription></CardHeader><CardContent><dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">{fields.map(([key, label]) => <div key={key} className={key === "address" ? "sm:col-span-2" : ""}><dt className="text-xs font-semibold text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{typeof profile[key] === "string" && profile[key] ? String(profile[key]) : <span className="font-normal text-muted-foreground">Not provided</span>}</dd></div>)}</dl><div className="mt-6 border-t pt-5"><h3 className="text-xs font-semibold text-muted-foreground">About the business</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">{typeof profile.description === "string" && profile.description ? profile.description : "No description provided."}</p></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Supporting documents</CardTitle><CardDescription>{record.documents.length} {record.documents.length === 1 ? "document" : "documents"} attached to this submission.</CardDescription></CardHeader><CardContent className="space-y-3">{record.documents.map(doc => <div key={doc.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/20 p-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span><div className="min-w-0"><p className="break-words text-sm font-semibold leading-relaxed">{doc.type.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-muted-foreground">Uploaded {doc.uploadedAt.toLocaleDateString("en-GB", {dateStyle:"medium"})}</p></div></div><Button asChild variant="outline" size="sm"><a href={documentLink(doc.fileUrl, doc.type, isDemoMode(), doc.id)} target="_blank" rel="noreferrer">View document<ExternalLink /></a></Button></div>)}{!record.documents.length && <EmptyState title="No documents attached" description="Ask the business to upload the supporting documents needed for verification." />}</CardContent></Card>
      </div>
      <aside className="min-w-0 space-y-6">
        <Card><CardHeader><CardTitle>Submission details</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div><p className="text-xs text-muted-foreground">Submitted</p><p className="mt-1 font-medium">{record.submittedAt.toLocaleString("en-GB", {dateStyle:"medium", timeStyle:"short", timeZone:"Africa/Kampala"})} EAT</p></div>{record.reviewedAt && <div><p className="text-xs text-muted-foreground">Last reviewed</p><p className="mt-1 font-medium">{record.reviewedAt.toLocaleDateString("en-GB", {dateStyle:"medium"})}</p></div>}<Button asChild variant="outline" size="sm"><Link href={`/admin/businesses/${record.businessId}`}>View business profile</Link></Button></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" />Review decision</CardTitle><CardDescription>Your notes are shared with the business.</CardDescription></CardHeader><CardContent><form action={decide} className="space-y-4"><div className="space-y-2"><Label htmlFor="review-notes">Reviewer notes</Label><Textarea id="review-notes" name="notes" maxLength={5000} required defaultValue={record.reviewNotes ?? ""} placeholder="Explain your decision or the changes required." /></div><div className="grid gap-2"><Button name="status" value="APPROVED">Approve business</Button><Button name="status" value="UNDER_REVIEW" variant="outline">Start review</Button><Button name="status" value="NEEDS_CHANGES" variant="outline">Request changes</Button><ConfirmSubmit name="status" value="REJECTED" title="Reject this submission?" description={<>The business <strong>{record.business.name}</strong> will be told its verification was rejected, and your notes will be shared with them.</>} previewField="notes" previewLabel="Reviewer notes sent to the business" confirmLabel="Reject submission" trigger={<Button variant="destructive">Reject submission</Button>} /></div></form></CardContent></Card>
      </aside>
    </div>
  </div>;
}
