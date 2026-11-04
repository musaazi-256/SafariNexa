import { PortalToolbar } from "@/components/portal-toolbar";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { VerificationStatusBadge } from "@/components/ui/status-badge";
import { toVerificationStatus } from "@/lib/status";
import { documentLink } from "@/lib/document-link";
import { isDemoMode } from "@/lib/dev-mode";
import { Square } from "lucide-react";
import Link from "next/link";
import type { VerificationStatus as PrismaVerificationStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/page-pagination";
import { RecordFilter } from "@/components/record-filter";
import { PageHero } from "@/components/page-hero";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { updateVerificationStatus } from "@/lib/actions/admin";

const TABS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "NEEDS_CHANGES", label: "Needs changes" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" }
];

export default async function AdminVerificationPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  await requireAdminSession();

  const activeStatusParam = searchParams.status?.toLowerCase() ?? "submitted";
  const page = parsePage(searchParams.page);

  let activePrismaStatus: PrismaVerificationStatus | undefined = undefined;
  if (activeStatusParam === "submitted") activePrismaStatus = "SUBMITTED";
  if (activeStatusParam === "under_review") activePrismaStatus = "UNDER_REVIEW";
  if (activeStatusParam === "needs_changes") activePrismaStatus = "NEEDS_CHANGES";
  if (activeStatusParam === "approved" || activeStatusParam === "completed") activePrismaStatus = "APPROVED";
  if (activeStatusParam === "rejected") activePrismaStatus = "REJECTED";
  if (activeStatusParam === "suspended" || activeStatusParam === "fraud") activePrismaStatus = "SUSPENDED";

  const where = activePrismaStatus ? { status: activePrismaStatus } : undefined;

  const [verifications, totalCount] = await Promise.all([
    db.businessVerification.findMany({
      where,
      include: { business: true, documents: true },
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.businessVerification.count({ where })
  ]);

  async function setVerificationStatus(formData: FormData) {
    "use server";
    await requireAdminSession();

    const verificationId = String(formData.get("verificationId"));
    const status = String(formData.get("status")) as PrismaVerificationStatus;
    const notes = String(formData.get("notes") ?? "").trim();

    if (verificationId.startsWith("mock-")) {
      return; // Gracefully handle mock items in demo mode
    }

    await updateVerificationStatus(verificationId, status, notes || "No notes provided by reviewer.");
  }



  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <PageHero
          variant="portal"
          eyebrow="Admin portal"
          title="Verification queue"
          description="Review submitted profiles, certificate of operations, and business documents."
        />
<Link href="/admin/listings" className="text-sm underline">Review listing submissions and photos →</Link>
      </div>

      {/* Filter Tabs (Pill Buttons) */}
      <PortalToolbar filters={<RecordFilter label="Verification stage" name="status" defaultValue="ALL" defaultParamValue="all"
        value={activeStatusParam === "all" ? "ALL" : activePrismaStatus ?? "ALL"}
        options={TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
        }))}
      />} />

      {/* Queue Items List */}
      <div className="space-y-4">
        {verifications.length > 0 ? (
          verifications.map((v) => {
            const category = v.business.type ? v.business.type.replace(/_/g, " ").toLowerCase() : "Business";
            const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
            const dateStr = v.submittedAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <div key={v.id} className="bg-white rounded-2xl border border-border shadow-card p-4 sm:p-6 space-y-4">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900"><Link href={`/admin/verification/${v.id}`} className="hover:underline">{v.business.name}</Link></h3>
                    <Link href={`/admin/verification/${v.id}`} className="mt-2 inline-block text-xs font-semibold text-primary underline">Review submitted profile and documents</Link>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{formattedCategory} · Submitted on {dateStr}</p>
                  </div>

                  <form action={setVerificationStatus} className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:justify-end">
                    <input type="hidden" name="verificationId" value={v.id} />
                    <textarea
                      name="notes"
                      placeholder="Reviewer notes (shown to the business)"
                      rows={3}
                      className="form-textarea min-h-20 w-full sm:w-72 resize-y"
                    />
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button type="submit" name="status" value="APPROVED" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg px-4 h-8 transition-colors">
                        Approve
                      </Button>
                      <Button type="submit" name="status" value="NEEDS_CHANGES" variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-xs rounded-lg px-4 h-8 transition-colors">
                        Request more
                      </Button>
                      <ConfirmSubmit
                        name="status"
                        value="SUSPENDED"
                        title="Place a fraud hold?"
                        description={<><strong>{v.business.name}</strong> will be suspended and its listings taken off the marketplace until the hold is lifted.</>}
                        previewField="notes"
                        previewLabel="Reviewer notes sent to the business"
                        confirmLabel="Place fraud hold"
                        trigger={
                          <Button variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-100 font-medium text-xs rounded-lg px-4 h-8 transition-colors">
                            Flag
                          </Button>
                        }
                      />
                    </div>
                  </form>
                </div>

                {/* Submitted Documents Section */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2.5">SUBMITTED DOCUMENTS</p>
                  
                  {v.documents.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {v.documents.map((doc) => {
                        const docLabel = doc.type.replace(/_/g, " ");

                        return (
                          <a href={documentLink(doc.fileUrl, doc.type, isDemoMode(), doc.id)} target="_blank" rel="noreferrer" key={doc.id} className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-slate-50/80 px-3.5 py-2 text-xs text-slate-700 font-medium">
                            <Square className="h-3.5 w-3.5 text-slate-400" />
                            <span>{docLabel}</span>
                            <VerificationStatusBadge status={toVerificationStatus(v.status)} />
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">No documents submitted.</p>
                  )}
                </div>

              </div>
            );
          })
        ) : (
<EmptyState title="No matching verification submissions" description="Try another verification status." />
        )}
      </div>

      {totalCount > 0 ? (
        <div className="flex flex-wrap gap-3 items-center justify-between px-1">
          <span className="text-xs font-medium text-slate-500">
            Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} verifications
          </span>
          <Pagination
            currentPage={page}
            totalPages={totalPagesFor(totalCount)}
            buildHref={(p) => `/admin/verification?${new URLSearchParams({ status: activeStatusParam, page: String(p) }).toString()}`}
          />
        </div>
      ) : null}

    </div>
  );
}
