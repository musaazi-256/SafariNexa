import { Link2, Upload, HelpCircle, MessageCircle, Hourglass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { submitVerificationDocument } from "@/lib/actions/verification";
import { VerificationTimeline, VerificationStatus } from "@/components/business/verification-timeline";
import { VerificationDocuments } from "@/components/business/verification-documents";

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

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Business verification</h1>
        <p className="text-slate-500 mt-2 text-lg">Submit documents and track approval before publishing or receiving bookings.</p>
      </div>

      {/* Verification Status Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verification status</h3>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
                <Hourglass className="h-3.5 w-3.5" /> 
                {business.verificationStatus.replace("_", " ")}
              </div>
              <p className="text-sm text-slate-500 mt-4 leading-relaxed">
                Your documents are under review. We&apos;ll notify you once there&apos;s an update.
              </p>
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

      <VerificationDocuments documents={documents} />

      {/* Bottom Add Document Form (Fallback URL method) */}
      <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">Add a document</h3>
        <p className="text-sm text-slate-500 mt-1">Registration documents, licenses, tax IDs, and other evidence. Submitting moves your business back into review.</p>
        
        <form action={async (fd) => { "use server"; await submitVerificationDocument(fd); }} className="mt-6 flex flex-col sm:flex-row gap-4 items-end">
           <div className="flex-1 w-full space-y-2">
             <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Document type</Label>
             <select name="type" className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2">
               <option value="">Select document type</option>
               <option value="INCORPORATION">Incorporation</option>
               <option value="LICENSES">Licenses & permits</option>
               <option value="TAX">Tax documents</option>
               <option value="IDENTITY">Identity documents</option>
               <option value="OTHER">Other</option>
             </select>
           </div>
           
           <div className="flex-[2] w-full space-y-2 relative">
             <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">File</Label>
             <div className="relative">
               <Input name="fileUrl" className="h-11 pl-4 pr-10 rounded-lg border-slate-200" placeholder="Paste file URL here" />
               <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
             </div>
           </div>

           <Button type="submit" className="h-11 rounded-lg bg-green-700 hover:bg-green-800 shrink-0 px-6 font-bold">
             <Upload className="mr-2 h-4 w-4" /> Submit for review
           </Button>
        </form>
      </div>

      {/* Need help footer */}
      <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 bg-white shadow-sm">
              <HelpCircle className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Need help?</h4>
              <p className="text-sm text-slate-500 mt-0.5">If you&apos;re not sure what to upload, contact our support team.</p>
            </div>
         </div>
         <Button variant="outline" className="bg-white font-bold h-10 px-6 shrink-0">
           <MessageCircle className="mr-2 h-4 w-4" /> Contact support
         </Button>
      </div>
    </div>
  );
}
