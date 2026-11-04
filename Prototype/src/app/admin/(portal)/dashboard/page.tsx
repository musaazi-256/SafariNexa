import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { VerificationStatusBadge } from "@/components/ui/status-badge";
import { toVerificationStatus } from "@/lib/status";
import { OperationsTasks } from "@/components/operations-tasks";
import Link from "next/link";
import Image from "next/image";
import {
  Compass, Building2, ClipboardCheck, CheckCircle2, XCircle, Banknote,
  Star, LifeBuoy, Undo2, ShieldCheck, ArrowRight, Trophy, Calendar, Download,
  TrendingUp, Bell, BookOpen, ChevronRight, MessageSquare, Clock, Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { summarizePayments } from "@/lib/revenue";
import { ratingSummary } from "@/lib/listings";

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    publishedListingCount,
    activeBusinessCount,
    confirmedBookingCount,
    completedBookingCount,
    cancelledBookingCount,
    allPayments,
    monthPayments,
    publishedReviews,
    openSupportCount,
    closedSupportCount,
    recentVerifications,
    recentSupportCases,
    topBusinessesRaw,
    recentAudits,
    featuredBusinessesRaw, totalBookingCount, pendingVerificationCount, pendingListingCount
  ] = await Promise.all([
    db.listing.count({ where: { status: "PUBLISHED" } }),
    db.businessProfile.count({ where: { verificationStatus: "APPROVED" } }),
    db.booking.count({ where: { status: "CONFIRMED" } }),
    db.booking.count({ where: { status: { in: ["COMPLETED", "REVIEW_PENDING", "REVIEWED"] } } }),
    db.booking.count({ where: { status: { in: ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN"] } } }),
    db.payment.findMany({ include: { refunds: { where: { status: "COMPLETED" } } } }),
    db.payment.findMany({ where: { completedAt: { gte: startOfMonth } }, include: { refunds: { where: { status: "COMPLETED" } } } }),
    db.review.findMany({ where: { status: "PUBLISHED" }, select: { rating: true } }),
    db.supportCase.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } } }),
    db.supportCase.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    db.businessVerification.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "NEEDS_CHANGES"] } },
      include: { business: true },
      orderBy: { submittedAt: "asc" },
      take: 4
    }),
    db.supportCase.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } },
      include: { openedBy: true },
      orderBy: { updatedAt: "desc" },
      take: 4
    }),
    db.businessProfile.findMany({
      where: { verificationStatus: "APPROVED" },
      include: {
        _count: { select: { bookings: { where: { status: { in: ["CONFIRMED", "COMPLETED", "REVIEW_PENDING", "REVIEWED"] } } } } },
        bookings: {
          where: { status: { in: ["CONFIRMED", "COMPLETED", "REVIEW_PENDING", "REVIEWED"] } },
          select: { totalMinor: true }
        }
      },
      orderBy: { bookings: { _count: "desc" } },
      take: 4
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 4
    }),
    db.businessProfile.findMany({
      where: {verificationStatus:"APPROVED"},
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { listings: { where:{coverImageUrl:{not:null}}, take: 1, select: { coverImageUrl: true } } }
    }),
    db.booking.count(),
    db.businessVerification.count({where:{status:{in:["SUBMITTED","UNDER_REVIEW","NEEDS_CHANGES"]}}}),
    db.listingSubmission.count({where:{status:{in:["SUBMITTED","UNDER_REVIEW"]}}})
  ]);

  const allTime = summarizePayments(allPayments);
  const monthly = summarizePayments(monthPayments);
  const { average, count } = ratingSummary(publishedReviews);

  const paidByDay = new Map<number, number>();
  for (const payment of monthPayments.filter(payment => ["SUCCESSFUL", "REFUNDED", "PARTIALLY_REFUNDED"].includes(payment.status))) {
    const day = (payment.completedAt ?? payment.createdAt).getUTCDate();
    paidByDay.set(day, (paidByDay.get(day) ?? 0) + payment.amountMinor);
  }
  const dailyRevenue = Array.from({length: now.getUTCDate()}, (_, index) => paidByDay.get(index + 1) ?? 0);
  const peak = Math.max(...dailyRevenue, 1);
  const monthlyRevenuePath = paidByDay.size && dailyRevenue.length > 1 ? dailyRevenue.map((value, index) => `${index ? "L" : "M"}${(index / (dailyRevenue.length - 1) * 316 + 2).toFixed(1)},${(38 - value / peak * 36).toFixed(1)}`).join(" ") : null;

  const stats = [
    {label:"Gross payments",value:formatUGX(allTime.grossMinor),description:"Successful payments before refunds · all time",icon:Banknote,href:"/admin/payments",actionLabel:"View payments"},
    {label:"Unsettled business balance",value:formatUGX(allTime.unsettledNetMinor),description:"Net payment value not yet settled",icon:Banknote,help:"Business share of successful payments without a payout link, after completed refunds and commission. This is a calculated balance, not a count of pending payout records."},
    {label:"Total bookings",value:totalBookingCount,description:"All booking states · all time",icon:ClipboardCheck,href:"/admin/bookings",actionLabel:"View bookings"},
    {label:"Verified businesses",value:activeBusinessCount,description:"Businesses with approved verification",icon:Building2,href:"/admin/businesses?status=approved",actionLabel:"View businesses"},
    {label:"Cancelled bookings",value:cancelledBookingCount,description:"Cancelled by customers, businesses or admins",icon:XCircle,href:"/admin/bookings?status=cancelled",actionLabel:"View bookings"},
    {label:"Payments this month",value:formatUGX(monthly.grossMinor),description:"Successful payments before refunds",icon:Banknote,help:"Successful payments completed since the start of the current calendar month, including payments subsequently refunded."},
    {label:"Published listings",value:publishedListingCount,description:"Listings currently published",icon:BookOpen},
    {label:"Completed refunds",value:formatUGX(allTime.refundedMinor),description:"Recorded completed refunds · all time",icon:Undo2},
    {label:"Platform rating",value:average?.toFixed(1),description:String(count)+" published reviews · out of 5",icon:Star},
    {label:"Open support cases",value:openSupportCount,description:"Open, in progress or waiting on a customer",icon:LifeBuoy,href:"/admin/support",actionLabel:"View support"},
    {label:"Resolved or closed cases",value:closedSupportCount,description:"Cases marked resolved or closed",icon:CheckCircle2,href:"/admin/support",actionLabel:"View support"},
    {label:"Verification in progress",value:pendingVerificationCount,description:"Submitted, under review or needing changes",icon:ShieldCheck,href:"/admin/verification?status=all",actionLabel:"View verification"}
  ];

  const featuredBusinesses = featuredBusinessesRaw.map(b => ({
    id:b.id,name:b.name,location:b.address ?? "",status:b.verificationStatus,
    statusType:b.verificationStatus === "APPROVED" ? "enabled" : "audit",image:b.coverImageUrl || b.listings[0]?.coverImageUrl || "/image-placeholder.svg"
  }));
  const recentActivity = recentAudits.map(a=>({id:a.id,title:a.action.replaceAll("_"," "),time:a.createdAt.toLocaleString("en-GB",{timeZone:"Africa/Kampala"})}));

  return (
    <div className="max-w-[1550px] mx-auto space-y-6 pb-20 font-sans">
      <PageHero
        variant="portal"
        eyebrow="Admin portal"
        title="Dashboard"
        description="Platform overview: bookings, revenue, verification, and support at a glance."
      />

      {/* 12 KPI Metrics Grid (4 columns x 3 rows) */}
      <StatGrid>{stats.map(stat=><StatCard key={stat.label} {...stat} compact/>)}</StatGrid>

      {/* Middle Section: Featured Businesses + Recent Platform Activity */}
      <div className="grid lg:grid-cols-12 gap-6">

        {/* Featured Businesses (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-border shadow-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">Featured Businesses</h3>
            <Link href="/admin/businesses" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              View all businesses <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            {featuredBusinesses.map((b) => (
              <Link href={`/admin/businesses/${b.id}`} key={b.id} className="group flex flex-col rounded-xl border border-border overflow-hidden bg-white hover:shadow-md transition-shadow">
                <div className="relative h-28 w-full bg-slate-100">
                  <Image src={b.image} alt={b.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
                <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900 leading-snug truncate">{b.name}</h4>
                    <p className="text-xs font-medium text-slate-500">{b.location}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <VerificationStatusBadge status={toVerificationStatus(b.status)} />
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Platform Activity (Col 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-border shadow-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Recent Platform Activity</h3>
            <Link href="/admin/audit" className="text-xs font-medium text-primary hover:underline">
              View all activity
            </Link>
          </div>

          <div className="flex flex-col gap-3 flex-1 justify-between py-1">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 leading-snug">{act.title}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Grid Section: 4 Operational Columns */}
      <div className="grid lg:grid-cols-4 gap-6">

        {/* Column 1: Action Queues */}
        <div className="min-w-0 bg-white rounded-2xl border border-border shadow-card p-5 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Action Queues</h3>
            <Link href="/admin/verification" className="text-xs font-medium text-primary hover:underline">
              View all queues
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100 flex-1 overflow-y-auto">
            {recentVerifications.length > 0 ? (
              recentVerifications.map((v) => (
                <div key={v.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-slate-900 truncate">{v.business.name}</p>
                    <p className="text-xs text-slate-500 font-medium">Submitted {v.updatedAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="h-6 px-2.5 text-xs font-medium border-border rounded-md"><Link href={`/admin/verification/${v.id}`}>Review</Link></Button>
                </div>
              ))
            ) : (
              <p className="py-4 text-xs text-slate-500">No pending business submissions.</p>
            )}
          </div>
          <OperationsTasks compact />
        </div>

        {/* Column 2: Active Support Cases */}
        <div className="min-w-0 bg-white rounded-2xl border border-border shadow-card p-5 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Active Support Cases</h3>
            <Link href="/admin/support" className="text-xs font-medium text-primary hover:underline">
              View all cases
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100 flex-1 overflow-y-auto">
            {recentSupportCases.map(c=>({id:c.id,title:c.subject,user:c.openedBy.name ?? c.openedBy.email,date:c.updatedAt.toLocaleDateString("en-UG")})).map((caseItem, idx) => (
              <Link href={`/admin/support/${caseItem.id}`} key={idx} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 pr-1">
                  <p className="font-medium text-xs text-slate-900 truncate">{caseItem.title}</p>
                  <p className="text-xs text-slate-500 font-medium">{caseItem.user} • {caseItem.date}</p>
                </div>
                <span className="h-6 px-2.5 inline-flex items-center text-xs font-medium text-slate-500 border border-border rounded-md shrink-0">Open</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Column 3: Top Performers */}
        <div className="min-w-0 bg-white rounded-2xl border border-border shadow-card p-5 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Top Performers</h3>
            <Link href="/admin/businesses" className="text-xs font-medium text-primary hover:underline">
              View all businesses
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100 flex-1 overflow-y-auto">
            {topBusinessesRaw.map((b,i)=>({rank:`#${i+1}`,name:b.name,bookings:`${b._count.bookings} bookings`,revenue:formatUGX(b.bookings.reduce((sum,r)=>sum+r.totalMinor,0))})).map((perf) => (
              <div key={perf.rank} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-amber-600">{perf.rank}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-xs text-slate-900 truncate">{perf.name}</p>
                    <p className="text-xs text-slate-500 font-medium">{perf.bookings}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right"><span className="font-medium text-xs text-primary">{perf.revenue}</span><p className="text-xs text-muted-foreground">Booking value</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: Recent Actions */}
        <div className="min-w-0 bg-white rounded-2xl border border-border shadow-card p-5 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Recent Actions</h3>
            <Link href="/admin/audit" className="text-xs font-medium text-primary hover:underline">
              View audit log
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100 flex-1 overflow-y-auto">
            {recentAudits.map(a=>({action:a.action,status:a.outcome,time:a.createdAt.toLocaleTimeString("en-GB",{timeZone:"Africa/Kampala"}),email:a.actorEmail})).map((log, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 pr-1">
                  <p className="font-medium text-xs text-slate-900 truncate">{log.action}</p>
                  <p className="text-xs text-slate-500 font-medium">{log.email ?? "System"}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-1.5 py-0.5 rounded-sm">
                    {log.status}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Revenue Overview Footer Banner */}
      <div className="bg-primary/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 border border-primary/20 shadow-sm">
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 leading-tight">Revenue Overview</h4>
            <p className="text-xs font-medium text-slate-500">Total revenue this month</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[24px] font-semibold text-slate-900 tracking-tight">{formatUGX(monthly.grossMinor)}</span>
          <div className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-medium flex items-center gap-1">
            Current <span className="font-semibold text-slate-500 ml-1">records</span>
          </div>
        </div>

        <div className="flex h-10 w-full max-w-[320px] flex-1 items-center ml-auto">
          {monthlyRevenuePath ? <svg width="100%" height="100%" viewBox="0 0 320 40" role="img" aria-label="Daily recorded payments this month"><path d={monthlyRevenuePath} stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg> : <span className="text-xs text-muted-foreground">No payment history to chart.</span>}
        </div>

        <Button asChild variant="ghost" className="text-sm font-medium text-primary hover:bg-primary/10 hover:text-primary"><Link href="/admin/payments" className="shrink-0">
            View payments <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link></Button>
      </div>

    </div>
  );
}
