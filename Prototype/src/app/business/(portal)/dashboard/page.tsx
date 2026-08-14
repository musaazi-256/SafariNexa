import Link from "next/link";
import { Star, Clock, Database, Plus, Ticket, Calendar as CalendarIcon, MessageSquare, Download, AlertCircle, ArrowRight, ExternalLink, Info, User } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { ratingSummary } from "@/lib/listings";
import { summarizePayments } from "@/lib/revenue";
import { DashboardCharts } from "@/components/business/dashboard-charts";
import { EmptyState } from "@/components/ui/empty-state";

export default async function BusinessDashboardPage() {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="space-y-6">
        <EmptyState title="No business linked" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [publishedCount, draftCount, awaitingCount, monthPayments, publishedReviews, recentBookings, recentReviews] = await Promise.all([
    db.listing.count({ where: { businessId, status: "PUBLISHED" } }),
    db.listing.count({ where: { businessId, status: "DRAFT" } }),
    db.booking.count({ where: { businessId, status: "AWAITING_BUSINESS_CONFIRMATION" } }),
    db.payment.findMany({
      where: { booking: { businessId }, completedAt: { gte: startOfMonth } },
      select: { status: true, amountMinor: true }
    }),
    db.review.findMany({ where: { businessId, status: "PUBLISHED" }, select: { rating: true } }),
    db.booking.findMany({
      where: { businessId, status: "AWAITING_BUSINESS_CONFIRMATION" },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    db.review.findMany({
      where: { businessId },
      include: { listing: true, author: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 3
    })
  ]);

  const { grossMinor } = summarizePayments(monthPayments);
  const { average, count } = ratingSummary(publishedReviews);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white min-h-[180px] flex items-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1551122003-889f078d4dd4?auto=format&fit=crop&q=80&w=2000" 
            alt="Elephants" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>
        
        <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#FFCE06] mb-2">Welcome back, Grace</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">{business.name}</h1>
            <p className="text-slate-200">Here's what's happening with your business today.</p>
          </div>
          <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black mt-2 sm:mt-0 shrink-0">
            View business profile <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {business.verificationStatus !== "APPROVED" && (
        <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-warning-foreground flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            <h5 className="leading-none tracking-tight">Application Status: {business.verificationStatus.replace("_", " ")} - You cannot publish listings yet.</h5>
          </div>
          <Link href="/business/verification" className="flex items-center gap-1 font-semibold text-primary hover:underline text-sm">
            Check Status <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Published Listings */}
        <Card className="bg-[#0B4928] text-white border-none shadow-sm rounded-2xl relative overflow-hidden">
          <CardContent className="pt-6 pb-6 relative z-10 h-full flex flex-col justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">Published listings</p>
            <div className="mt-2">
              <p className="text-4xl font-extrabold">{publishedCount}</p>
              <p className="text-sm text-white/80 mt-1">{draftCount} draft</p>
            </div>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-white" />
          </div>
        </Card>

        {/* Awaiting Confirmation */}
        <Card className="rounded-2xl shadow-sm border-slate-100 flex flex-col justify-between">
          <CardContent className="pt-6 pb-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Awaiting confirmation</p>
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-500" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{awaitingCount}</p>
            <p className="text-sm text-slate-500 mt-1">Bookings needing a reply</p>
            <div className="mt-auto pt-4">
              <Link href="/business/bookings" className="text-sm font-semibold text-primary flex items-center hover:underline">
                View bookings <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="rounded-2xl shadow-sm border-slate-100 flex flex-col justify-between">
          <CardContent className="pt-6 pb-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">This month's revenue</p>
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <Database className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{formatUGX(grossMinor)}</p>
            <p className="text-sm text-slate-500 mt-1">Gross, before commission</p>
            <div className="mt-auto pt-4 flex items-center gap-2">
              <span className="flex items-center text-xs font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                ↑ 18.6%
              </span>
              <span className="text-xs text-slate-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card className="rounded-2xl shadow-sm border-slate-100 flex flex-col justify-between">
          <CardContent className="pt-6 pb-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Average rating</p>
              <Star className="h-8 w-8 fill-amber-100 text-amber-100 opacity-50" />
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
              <p className="text-3xl font-extrabold text-slate-900">{average ? average.toFixed(1) : "—"}</p>
            </div>
            <p className="text-sm text-slate-500 mt-1">{count} published review{count === 1 ? "" : "s"}</p>
            <div className="mt-auto pt-4">
              <Link href="/business/reviews" className="text-sm font-semibold text-primary flex items-center hover:underline">
                View reviews <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-2xl shadow-sm border-slate-100">
        <CardContent className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 overflow-x-auto custom-scrollbar whitespace-nowrap">
            <span className="text-sm font-bold text-slate-900 shrink-0 px-2 sm:px-4">Quick actions</span>
            <div className="w-px h-6 bg-slate-200 hidden sm:block shrink-0" />
            <Button variant="ghost" className="text-slate-700 font-medium shrink-0">
              <Plus className="mr-2 h-4 w-4 text-[#0B4928]" /> Add new listing
            </Button>
            <Button variant="ghost" className="text-slate-700 font-medium shrink-0">
              <Ticket className="mr-2 h-4 w-4 text-orange-500" /> Create promotion
            </Button>
            <Button variant="ghost" className="text-slate-700 font-medium shrink-0">
              <CalendarIcon className="mr-2 h-4 w-4 text-green-600" /> View calendar
            </Button>
            <Button variant="ghost" className="text-slate-700 font-medium shrink-0">
              <Star className="mr-2 h-4 w-4 text-amber-400" /> Respond to reviews
            </Button>
            <Button variant="ghost" className="text-slate-700 font-medium shrink-0 ml-auto hidden md:flex">
              <Download className="mr-2 h-4 w-4 text-[#0B4928]" /> Download report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts (Client Component) */}
      <DashboardCharts />

      {/* Bottom Lists */}
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        {/* Needs Attention */}
        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Needs your attention</h2>
                {awaitingCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {awaitingCount}
                  </span>
                )}
              </div>
              <Link href="/business/bookings" className="text-sm font-semibold text-[#0B4928] hover:underline">
                View all &rarr;
              </Link>
            </div>
            
            {recentBookings.length === 0 ? (
              <EmptyState title="Nothing awaiting confirmation" description="New booking requests will show up here." />
            ) : (
              <div className="flex flex-col gap-4">
                {recentBookings.map((booking) => (
                  <Link key={booking.id} href={`/business/bookings/${booking.id}`}>
                    <div className="flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                          {booking.listing.coverImageUrl ? (
                            <img src={booking.listing.coverImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-slate-200" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{booking.listing.title}</p>
                          <p className="text-xs text-slate-500">{booking.bookingRef} • Today, 10:30 AM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-2 py-1 rounded-md">
                          Awaiting confirmation
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Info className="h-4 w-4" /> Reply to these bookings to avoid auto-cancellation.
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Recent reviews</h2>
              <Link href="/business/reviews" className="text-sm font-semibold text-[#0B4928] hover:underline">
                View all &rarr;
              </Link>
            </div>

            {recentReviews.length === 0 ? (
              <EmptyState title="No reviews yet" description="Reviews from completed bookings will show up here." />
            ) : (
              <div className="flex flex-col gap-6">
                {recentReviews.map((review) => (
                  <div key={review.id} className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 shrink-0 overflow-hidden">
                      {review.author.image ? (
                        <img src={review.author.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-slate-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{review.listing.title}</p>
                        <span className="flex items-center gap-1 text-sm font-bold text-slate-900">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {review.rating}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{review.author.name ?? "Verified guest"} • 2 days ago</p>
                      <p className="text-sm text-slate-700 mt-2 line-clamp-1 italic">"{review.content}"</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-[#0B4928]">
              <MessageSquare className="h-4 w-4" /> Respond to reviews <span className="font-normal text-slate-500">to build trust with travelers.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
