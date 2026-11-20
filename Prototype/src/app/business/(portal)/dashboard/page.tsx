import { PageHeader } from "@/components/page-header";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { DashboardCharts } from "@/components/business/dashboard-charts";
import { RemoteImage } from "@/components/remote-image";
import Link from "next/link";
import { ClipboardList, Star, Clock, Database, Plus, Ticket, Calendar as CalendarIcon, MessageSquare, Download, AlertCircle, ArrowRight, ExternalLink, Info, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { OperationsTasks } from "@/components/operations-tasks";
import { ratingSummary } from "@/lib/listings";
import { summarizePayments } from "@/lib/revenue";
import { RevenueOverviewChart } from "@/components/business/revenue-charts";
import { DashboardQuickActions } from "@/components/business/dashboard-quick-actions";
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

  const [publishedCount, draftCount, awaitingCount, monthPayments, monthPayouts, publishedReviews, recentReviews] = await Promise.all([
    db.listing.count({ where: { businessId, status: "PUBLISHED" } }),
    db.listing.count({ where: { businessId, status: "DRAFT" } }),
    db.booking.count({ where: { businessId, status: "AWAITING_BUSINESS_CONFIRMATION" } }),
    db.booking.findMany({
      where: { businessId },
      select: { id:true,totalMinor:true,
        payments: { where:{completedAt:{gte:startOfMonth}}, include:{refunds:true}, orderBy:{createdAt:"desc"} },
        order: { include:{payments:{where:{completedAt:{gte:startOfMonth}},include:{refunds:true},orderBy:{createdAt:"desc"}}} }
      }
    }),
    db.payout.findMany({
      where: { businessId, createdAt: { gte: startOfMonth }, status: "COMPLETED" },
      select: { amountMinor: true }
    }),
    db.review.findMany({ where: { businessId, status: "PUBLISHED" }, select: { rating: true } }),
    db.review.findMany({
      where: { businessId, status: "PUBLISHED" },
      include: { listing: true, author: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 3
    })
  ]);

  const allocationRows = monthPayments.map(booking => {
    const candidates = booking.payments.length ? booking.payments : booking.order?.payments ?? [];
    const payment = candidates.find(p => ["SUCCESSFUL","PARTIALLY_REFUNDED","REFUNDED"].includes(p.status)) ?? candidates[0];
    const refunds = payment?.refunds.filter(r=>r.bookingId===booking.id&&r.status==="COMPLETED") ?? [];
    const refunded = refunds.reduce((sum,r)=>sum+r.amountMinor,0);
    const status = payment && ["REFUNDED","PARTIALLY_REFUNDED"].includes(payment.status) ? refunded>=booking.totalMinor?"REFUNDED":refunded?"PARTIALLY_REFUNDED":"SUCCESSFUL" : payment?.status ?? "NOT_STARTED";
    return { status,amountMinor:booking.totalMinor,refunds,payoutId:payment?.payoutId,payment };
  });
  const { grossMinor, unsettledNetMinor } = summarizePayments(allocationRows);
  const daily = new Map<string,{date:string;gross:number;net:number}>();
  for(const row of allocationRows.filter(r=>["SUCCESSFUL","REFUNDED","PARTIALLY_REFUNDED"].includes(r.status)&&r.payment)){
    const date=(row.payment!.completedAt??row.payment!.createdAt).toISOString().slice(0,10);
    const item=daily.get(date)??{date,gross:0,net:0};
    item.gross+=row.amountMinor;item.net+=Math.round((row.amountMinor-row.refunds.reduce((s,r)=>s+r.amountMinor,0))*0.88);daily.set(date,item);
  }
  const settledMinor = monthPayouts.reduce((sum, p) => sum + p.amountMinor, 0);
  const { average, count } = ratingSummary(publishedReviews);

  const recentBookings = await db.booking.findMany({where:{businessId,status:"AWAITING_BUSINESS_CONFIRMATION"},include:{listing:true},orderBy:{createdAt:"desc"},take:5});
  const chartBookings = await db.booking.findMany({where:{businessId,createdAt:{gte:startOfMonth}},select:{createdAt:true,status:true}});
  const bookingDays = new Map<string,{name:string;completed:number;upcoming:number;cancelled:number}>();
  for(const b of chartBookings){const name=b.createdAt.toISOString().slice(0,10);const row=bookingDays.get(name)??{name,completed:0,upcoming:0,cancelled:0};if(b.status.startsWith("CANCELLED"))row.cancelled++;else if(["COMPLETED","REVIEW_PENDING","REVIEWED"].includes(b.status))row.completed++;else row.upcoming++;bookingDays.set(name,row);}
  const bookingChartData=[...bookingDays.values()].sort((a,b)=>a.name.localeCompare(b.name));
  return (
    <div className="max-w-[1400px] mx-auto space-y-6">

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white min-h-[180px] flex items-center">
        {business.coverImageUrl && <div className="absolute inset-0 z-0">
          <RemoteImage
            src={business.coverImageUrl}
            alt={`${business.name} cover photo`}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>}

        <div className="relative z-10 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8">
          <PageHeader title={<>{business.name}</>} description={<>Here&apos;s what&apos;s happening with your business today.</>} eyebrow={<>Welcome back</>} tone="inverse" />
          <Button asChild variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-black mt-2 sm:mt-0 shrink-0">
            <Link href="/business/settings">View business profile <ExternalLink className="ml-2 h-4 w-4" /></Link>
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
      <StatGrid>
        <StatCard compact label="Published listings" value={publishedCount} description={String(draftCount)+" draft listings"} icon={ClipboardList} href="/business/listings" actionLabel="View listings" />
        <StatCard compact label="Awaiting confirmation" value={awaitingCount} description="Booking requests needing a response" icon={Clock} href="/business/bookings?status=awaiting_business_confirmation" actionLabel="View requests" />
        <StatCard compact label="Payouts this month" value={formatUGX(settledMinor)} description={formatUGX(unsettledNetMinor)+" unsettled across all dates"} icon={Database} help="Completed payout records created this month. The unsettled balance is calculated from all eligible payments after refunds and commission." href="/business/revenue" actionLabel="View earnings" />
        <StatCard compact label="Average rating" value={average?.toFixed(1)} description={String(count)+" published reviews · out of 5"} icon={Star} href="/business/reviews" actionLabel="View reviews" />
      </StatGrid>

      {/* Quick Actions */}
      <Card className="rounded-2xl shadow-card border-slate-100">
        <CardContent className="p-2 sm:p-4">
          <DashboardQuickActions verificationStatus={business.verificationStatus} />
        </CardContent>
      </Card>

      {/* Charts (Client Component) */}
      <DashboardCharts bookingData={bookingChartData} revenueData={[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(d=>({name:d.date,amount:d.gross}))} />

      {/* Bottom Lists */}
      <div className="grid gap-6 lg:grid-cols-2 mt-6">
        {/* Needs Attention */}
        <Card className="rounded-2xl shadow-card border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Needs your attention</h2>
                {awaitingCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {awaitingCount}
                  </span>
                )}
              </div>
              <Link href="/business/bookings" className="text-sm font-semibold text-primary hover:underline">
                View all &rarr;
              </Link>
            </div>

            <OperationsTasks businessId={businessId} compact />

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Info className="h-4 w-4" /> Reply to these bookings to avoid auto-cancellation.
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card className="rounded-2xl shadow-card border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Recent reviews</h2>
              <Link href="/business/reviews" className="text-sm font-semibold text-primary hover:underline">
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
                        <RemoteImage src={review.author.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-slate-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{review.listing.title}</p>
                        <span className="flex items-center gap-1 text-sm font-medium text-slate-900">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {review.rating}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{review.author.name ?? "Verified guest"} • {review.createdAt.toLocaleDateString("en-GB",{timeZone:"Africa/Kampala"})}</p>
                      <p className="text-sm text-slate-700 mt-2 line-clamp-1 italic leading-relaxed">&quot;{review.body}&quot;</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-primary">
              <MessageSquare className="h-4 w-4" /> Respond to reviews <span className="font-normal text-slate-500">to build trust with travelers.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
