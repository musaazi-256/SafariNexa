import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import type { ReviewStatus as PrismaReviewStatus } from "@prisma/client";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ReviewStatusBadge } from "@/components/ui/status-badge";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { toReviewStatus } from "@/lib/status";

const TABS: Array<{ value: PrismaReviewStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PUBLISHED", label: "Published" },
  { value: "FLAGGED", label: "Flagged" },
  { value: "HIDDEN", label: "Hidden" },
  { value: "PENDING", label: "Pending" }
];

export default async function AdminReviewsPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/admin/login");

  const activeStatus = (searchParams.status?.toUpperCase() as PrismaReviewStatus | undefined) ?? undefined;
  const page = parsePage(searchParams.page);
  const where = activeStatus ? { status: activeStatus } : undefined;

  const [reviews, totalCount] = await Promise.all([
    db.review.findMany({
      where,
      include: { listing: true, business: true, author: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.review.count({ where })
  ]);

  async function setReviewStatus(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user?.isAdmin) redirect("/admin/login");

    const reviewId = String(formData.get("reviewId"));
    const status = String(formData.get("status")) as PrismaReviewStatus;

    await db.review.update({ where: { id: reviewId }, data: { status } });
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e613c] mb-1">ADMIN PORTAL</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Reviews moderation</h1>
        <p className="text-[13px] text-slate-500 font-semibold max-w-2xl">Moderate flagged reviews and business replies.</p>
      </div>

      {/* Pill Filters */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.value === "ALL" ? !activeStatus : activeStatus === tab.value;
          const href = tab.value === "ALL" ? "/admin/reviews" : `/admin/reviews?status=${tab.value.toLowerCase()}`;
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

      {/* Reviews List Container */}
      {reviews.length === 0 ? (
        <EmptyState title="No reviews here" description="Nothing matches this filter right now." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col p-6">
              
              {/* Header: Title and Rating/Status */}
              <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <h3 className="font-bold text-[16px] text-slate-900">Latest reviews</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-[#1e613c] text-[#1e613c]" />
                    <span className="font-bold text-[14px] text-slate-900">{review.rating}</span>
                  </div>
                  <ReviewStatusBadge status={toReviewStatus(review.status)} />
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-4 gap-y-4 mb-6">
                
                <span className="text-[12px] font-bold text-slate-500">Reviewer</span>
                <span className="text-[13px] font-semibold text-slate-900">{review.author.name ?? review.author.email}</span>
                
                <span className="text-[12px] font-bold text-slate-500">Date</span>
                <span className="text-[13px] font-semibold text-slate-900">{review.createdAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                
                <span className="text-[12px] font-bold text-slate-500">Listing</span>
                <span className="text-[13px] font-semibold text-slate-900">{review.listing.title}</span>
                
                <span className="text-[12px] font-bold text-slate-500">Review</span>
                <span className="text-[13px] font-semibold text-slate-900 italic">&ldquo;{review.body}&rdquo;</span>
                
                {review.businessReplyBody && (
                  <>
                    <span className="text-[12px] font-bold text-slate-500 mt-2">Business response</span>
                    <span className="text-[13px] font-semibold text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {review.businessReplyBody}
                    </span>
                  </>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-auto flex justify-end gap-2 pt-4 border-t border-slate-100">
                {(["PUBLISHED", "FLAGGED", "HIDDEN"] as const)
                  .filter((status) => status !== review.status)
                  .map((status) => {
                    let label = "Publish review";
                    let styleClass = "border-slate-200 text-[#1e613c] hover:bg-[#E4F2E8]";
                    if (status === "FLAGGED") {
                      label = "Flag review";
                      styleClass = "border-slate-200 text-orange-600 hover:bg-orange-50";
                    }
                    if (status === "HIDDEN") {
                      label = "Hide review";
                      styleClass = "border-slate-200 text-slate-700 hover:bg-slate-50";
                    }

                    return (
                      <form key={status} action={setReviewStatus}>
                        <input type="hidden" name="reviewId" value={review.id} />
                        <input type="hidden" name="status" value={status} />
                        <Button type="submit" variant="outline" className={`h-8 px-4 text-[12px] font-bold shadow-none rounded-full ${styleClass}`}>
                          {label}
                        </Button>
                      </form>
                    )
                  })}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <Pagination
          currentPage={page}
          totalPages={totalPagesFor(totalCount)}
          buildHref={(p) => `/admin/reviews?${new URLSearchParams({ ...(activeStatus ? { status: activeStatus.toLowerCase() } : {}), page: String(p) }).toString()}`}
        />
      </div>

    </div>
  );
}
