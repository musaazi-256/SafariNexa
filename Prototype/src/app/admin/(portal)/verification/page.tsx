import Link from "next/link";
import { Paperclip } from "lucide-react";
import type { VerificationStatus as PrismaVerificationStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { VerificationStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { toVerificationStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

import { updateVerificationStatus } from "@/lib/actions/admin";

const TABS: Array<{ value: PrismaVerificationStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "NEEDS_CHANGES", label: "Needs changes" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" }
];

const DECISIONS: Array<{ status: PrismaVerificationStatus; label: string; style: string }> = [
  { status: "UNDER_REVIEW", label: "Start review", style: "text-[#1e613c] border-slate-200 hover:bg-[#E4F2E8]" },
  { status: "APPROVED", label: "Approve", style: "text-[#1e613c] border-slate-200 hover:bg-[#E4F2E8]" },
  { status: "NEEDS_CHANGES", label: "Request changes", style: "text-red-600 border-slate-200 hover:bg-red-50" },
  { status: "REJECTED", label: "Reject", style: "text-red-600 border-slate-200 hover:bg-red-50" },
  { status: "SUSPENDED", label: "Suspend", style: "text-slate-500 border-slate-200 hover:bg-slate-50" }
];

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export default async function AdminVerificationPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  await requireAdminSession();

  const activeStatus = (searchParams.status?.toUpperCase() as PrismaVerificationStatus | undefined) ?? undefined;
  const page = parsePage(searchParams.page);
  const where = activeStatus ? { status: activeStatus } : undefined;

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

    await updateVerificationStatus(verificationId, status, "Processed via admin portal");
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e613c] mb-1">ADMIN PORTAL</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Verification queue</h1>
        <p className="text-[13px] text-slate-500 font-semibold max-w-2xl">Review business submissions, evidence, and documents.</p>
      </div>

      {/* Pill Filters */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.value === "ALL" ? !activeStatus : activeStatus === tab.value;
          const href = tab.value === "ALL" ? "/admin/verification" : `/admin/verification?status=${tab.value.toLowerCase()}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[13px] font-bold transition-all",
                isActive 
                  ? "border-[#1e613c] bg-[#1e613c] text-white shadow-sm" 
                  : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* List Container */}
      {verifications.length === 0 ? (
        <EmptyState title="Nothing here" description="Nothing matches this filter right now." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col divide-y divide-slate-100">
          
          {verifications.map((verification) => (
            <div key={verification.id} className="p-6 hover:bg-slate-50/50 transition-colors">
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4F2E8] text-[13px] font-bold text-[#1e613c]">
                    {getInitials(verification.business.name)}
                  </div>
                  
                  {/* Info */}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-[15px] text-slate-900">{verification.business.name}</span>
                    <span className="text-[12px] font-semibold text-slate-500">
                      Submitted {verification.submittedAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}
                      {verification.reviewedAt ? ` · Reviewed ${verification.reviewedAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}` : ""}
                    </span>

                    {/* Review Notes */}
                    {verification.reviewNotes ? (
                      <div className="mt-2 rounded-lg bg-slate-50 p-3 border border-slate-100 text-[13px]">
                        <p className="font-bold text-slate-700">Review notes</p>
                        <p className="mt-1 font-semibold text-slate-500">{verification.reviewNotes}</p>
                      </div>
                    ) : null}

                    {/* Documents & Actions Row */}
                    <div className="flex flex-wrap items-center gap-4 mt-3">
                      
                      {/* Documents */}
                      {verification.documents.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {verification.documents.map((doc) => {
                            // Extract a cleaner name from doc.type or fileUrl if needed. For now, use doc.type.
                            const label = doc.type.replace(/_/g, " ");
                            return (
                              <a
                                key={doc.id}
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors capitalize"
                              >
                                <Paperclip className="h-3 w-3" />
                                {label}
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[12px] font-semibold text-slate-400">No documents uploaded.</span>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pl-2">
                        {DECISIONS.filter((decision) => decision.status !== verification.status).map((decision) => (
                          <form key={decision.status} action={setVerificationStatus}>
                            <input type="hidden" name="verificationId" value={verification.id} />
                            <input type="hidden" name="businessId" value={verification.businessId} />
                            <input type="hidden" name="status" value={decision.status} />
                            <Button type="submit" variant="outline" className={`h-7 px-3 text-[11px] font-bold shadow-none rounded-full ${decision.style}`}>
                              {decision.label}
                            </Button>
                          </form>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  <VerificationStatusBadge status={toVerificationStatus(verification.status)} />
                </div>
              </div>

            </div>
          ))}

          {/* Pagination Footer */}
          <div className="bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">
              Showing {verifications.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} submissions
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPagesFor(totalCount)}
              buildHref={(p) => `/admin/verification?${new URLSearchParams({ ...(activeStatus ? { status: activeStatus.toLowerCase() } : {}), page: String(p) }).toString()}`}
            />
          </div>

        </div>
      )}
    </div>
  );
}
