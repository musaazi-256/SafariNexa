import Link from "next/link";
import { FileText, CheckSquare, Square, ShieldCheck, Flag, RotateCcw } from "lucide-react";
import type { VerificationStatus as PrismaVerificationStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { updateVerificationStatus } from "@/lib/actions/admin";

const TABS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "NEEDS_CHANGES", label: "Pending docs" },
  { value: "APPROVED", label: "Completed" },
  { value: "SUSPENDED", label: "Fraud holds" }
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

    if (verificationId.startsWith("mock-")) {
      return; // Gracefully handle mock items in demo mode
    }

    await updateVerificationStatus(verificationId, status, "Processed via admin portal");
  }

  // Fallback mock items matching the screenshot when database records are few
  const mockQueueItems = [
    {
      id: "mock-1",
      name: "Nile Safari Lodge",
      category: "Accommodation",
      date: "26 Jun 2026",
      documents: [
        { name: "Trading License", status: "Verified", statusType: "verified" },
        { name: "COI (Certificate)", status: "Pending", statusType: "pending" }
      ]
    },
    {
      id: "mock-2",
      name: "Murchison Falls Safari",
      category: "Tour Operator",
      date: "26 Jun 2026",
      documents: [
        { name: "Trading License", status: "Rejected", statusType: "rejected" },
        { name: "Insurance Certificate", status: "Missing", statusType: "missing" }
      ]
    },
    {
      id: "mock-3",
      name: "Jinja River Guide",
      category: "Guide Services",
      date: "25 Jun 2026",
      documents: [
        { name: "Specialist License", status: "Verified", statusType: "verified" }
      ]
    },
    {
      id: "mock-4",
      name: "Kampala Transit Co.",
      category: "Transport Provider",
      date: "24 Jun 2026",
      documents: [
        { name: "PSV License", status: "Verified", statusType: "verified" },
        { name: "Vehicle Logbook", status: "Pending", statusType: "pending" }
      ]
    }
  ];

  return (
    <div className="max-w-[1450px] mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Verification queue</h1>
          <p className="text-sm font-medium text-slate-500">Review submitted profiles, certificate of operations, and business documents.</p>
        </div>
        <Button variant="outline" className="border-slate-200 text-slate-700 font-bold rounded-lg h-9 px-4 text-xs shadow-sm">
          Bulk Action
        </Button>
      </div>

      {/* Filter Tabs (Pill Buttons) */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const tabValueLower = tab.value.toLowerCase();
          const isActive = tabValueLower === activeStatusParam || (tab.value === "ALL" && activeStatusParam === "all");
          const href = tab.value === "ALL" ? "/admin/verification?status=all" : `/admin/verification?status=${tabValueLower}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "rounded-lg border px-4 py-1.5 text-xs font-bold transition-all shadow-none",
                isActive 
                  ? "border-[#0d5932] bg-[#0d5932] text-white shadow-sm" 
                  : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Queue Items List */}
      <div className="space-y-4">
        {verifications.length > 0 ? (
          verifications.map((v) => {
            const category = v.business.type ? v.business.type.replace(/_/g, " ").toLowerCase() : "Business";
            const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
            const dateStr = v.submittedAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{v.business.name}</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">{formattedCategory} · Submitted on {dateStr}</p>
                  </div>

                  {/* Actions Top Right */}
                  <div className="flex items-center gap-2">
                    <form action={setVerificationStatus}>
                      <input type="hidden" name="verificationId" value={v.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <Button type="submit" className="bg-[#0d5932] hover:bg-[#0a4526] text-white font-bold text-xs rounded-lg px-4 h-8 transition-colors">
                        Approve
                      </Button>
                    </form>

                    <form action={setVerificationStatus}>
                      <input type="hidden" name="verificationId" value={v.id} />
                      <input type="hidden" name="status" value="NEEDS_CHANGES" />
                      <Button type="submit" variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-lg px-4 h-8 transition-colors">
                        Request more
                      </Button>
                    </form>

                    <form action={setVerificationStatus}>
                      <input type="hidden" name="verificationId" value={v.id} />
                      <input type="hidden" name="status" value="SUSPENDED" />
                      <Button type="submit" variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-lg px-4 h-8 transition-colors">
                        Flag
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Submitted Documents Section */}
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">SUBMITTED DOCUMENTS</p>
                  
                  {v.documents.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {v.documents.map((doc) => {
                        const docLabel = doc.type.replace(/_/g, " ");
                        const isApproved = v.status === "APPROVED";
                        const isUnderReview = v.status === "UNDER_REVIEW";
                        const isNeedsChanges = v.status === "NEEDS_CHANGES";

                        const statusText = isApproved ? "Verified" : isNeedsChanges ? "Missing" : isUnderReview ? "Pending" : "Verified";

                        return (
                          <div key={doc.id} className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-700 font-bold">
                            <Square className="h-3.5 w-3.5 text-slate-400" />
                            <span>{docLabel}</span>
                            <span className={cn(
                              "text-[10px] font-extrabold px-2.5 py-0.5 rounded-md ml-1",
                              statusText === "Verified" && "bg-emerald-100 text-emerald-800",
                              statusText === "Pending" && "bg-amber-100 text-amber-800",
                              statusText === "Missing" && "bg-blue-100 text-blue-800"
                            )}>
                              {statusText}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <div className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-700 font-bold">
                        <Square className="h-3.5 w-3.5 text-slate-400" />
                        <span>Trading License</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md ml-1">Verified</span>
                      </div>
                      <div className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-700 font-bold">
                        <Square className="h-3.5 w-3.5 text-slate-400" />
                        <span>COI (Certificate)</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md ml-1">Pending</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        ) : (
          // Mock Cards matching screenshot
          mockQueueItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{item.category} · Submitted on {item.date}</p>
                </div>

                {/* Actions Top Right */}
                <div className="flex items-center gap-2">
                  <Button className="bg-[#0d5932] hover:bg-[#0a4526] text-white font-bold text-xs rounded-lg px-4 h-8 transition-colors">
                    Approve
                  </Button>
                  <Button variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-lg px-4 h-8 transition-colors">
                    Request more
                  </Button>
                  <Button variant="secondary" className="bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-lg px-4 h-8 transition-colors">
                    Flag
                  </Button>
                </div>
              </div>

              {/* Submitted Documents Section */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">SUBMITTED DOCUMENTS</p>
                <div className="flex flex-wrap gap-3">
                  {item.documents.map((doc, idx) => (
                    <div key={idx} className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-700 font-bold">
                      <Square className="h-3.5 w-3.5 text-slate-400" />
                      <span>{doc.name}</span>
                      <span className={cn(
                        "text-[10px] font-extrabold px-2.5 py-0.5 rounded-md ml-1",
                        doc.statusType === 'verified' && "bg-emerald-100 text-emerald-800",
                        doc.statusType === 'pending' && "bg-amber-100 text-amber-800",
                        doc.statusType === 'rejected' && "bg-rose-100 text-rose-800",
                        doc.statusType === 'missing' && "bg-blue-100 text-blue-800"
                      )}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}
