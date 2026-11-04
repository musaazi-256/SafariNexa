import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileText, ArrowLeft, ExternalLink, FileWarning } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/dev-mode";
import { Logo } from "@/components/logo";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationStatusBadge } from "@/components/ui/status-badge";
import { toVerificationStatus } from "@/lib/status";

export default async function DocumentPage({ searchParams }: { searchParams: { type?: string; documentId?: string } }) {
  if (!isDemoMode()) notFound();
  const session = await auth();
  if (!session?.user) redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/demo/document?${new URLSearchParams(searchParams)}`)}`);
  const admin = await db.adminUser.findFirst({where:{userId:session.user.id,status:"ACTIVE"}});
  const documents = await db.businessDocument.findMany({
    where: { ...(searchParams.documentId ? {id:searchParams.documentId} : {type:searchParams.type ?? "Business registration certificate"}), ...(!admin ? {verification:{business:{users:{some:{userId:session.user.id,role:{in:["OWNER","MANAGER"]}}}}}} : {}) },
    include:{verification:{include:{business:true}}}, orderBy:{uploadedAt:"desc"}, take:50
  });
  if (!documents.length) notFound();
  if (!searchParams.documentId && documents.length > 1) return <div className="min-h-screen bg-muted/20"><header className="border-b bg-white"><div className="container flex h-[72px] items-center justify-between gap-4"><Link href={admin ? "/admin/dashboard" : "/business/dashboard"}><Logo /></Link><Button asChild variant="outline" size="sm"><Link href={admin ? "/admin/verification" : "/business/settings/verification"}><ArrowLeft />Back to verification</Link></Button></div></header><main className="container max-w-5xl py-8 sm:py-10"><PageHero variant="portal" eyebrow="Business verification" title={(searchParams.type ?? "Supporting documents").replaceAll("_", " ")} description="Select the business submission whose document you want to review." /><Card><CardHeader><CardTitle>Matching submissions</CardTitle></CardHeader><CardContent className="space-y-3">{documents.map(document => <div key={document.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span><div><p className="break-words text-sm font-semibold leading-relaxed">{document.verification.business.name}</p><p className="mt-1 text-xs text-muted-foreground">Uploaded {document.uploadedAt.toLocaleDateString("en-GB", {dateStyle:"medium"})}</p></div></div><div className="flex flex-wrap items-center gap-3"><VerificationStatusBadge status={toVerificationStatus(document.verification.status)} /><Button asChild variant="outline" size="sm"><Link href={`/demo/document?documentId=${encodeURIComponent(document.id)}`}>View document</Link></Button></div></div>)}</CardContent></Card></main></div>;
  const document = documents[0];
  const back = admin ? `/admin/verification/${document.businessVerificationId}` : "/business/settings/verification";
  const available = !document.fileUrl.startsWith("https://example.com/documents/");
  return <div className="min-h-screen bg-muted/20">
    <header className="border-b bg-white"><div className="container flex h-[72px] items-center justify-between gap-4"><Link href={admin ? "/admin/dashboard" : "/business/dashboard"}><Logo /></Link><Button asChild variant="outline" size="sm"><Link href={back}><ArrowLeft />Back to submission</Link></Button></div></header>
    <main className="container max-w-6xl py-8 sm:py-10">
      <PageHero variant="portal" eyebrow="Business verification" title={document.type.replaceAll("_", " ")} description={`Supporting document for ${document.verification.business.name}.`} />
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 overflow-hidden"><CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Document preview</CardTitle></CardHeader><CardContent className="flex min-h-[380px] flex-col items-center justify-center gap-4 bg-muted/20 p-6 text-center sm:p-10">{available ? <><FileText className="h-14 w-14 text-primary" /><h2 className="text-xl font-semibold">Your document is ready to open</h2><p className="max-w-sm text-sm text-muted-foreground leading-relaxed">Open the attached file to review its contents.</p><Button asChild><a href={document.fileUrl} target="_blank" rel="noreferrer">Open attached file<ExternalLink /></a></Button></> : <><span className="flex h-16 w-16 items-center justify-center rounded-full border bg-white"><FileWarning className="h-7 w-7 text-muted-foreground" /></span><h2 className="text-xl font-semibold">Document unavailable</h2><p className="max-w-sm text-sm leading-relaxed text-muted-foreground">The file attached to this submission is unavailable. Ask the business to upload a replacement before completing your review.</p><Button asChild variant="outline"><Link href={back}>{admin ? "Return to review" : "Manage documents"}</Link></Button></>}</CardContent></Card>
        <Card className="h-fit"><CardHeader><CardTitle>Document details</CardTitle></CardHeader><CardContent className="space-y-5 text-sm"><div><p className="text-xs font-medium text-muted-foreground">Business</p><p className="mt-1 break-words font-semibold">{document.verification.business.name}</p></div><div><p className="text-xs font-medium text-muted-foreground">Document type</p><p className="mt-1 break-words">{document.type.replaceAll("_", " ")}</p></div><div><p className="text-xs font-medium text-muted-foreground">Uploaded</p><p className="mt-1">{document.uploadedAt.toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Kampala"})} EAT</p></div><div><p className="mb-2 text-xs font-medium text-muted-foreground">Submission status</p><VerificationStatusBadge status={toVerificationStatus(document.verification.status)} /></div><p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">A document’s presence does not confirm its validity. Review the file and business information before making a decision.</p></CardContent></Card>
      </div>
    </main>
  </div>;
}
