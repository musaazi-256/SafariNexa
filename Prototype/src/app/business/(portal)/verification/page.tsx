import { isDemoMode } from "@/lib/dev-mode";
import { VerificationStatusBadge } from "@/components/ui/status-badge";
import { toVerificationStatus } from "@/lib/status";
import { Upload, HelpCircle, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { submitVerificationDocument } from "@/lib/actions/verification";
import { VerificationTimeline, VerificationStatus } from "@/components/business/verification-timeline";
import { VerificationDocuments } from "@/components/business/verification-documents";
import { PageHero } from "@/components/page-hero";

export default async function BusinessVerificationPage() {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 pb-20 pt-8">
        <EmptyState title="No business linked to this account" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const latestVerification = await db.businessVerification.findFirst({
    where: { businessId },
    include: { documents: true },
    orderBy: { submittedAt: "desc" }
  });

  const documents = latestVerification?.documents || [];

  const statusCopy: Record<string, string> = {
    NOT_STARTED: "You haven't submitted your business for verification yet.",
    DRAFT: "Your verification submission is saved as a draft.",
    SUBMITTED: "Your documents have been submitted and are awaiting review. We'll notify you once there's an update.",
    UNDER_REVIEW: "Your documents are under review. We'll notify you once there's an update.",
    NEEDS_CHANGES: "We need more information before we can approve your business. See the notes below and resubmit.",
    APPROVED: "Your business is verified. You can submit individual listings and photos for admin approval before publication.",
    REJECTED: "Your verification was not approved. See the notes below.",
    SUSPENDED: "Your business's verification has been flagged and is on hold. See the notes below."
  };
  const bannerMessage = statusCopy[business.verificationStatus] ?? "Your verification status is unavailable. Contact support for help."
  const reviewNotes = latestVerification?.reviewNotes?.trim();
  const showNotes = Boolean(reviewNotes);

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 pt-8">
      <PageHero
        variant="portal"
        eyebrow="Business portal"
        title="Business verification"
        description="Submit documents and track approval before publishing or receiving bookings."
      />

      {/* Verification Status Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-center">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Verification status</h3>
              <div className="mt-3"><VerificationStatusBadge status={toVerificationStatus(business.verificationStatus)} /></div>
              <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                {bannerMessage}
              </p>
              {showNotes ? (
                <p className="text-sm text-slate-700 mt-3 leading-relaxed rounded-lg bg-slate-50 border border-border p-3">
                  <span className="font-semibold">Reviewer notes: </span>
                  {reviewNotes}
                </p>
              ) : null}
            </div>
            
            <div className="lg:border-l lg:border-slate-100 lg:pl-10 w-full overflow-x-auto pb-4 lg:pb-0">
               <VerificationTimeline 
                 status={business.verificationStatus as VerificationStatus} 
                 submittedAt={latestVerification?.submittedAt} 
               />
            </div>
          </div>
        </div>
      </div>

      <VerificationDocuments documents={documents} demo={isDemoMode()} />

      {/* Uploads use the same private storage as the document cards above. */}
      <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-border">
        <h3 className="text-lg font-semibold text-slate-900">Add a document</h3>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">Registration documents, licenses, tax IDs, and other evidence. Submitting moves your business back into review.</p>
        
        <form action={async (fd) => { "use server"; await submitVerificationDocument(fd); }} className="mt-6 flex flex-col sm:flex-row gap-4 items-end">
           <div className="flex-1 w-full space-y-2">
             <Label htmlFor="verification-type" className="text-xs font-medium text-slate-700 uppercase tracking-wider">Document type</Label>
             <select id="verification-type" name="type" required className="form-control flex w-full ring-offset-white">
               <option value="">Select document type</option>
               <option value="INCORPORATION">Incorporation</option>
               <option value="LICENSES">Licenses & permits</option>
               <option value="TAX">Tax documents</option>
               <option value="IDENTITY">Identity documents</option>
               <option value="OTHER">Other</option>
             </select>
           </div>
           
           <div className="flex-[2] w-full space-y-2 relative">
             <Label htmlFor="verification-file" className="text-xs font-medium text-slate-700 uppercase tracking-wider">File (PDF, JPEG or PNG, up to 5 MB)</Label>
             <div className="relative">
               <Input id="verification-file" name="file" type="file" accept="application/pdf,image/jpeg,image/png" required className="h-11 rounded-xl border-input" />
             </div>
           </div>

           <Button type="submit" className="h-11 shrink-0 px-6 font-medium">
             <Upload className="mr-2 h-4 w-4" /> Submit for review
           </Button>
        </form>
      </div>

      {/* Need help footer */}
      <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 bg-white shadow-sm">
              <HelpCircle className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Need help?</h4>
              <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">If you&apos;re not sure what to upload, contact our support team.</p>
            </div>
         </div>
<Button asChild variant="outline"><Link href="/support">Contact support</Link></Button>
      </div>
    </div>
  );
}
import Link from "next/link";
