import { PortalToolbar } from "@/components/portal-toolbar";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { redirect } from "next/navigation";
import type { ReviewStatus as PrismaReviewStatus } from "@prisma/client";

import { auth } from "@/auth";
import { requireAdminSession } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/page-pagination";
import { RecordFilter } from "@/components/record-filter";
import { PageHero } from "@/components/page-hero";
import { ReviewStatusBadge } from "@/components/ui/status-badge";
import { StarRating } from "@/components/ui/star-rating";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { toReviewStatus } from "@/lib/status";
import { logAuditEvent } from "@/lib/audit";

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

  const requestedStatus = searchParams.status?.toUpperCase();
  const activeStatus = requestedStatus && ["PUBLISHED","FLAGGED","HIDDEN","PENDING"].includes(requestedStatus) ? requestedStatus as PrismaReviewStatus : undefined;
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
    const activeSession = await requireAdminSession("reviews.moderate");
    if (!activeSession?.user?.isAdmin) redirect("/admin/login");

    if (!["PENDING","PUBLISHED","HIDDEN","FLAGGED"].includes(String(formData.get("status")))) throw new Error("Invalid review state");
    const reviewId = String(formData.get("reviewId"));
    const status = String(formData.get("status")) as PrismaReviewStatus;

    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: { listing: { select: { title: true } } }
    });

    if (!review) return;

    await db.$transaction(async (tx) => {
      await tx.review.update({ where: { id: reviewId }, data: { status } });
      
      // Notify customer
      await tx.notification.create({
        data: {
          userId: review.authorUserId,
          type: "SYSTEM",
          title: "Review Moderated",
          body: `Your review for ${review.listing.title} has been marked as ${status.toLowerCase()}.`
        }
      });
      
      // Notify business owners
      const businessUsers = await tx.businessUser.findMany({
        where: { businessId: review.businessId, role: "OWNER" }
      });
      
      for (const bu of businessUsers) {
        await tx.notification.create({
          data: {
            userId: bu.userId,
            type: "SYSTEM",
            title: "Review Moderated",
            body: `A review for ${review.listing.title} has been marked as ${status.toLowerCase()}.`
          }
        });
      }
    });

    await logAuditEvent({
      actorUserId: activeSession.user.id,
      actorEmail: activeSession.user.email ?? undefined,
      surface: "ADMIN",
      action: "admin_moderate_review",
      outcome: "SUCCESS",
      metadata: { reviewId, status }
    });
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      
      <PageHero
        variant="portal"
        eyebrow="Admin portal"
        title="Reviews moderation"
        description="Moderate flagged reviews and business replies."
      />

      {/* Pill Filters */}
      <PortalToolbar filters={<RecordFilter label="Moderation status" name="status" defaultValue="ALL"
        value={activeStatus ?? "ALL"}
        options={TABS.map((tab) => ({
          value: tab.value,
          label: tab.label,
        }))}
      />} />

      {/* Reviews: one compact row per review */}
      {reviews.length === 0 ? (
        <EmptyState title="No reviews here" description="Nothing matches this filter right now." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {reviews.map((review) => {
              const reviewer = review.author.name ?? review.author.email;
              const actions = (["PUBLISHED", "FLAGGED", "HIDDEN"] as const).filter((status) => status !== review.status);
              return (
                <li key={review.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-6">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <StarRating rating={review.rating} size="sm" />
                      <ReviewStatusBadge status={toReviewStatus(review.status)} />
                      <span className="min-w-0 truncate text-sm font-semibold text-slate-900" title={review.listing.title}>{review.listing.title}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {reviewer} · {review.business.name} · {review.createdAt.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="line-clamp-2 text-sm leading-relaxed text-slate-700" title={review.body}>&ldquo;{review.body}&rdquo;</p>
                    {review.businessReplyBody ? (
                      <p className="line-clamp-1 border-l-2 border-slate-200 pl-3 text-xs text-slate-500" title={review.businessReplyBody}>
                        <span className="font-medium text-slate-600">Business reply:</span> {review.businessReplyBody}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {actions.map((status) => {
                      const label = status === "PUBLISHED" ? "Publish" : status === "FLAGGED" ? "Flag" : "Hide";
                      const tone = status === "PUBLISHED" ? "text-primary hover:bg-primary/10" : status === "FLAGGED" ? "text-orange-600 hover:bg-orange-50" : "text-slate-700 hover:bg-slate-50";
                      const button = (type: "submit" | "button") => (
                        <Button type={type} variant="outline" size="sm" aria-label={`${label} review by ${reviewer}`} className={`h-8 rounded-full px-3 text-xs font-medium shadow-none ${tone}`}>
                          {label}
                        </Button>
                      );
                      return (
                        <form key={status} action={setReviewStatus}>
                          <input type="hidden" name="reviewId" value={review.id} />
                          <input type="hidden" name="status" value={status} />
                          {status === "HIDDEN" ? (
                            <ConfirmSubmit
                              title="Hide this review?"
                              description="The review will no longer appear on the listing or count towards its rating. You can publish it again later."
                              confirmLabel="Hide review"
                              trigger={button("button")}
                            />
                          ) : (
                            button("submit")
                          )}
                        </form>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-border bg-slate-50/40 px-5 py-3">
            <Pagination
              className="mt-0"
              currentPage={page}
              totalPages={totalPagesFor(totalCount)}
              summary={`Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount} reviews`}
              buildHref={(p) => `/admin/reviews?${new URLSearchParams({ ...(activeStatus ? { status: activeStatus.toLowerCase() } : {}), page: String(p) }).toString()}`}
            />
          </div>
        </div>
      )}

    </div>
  );
}
