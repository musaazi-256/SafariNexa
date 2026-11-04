import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { PortalSearch } from "@/components/portal-search";
import { ReviewStatusBadge } from "@/components/ui/status-badge";
import { toReviewStatus } from "@/lib/status";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Star, MessageSquare, Clock, Flag, Users, Search, Filter, Info, MoreVertical, CheckCircle2 } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHero } from "@/components/page-hero";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default async function BusinessReviewsPage({ searchParams }: { searchParams: { status?: string; page?: string; q?: string; sort?: string } }) {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="space-y-6">
        <EmptyState title="No business linked" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const requestedStatus = searchParams.status?.toUpperCase();
  const activeTab = requestedStatus && ["PENDING","PUBLISHED","HIDDEN","FLAGGED"].includes(requestedStatus) ? requestedStatus : "ALL";
  const page = parsePage(searchParams.page);
  const sort = ["highest", "lowest"].includes(searchParams.sort ?? "") ? searchParams.sort! : "newest";
  
  const where = { 
    businessId,
    ...(searchParams.q ? { OR: [{ body: { contains: searchParams.q.trim(), mode: "insensitive" as const } }, { listing: { title: { contains: searchParams.q.trim(), mode: "insensitive" as const } } }] } : {}),
    ...(activeTab !== "ALL" ? { status: activeTab as any } : {}) 
  };

  // Fetch data
  const [
    reviews, 
    totalFilteredCount, 
    statusCountsResult,
    ratingResult
  ] = await Promise.all([
    db.review.findMany({
      where: where as never,
      include: { listing: true, author: { select: { name: true, email: true } }, booking: { select: { bookingRef: true } } },
      orderBy: sort === "newest" ? [{ createdAt: "desc" }] : [{ rating: sort === "highest" ? "desc" : "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.review.count({ where: where as never }),
    db.review.groupBy({
      by: ["status"],
      _count: { status: true },
      where: { businessId }
    }),
    db.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
      where: { businessId }
    })
  ]);

  // Aggregate counts
  const statusCounts = statusCountsResult.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  const publishedCount = statusCounts["PUBLISHED"] || 0;
  const pendingCount = statusCounts["PENDING"] || 0;
  const flaggedCount = statusCounts["FLAGGED"] || 0;
  const totalCount = ratingResult._count.rating || 0;
  const averageRating = (ratingResult._avg.rating || 0).toFixed(1);

  const TABS = [
    { value: "ALL", label: "All reviews", count: totalCount },
    { value: "PENDING", label: "Pending", count: pendingCount },
    { value: "PUBLISHED", label: "Published", count: publishedCount },
    { value: "FLAGGED", label: "Flagged", count: flaggedCount }
  ];

  const totalPages = totalPagesFor(totalFilteredCount);

  async function replyToReview(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/business/auth/sign-in");

    const reviewId = String(formData.get("reviewId"));
    const businessReplyBody = String(formData.get("businessReplyBody") ?? "").trim();
    if (!businessReplyBody) throw new Error("A reply body is required.");

    const review = await db.review.findUnique({ where: { id: reviewId } });
    if (!review || !activeSession.user.businessIds.includes(review.businessId)) {
      throw new Error("Review not found.");
    }

    await db.review.update({
      where: { id: reviewId },
      data: { businessReplyBody, businessRepliedAt: new Date() }
    });
  }

  // Helper to generate stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={cn(
              "h-3.5 w-3.5", 
              star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-200 text-slate-200"
            )} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <PageHero
          variant="portal"
          eyebrow="Business portal"
          title="Reviews"
          description="View verified customer reviews and reply where allowed."
        />

        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
<PortalFilter />
          <PortalSearch label="Search reviews" placeholder="Search reviews…" />
        </div>
      </div>

      {/* Stat Cards */}
      <StatGrid columns={5}>
        <StatCard label="Average rating" value={ratingResult._avg.rating===null?undefined:averageRating} description={String(totalCount)+" reviews across all moderation states · out of 5"} icon={Star} help="Average of all reviews recorded for this business. The public listing rating includes only published reviews." />
        <StatCard label="Published reviews" value={publishedCount} description="Visible on your public listings" icon={MessageSquare} href="/business/reviews?status=published" actionLabel="View reviews" />
        <StatCard label="Pending reviews" value={pendingCount} description="Awaiting admin moderation" icon={Clock} href="/business/reviews?status=pending" actionLabel="View reviews" />
        <StatCard label="Flagged reviews" value={flaggedCount} description="Flagged for moderation" icon={Flag} href="/business/reviews?status=flagged" actionLabel="View reviews" />
        <StatCard label="Total reviews" value={totalCount.toLocaleString("en-UG")} description="All moderation states · all time" icon={Users} />
      </StatGrid>

      {/* Tabs & Sorting */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4 mt-8">
        <FilterTabs
          activeValue={activeTab}
          tabs={TABS.map((tab) => ({
            value: tab.value,
            label: tab.label,
            count: tab.count,
            href: `/business/reviews?${new URLSearchParams({ ...(tab.value !== "ALL" ? { status: tab.value.toLowerCase() } : {}), ...(searchParams.q ? { q: searchParams.q } : {}), sort })}`
          }))}
        />

        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          Sort by: 
          <ReviewSort />
        </div>
      </div>

      {/* Main Reviews List */}
      {reviews.length === 0 ? (
        <EmptyState title="No reviews found" description="You don't have any reviews in this category yet." />
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => {
            const customerName = review.author.name || review.author.email || "Verified Guest";
            const initials = customerName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
            
            // Status styling


            return (
              <div key={review.id} className="bg-white rounded-2xl border border-border p-6 flex flex-col md:flex-row gap-6 hover:border-slate-300 transition-colors">
                
                {/* Left Column: Customer */}
                <div className="w-full md:w-48 shrink-0 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="font-semibold text-slate-900">{customerName}</span>
                    <div className="flex items-center gap-1 text-primary text-xs font-medium mt-0.5">
                      {review.booking ? <>Booked guest <CheckCircle2 className="h-3 w-3" /></> : "Reviewer"}
                    </div>
                  </div>
                </div>

                {/* Middle Column: Review Content & Reply */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    {renderStars(review.rating)}
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span>·</span>
                      <span className="text-slate-700">{review.rating}/5</span>
                      <span>·</span>
                      <span>{new Date(review.createdAt).toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  
                  {review.title && <h4 className="font-semibold text-slate-900 mb-1">{review.title}</h4>}
                  <p className="text-slate-700 text-sm leading-relaxed mb-6">
                    {review.body}
                  </p>

                  {review.businessReplyBody ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-slate-900 text-sm">Your reply</span>
                        <span className="text-xs font-medium text-slate-500">·</span>
                        <span className="text-xs font-medium text-slate-500">
                          {review.businessRepliedAt ? new Date(review.businessRepliedAt).toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' }) : ""}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{review.businessReplyBody}</p>
                    </div>
                  ) : (
                    <form id={`reply-${review.id}`} action={replyToReview} className="flex flex-col gap-2 relative">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <Textarea 
                        name="businessReplyBody"
                        aria-label={`Public reply to ${customerName}`}
                        maxLength={5000}
                        required 
                        placeholder={`Write a public reply to ${customerName.split(' ')[0]}...`}
                        className="resize-none min-h-[80px] bg-white text-sm"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs leading-relaxed text-slate-500">Your reply will be public alongside this review.</p>
                        <Button type="submit" size="sm" className="h-8 rounded-lg text-xs font-medium">Post reply</Button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Right Column: Meta & Actions */}
                <div className="w-full md:w-48 shrink-0 flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4">
                  <div className="flex flex-col items-end gap-1.5">
                    <ReviewStatusBadge status={toReviewStatus(review.status)} />
                    {review.booking && (
                      <div className="text-xs font-medium text-slate-500">
                        Order: {review.booking.bookingRef}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 md:mt-4">
<Button asChild variant="outline" size="sm"><a href={`#reply-${review.id}`}>Reply</a></Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-label="Review actions" variant="outline" size="icon" className="h-8 w-8 text-slate-400 border-border">
                          <MoreVertical className="h-4 w-4 text-slate-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 font-medium text-sm">
                        <DropdownMenuItem asChild><Link href="/support">Report to support</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/business/messages">Open customer messages</Link></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
          <span className="text-sm font-medium text-slate-500">
            Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalFilteredCount)} of {totalCount} reviews
          </span>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) => `/business/reviews?${new URLSearchParams({ ...(activeTab !== "ALL" ? { status: activeTab.toLowerCase() } : {}), ...(searchParams.q ? { q: searchParams.q } : {}), sort, page: String(p) }).toString()}`}
          />
        </div>
      )}
    </div>
  );
}
import { ExportVisibleRows, PortalFilter, ReviewSort } from "@/components/portal-tools";
