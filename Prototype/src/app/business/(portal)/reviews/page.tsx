import Link from "next/link";
import { redirect } from "next/navigation";
import { Star, MessageSquare, Clock, Flag, Users, Search, Filter, Info, MoreVertical, CheckCircle2 } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default async function BusinessReviewsPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="space-y-6">
        <EmptyState title="No business linked" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const activeTab = searchParams.status?.toUpperCase() || "ALL";
  const page = parsePage(searchParams.page);
  
  const where = { 
    businessId, 
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
      orderBy: { createdAt: "desc" },
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
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B4928] mb-1">BUSINESS PORTAL</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Reviews</h1>
          <p className="text-sm text-slate-500">View verified customer reviews and reply where allowed.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
          <Button variant="outline" className="border-slate-200 text-slate-700 font-semibold h-10">
            <Filter className="h-4 w-4 mr-2" /> Filters
          </Button>
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search reviews..." className="pl-9 h-10 bg-white border-slate-200" />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex flex-col items-center justify-center shrink-0">
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-extrabold text-slate-900">{averageRating}</p>
                <p className="text-xs font-semibold text-slate-500 truncate mt-1">Average rating</p>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-slate-500">
              From {totalCount} reviews
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex flex-col items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-extrabold text-slate-900">{publishedCount}</p>
                <p className="text-xs font-semibold text-slate-500 truncate mt-1">Published</p>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-slate-500">
              Reviews visible to customers
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex flex-col items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-extrabold text-slate-900">{pendingCount}</p>
                <p className="text-xs font-semibold text-slate-500 truncate mt-1">Pending</p>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-slate-500">
              Awaiting your response
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex flex-col items-center justify-center shrink-0">
                <Flag className="h-5 w-5 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-extrabold text-slate-900">{flaggedCount}</p>
                <p className="text-xs font-semibold text-slate-500 truncate mt-1">Flagged</p>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-slate-500">
              Reported reviews
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex flex-col items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-3xl font-extrabold text-slate-900">{totalCount > 999 ? (totalCount/1000).toFixed(1) + 'K' : totalCount}</p>
                <p className="text-xs font-semibold text-slate-500 truncate mt-1">Total reviews</p>
              </div>
            </div>
            <div className="mt-4 text-xs font-semibold text-slate-500">
              All time
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Sorting */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4 mt-8">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const isActive = tab.value === activeTab;
            const href = tab.value === "ALL" ? "/business/reviews" : `/business/reviews?status=${tab.value.toLowerCase()}`;
            return (
              <Link
                key={tab.value}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  isActive 
                    ? "bg-[#0B4928] text-white border-transparent" 
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {tab.label}
                <span className={cn(
                  "flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>
        
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          Sort by: 
          <select className="bg-transparent border-none outline-none font-bold text-slate-900 cursor-pointer pl-1">
            <option>Newest</option>
            <option>Highest rating</option>
            <option>Lowest rating</option>
          </select>
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
            let statusStyle = "bg-slate-100 text-slate-700";
            if (review.status === "PUBLISHED") statusStyle = "bg-green-50 text-[#0B4928] border-green-100";
            if (review.status === "PENDING") statusStyle = "bg-orange-50 text-orange-600 border-orange-100";
            if (review.status === "FLAGGED") statusStyle = "bg-red-50 text-red-600 border-red-100";
            if (review.status === "HIDDEN") statusStyle = "bg-slate-100 text-slate-600 border-slate-200";

            return (
              <div key={review.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 hover:border-slate-300 transition-colors">
                
                {/* Left Column: Customer */}
                <div className="w-full md:w-48 shrink-0 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0B4928]/10 text-[#0B4928] font-bold flex items-center justify-center shrink-0">
                    {initials}
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="font-bold text-slate-900">{customerName}</span>
                    <div className="flex items-center gap-1 text-[#0B4928] text-xs font-bold mt-0.5">
                      Verified guest <CheckCircle2 className="h-3 w-3 fill-[#0B4928] text-white" />
                    </div>
                  </div>
                </div>

                {/* Middle Column: Review Content & Reply */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    {renderStars(review.rating)}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span>·</span>
                      <span className="text-slate-700">{review.rating}/5</span>
                      <span>·</span>
                      <span>{new Date(review.createdAt).toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  
                  {review.title && <h4 className="font-bold text-slate-900 mb-1">{review.title}</h4>}
                  <p className="text-slate-700 text-sm leading-relaxed mb-6">
                    {review.body}
                  </p>

                  {review.businessReplyBody ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-slate-900 text-sm">Your reply</span>
                        <span className="text-xs font-medium text-slate-400">·</span>
                        <span className="text-xs font-medium text-slate-400">
                          {review.businessRepliedAt ? new Date(review.businessRepliedAt).toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' }) : ""}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{review.businessReplyBody}</p>
                    </div>
                  ) : (
                    <form action={replyToReview} className="flex flex-col gap-2 relative">
                      <input type="hidden" name="reviewId" value={review.id} />
                      <Textarea 
                        name="businessReplyBody" 
                        required 
                        placeholder={`Write a public reply to ${customerName.split(' ')[0]} (optional)...`}
                        className="resize-none min-h-[60px] pb-8 bg-white border-slate-200 text-sm"
                      />
                      <div className="absolute bottom-2 left-3 flex items-center gap-1 text-xs text-slate-400 font-medium">
                        Only visible to the customer <Info className="h-3 w-3" />
                      </div>
                      <div className="absolute bottom-2 right-2 flex items-center gap-2 hidden group-focus-within:flex">
                        <Button type="submit" size="sm" className="h-6 text-[10px] bg-[#0B4928] hover:bg-[#0B4928]/90">
                          Post reply
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Right Column: Meta & Actions */}
                <div className="w-full md:w-48 shrink-0 flex md:flex-col items-center md:items-end justify-between md:justify-start gap-4">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={cn("px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase", statusStyle)}>
                      {review.status}
                    </div>
                    {review.booking && (
                      <div className="text-xs font-medium text-slate-500">
                        Order: {review.booking.bookingRef}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 md:mt-4">
                    <Button variant="outline" size="sm" className="h-8 font-semibold text-[#0B4928] border-slate-200">
                      Reply
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8 text-slate-400 border-slate-200">
                          <MoreVertical className="h-4 w-4 text-slate-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 font-medium text-sm">
                        <DropdownMenuItem className="text-slate-600 cursor-pointer">Flag as inappropriate</DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-600 cursor-pointer">Contact customer</DropdownMenuItem>
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
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-500">
            Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalFilteredCount)} of {totalCount} reviews
          </p>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">10 per page</span>
              <div className="border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-400">v</div>
            </div>
            
            <div className="flex items-center gap-1">
              <Link 
                href={`/business/reviews?${new URLSearchParams({ ...(activeTab !== "ALL" ? { status: activeTab.toLowerCase() } : {}), page: String(Math.max(1, page - 1)) }).toString()}`}
                className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"
              >
                &lt;
              </Link>
              <span className="h-8 w-8 flex items-center justify-center rounded-full bg-[#0B4928] text-white font-bold text-sm shadow-sm">
                {page}
              </span>
              {page < totalPages && (
                <Link 
                  href={`/business/reviews?${new URLSearchParams({ ...(activeTab !== "ALL" ? { status: activeTab.toLowerCase() } : {}), page: String(page + 1) }).toString()}`}
                  className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                >
                  {page + 1}
                </Link>
              )}
              {totalPages > 3 && (
                <>
                  <span className="text-slate-400 mx-1">...</span>
                  <Link 
                    href={`/business/reviews?${new URLSearchParams({ ...(activeTab !== "ALL" ? { status: activeTab.toLowerCase() } : {}), page: String(totalPages) }).toString()}`}
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                  >
                    {totalPages}
                  </Link>
                </>
              )}
              <Link 
                href={`/business/reviews?${new URLSearchParams({ ...(activeTab !== "ALL" ? { status: activeTab.toLowerCase() } : {}), page: String(Math.min(totalPages, page + 1)) }).toString()}`}
                className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"
              >
                &gt;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
