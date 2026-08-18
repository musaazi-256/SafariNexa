import Link from "next/link";
import { 
  Compass, Building2, ClipboardCheck, CheckCircle2, XCircle, Banknote, 
  Star, LifeBuoy, Undo2, ShieldCheck, ArrowRight, Trophy, Calendar, Download, TrendingUp
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { summarizePayments } from "@/lib/revenue";
import { ratingSummary } from "@/lib/listings";

// Helper for drawing mock SVG sparklines
function Sparkline({ color, points, opacity = "1" }: { color: string, points: string, opacity?: string }) {
  return (
    <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
      <path d={points} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={opacity} />
    </svg>
  );
}

// Sparkline path constants for visual variety
const PATH_UP = "M2 16L15 12L25 14L40 6L58 2";
const PATH_DOWN = "M2 4L15 8L25 6L40 14L58 18";
const PATH_FLAT = "M2 10L15 12L25 8L40 11L58 10";

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
    recentAudits
  ] = await Promise.all([
    db.listing.count({ where: { status: "PUBLISHED" } }),
    db.businessProfile.count({ where: { verificationStatus: "APPROVED" } }),
    db.booking.count({ where: { status: "CONFIRMED" } }),
    db.booking.count({ where: { status: { in: ["COMPLETED", "REVIEW_PENDING", "REVIEWED"] } } }),
    db.booking.count({ where: { status: { in: ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN"] } } }),
    db.payment.findMany({ select: { status: true, amountMinor: true } }),
    db.payment.findMany({ where: { completedAt: { gte: startOfMonth } }, select: { status: true, amountMinor: true } }),
    db.review.findMany({ where: { status: "PUBLISHED" }, select: { rating: true } }),
    db.supportCase.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } } }),
    db.supportCase.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } }),
    db.businessVerification.findMany({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      include: { business: true },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    db.supportCase.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } },
      include: { openedBy: true },
      orderBy: { updatedAt: "desc" },
      take: 5
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
      take: 5
    })
  ]);

  const allTime = summarizePayments(allPayments);
  const monthly = summarizePayments(monthPayments);
  const { average, count } = ratingSummary(publishedReviews);

  const stats = [
    { label: "Published listings", value: String(publishedListingCount), icon: Compass, color: "text-blue-600", bg: "bg-blue-50", trend: "↑ 12% vs last week", trendColor: "text-blue-600", path: PATH_UP, stroke: "#2563eb" },
    { label: "Approved businesses", value: String(activeBusinessCount), icon: Building2, color: "text-[#1e613c]", bg: "bg-[#E4F2E8]", trend: "↑ 1 vs last week", trendColor: "text-[#1e613c]", path: PATH_UP, stroke: "#1e613c" },
    { label: "Confirmed bookings", value: String(confirmedBookingCount), icon: ClipboardCheck, color: "text-purple-600", bg: "bg-purple-50", trend: "↑ 8% vs last week", trendColor: "text-purple-600", path: PATH_UP, stroke: "#9333ea" },
    { label: "Completed bookings", value: String(completedBookingCount), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", trend: "↑ 15% vs last week", trendColor: "text-emerald-600", path: PATH_UP, stroke: "#059669" },
    
    { label: "Cancelled bookings", value: String(cancelledBookingCount), icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", trend: "↓ 20% vs last week", trendColor: "text-rose-600", path: PATH_DOWN, stroke: "#e11d48" },
    { label: "Revenue this month", value: formatUGX(monthly.grossMinor), icon: Banknote, color: "text-[#1e613c]", bg: "bg-[#E4F2E8]", trend: "↑ 18% vs last month", trendColor: "text-[#1e613c]", path: PATH_UP, stroke: "#1e613c" },
    { label: "Revenue all-time", value: formatUGX(allTime.grossMinor), icon: Banknote, color: "text-indigo-600", bg: "bg-indigo-50", trend: "— All time", trendColor: "text-slate-400", path: PATH_FLAT, stroke: "#818cf8" },
    { label: "Refunded all-time", value: formatUGX(allTime.refundedMinor), icon: Undo2, color: "text-orange-500", bg: "bg-orange-50", trend: "↑ 6% vs last month", trendColor: "text-orange-500", path: PATH_UP, stroke: "#f97316" },
    
    { label: "Platform rating", value: average ? `${average.toFixed(1)} (${count})` : "—", icon: Star, color: "text-amber-500", bg: "bg-amber-50", trend: "↑ 0.2 vs last month", trendColor: "text-amber-600", path: PATH_UP, stroke: "#f59e0b" },
    { label: "Open support cases", value: String(openSupportCount), icon: LifeBuoy, color: "text-orange-500", bg: "bg-orange-50", trend: "— No change", trendColor: "text-slate-400", path: PATH_FLAT, stroke: "#f97316", strokeOpacity: "0.5" },
    { label: "Closed support cases", value: String(closedSupportCount), icon: CheckCircle2, color: "text-slate-500", bg: "bg-slate-100", trend: "↑ 1 vs last week", trendColor: "text-slate-500", path: PATH_UP, stroke: "#64748b" },
    { label: "Pending verification", value: String(recentVerifications.length), icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50", trend: "↓ 2 vs last week", trendColor: "text-blue-500", path: PATH_DOWN, stroke: "#3b82f6" }
  ];

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900 mb-1">Admin Dashboard</h1>
          <p className="text-[13px] text-slate-500 font-semibold">Overview of platform health, performance, and key actions.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm h-10 cursor-pointer hover:bg-slate-50 transition-colors">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="text-[13px] font-bold text-slate-700">10 – 16 May 2026</span>
          </div>
          <Button className="h-10 px-5 bg-[#1e613c] hover:bg-[#15462b] text-white text-[13px] font-bold shadow-sm rounded-xl gap-2 transition-colors">
            <Download className="h-4 w-4" /> Export report
          </Button>
        </div>
      </div>

      {/* Platform Pulse */}
      <section>
        <h2 className="text-[14px] font-bold text-slate-900 mb-4">Platform Pulse</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-4">
                  <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                    <Icon className={`h-[22px] w-[22px] ${stat.color}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[22px] font-extrabold text-slate-900 leading-none mb-1">{stat.value}</span>
                    <span className="text-[12px] font-bold text-slate-500">{stat.label}</span>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-6 pt-3 border-t border-slate-100/80">
                  <span className={`text-[11px] font-bold ${stat.trendColor}`}>
                    {stat.trend}
                  </span>
                  <Sparkline color={stat.stroke} points={stat.path} opacity={stat.strokeOpacity} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Multi-Column Layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Verification Queue */}
        <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm flex flex-col h-[420px]">
          <div className="border-b border-slate-100 px-6 py-5 flex justify-between items-start">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">Action Queues</h3>
              <p className="text-[13px] font-bold text-slate-900 mt-3">Verification queue</p>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Businesses awaiting review</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Link href="/admin/verification" className="text-[12px] font-bold text-[#1e613c] hover:underline flex items-center gap-1">View all queues <ArrowRight className="h-3 w-3" /></Link>
              <span className="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-md uppercase tracking-wider">{recentVerifications.length} pending</span>
            </div>
          </div>
          <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
            {recentVerifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 font-medium">No pending verifications.</div>
            ) : (
              recentVerifications.map((v) => (
                <div key={v.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-bold text-slate-900 truncate">{v.business.name}</span>
                      <span className="text-[11px] font-semibold text-slate-500">Submitted {v.updatedAt.toLocaleDateString("en-UG", { dateStyle: "medium" })}</span>
                    </div>
                  </div>
                  <Link href={`/admin/verification/${v.id}`}>
                    <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] font-bold border-slate-200 shadow-none rounded-lg text-slate-700">Review</Button>
                  </Link>
                </div>
              ))
            )}
            {recentVerifications.length > 0 && (
              <Link href="/admin/verification" className="block px-6 py-4 text-[12px] font-bold text-[#1e613c] hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Active Support Cases */}
        <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm flex flex-col h-[420px]">
          <div className="border-b border-slate-100 px-6 py-5 flex justify-between items-start">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">Active support cases</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Requires admin attention</p>
            </div>
            <Link href="/admin/support" className="text-[12px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1">View all cases <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
            {recentSupportCases.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 font-medium">No active support cases.</div>
            ) : (
              recentSupportCases.map((c) => (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <LifeBuoy className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-bold text-slate-900 truncate">{c.subject}</span>
                      <span className="text-[11px] font-semibold text-slate-500">{c.openedBy?.name || "Unknown"} • {c.updatedAt.toLocaleDateString("en-UG", { dateStyle: "medium" })}</span>
                    </div>
                  </div>
                  <Link href={`/admin/support/${c.id}`}>
                    <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] font-bold border-slate-200 shadow-none rounded-lg text-slate-700">View</Button>
                  </Link>
                </div>
              ))
            )}
            {recentSupportCases.length > 0 && (
              <Link href="/admin/support" className="block px-6 py-4 text-[12px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm flex flex-col h-[420px]">
          <div className="border-b border-slate-100 px-6 py-5 flex justify-between items-start">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">Top Performers</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">By successful bookings</p>
            </div>
            <Link href="/admin/businesses" className="text-[12px] font-bold text-[#1e613c] hover:underline flex items-center gap-1 mt-1">View all businesses <ArrowRight className="h-3 w-3" /></Link>
          </div>
          
          <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
            {topBusinessesRaw.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 font-medium">No bookings yet.</div>
            ) : (
              topBusinessesRaw.map((biz, idx) => {
                const revenue = biz.bookings.reduce((sum, b) => sum + b.totalMinor, 0);
                const volume = biz._count.bookings;
                return (
                  <Link key={biz.id} href={`/admin/businesses/${biz.id}`} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className={`text-[12px] font-bold ${idx === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        #{idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900 group-hover:text-[#1e613c] transition-colors">{biz.name}</span>
                        <span className="text-[11px] font-semibold text-slate-500">{volume} bookings</span>
                      </div>
                    </div>
                    <span className="text-[13px] font-extrabold text-[#1e613c]">{formatUGX(revenue)}</span>
                  </Link>
                );
              })
            )}
            {topBusinessesRaw.length > 0 && (
              <Link href="/admin/businesses" className="block px-6 py-4 text-[12px] font-bold text-[#1e613c] hover:underline flex items-center gap-1">
                View all businesses <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Recent Actions (Audit Logs) */}
        <div className="bg-white rounded-[20px] border border-slate-200 shadow-sm flex flex-col h-[420px]">
          <div className="border-b border-slate-100 px-6 py-5 flex justify-between items-start">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900">Recent Actions</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Platform audit log</p>
            </div>
          </div>
          
          <div className="divide-y divide-slate-50 flex-1 overflow-y-auto">
            {recentAudits.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 font-medium">No recent actions.</div>
            ) : (
              recentAudits.map((audit) => (
                <div key={audit.id} className="px-6 py-4 flex flex-col gap-1 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-slate-900 truncate pr-2" title={audit.action}>{audit.action.replace(/_/g, " ")}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${audit.outcome === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                      {audit.outcome}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[11px] font-semibold text-slate-500 truncate" title={audit.actorEmail || "System"}>{audit.actorEmail || "System"}</span>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">{audit.createdAt.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Revenue Overview Footer */}
      <div className="bg-[#f0f9f3] rounded-[24px] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#c4e3cf]">
        <div className="flex items-center gap-4 shrink-0">
          <div className="h-12 w-12 rounded-full bg-[#1e613c] flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Revenue overview</h3>
            <p className="text-[12px] font-semibold text-slate-500">Total revenue this month</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-[26px] font-extrabold text-slate-900 tracking-tight">{formatUGX(monthly.grossMinor)}</span>
          <div className="px-2 py-1 rounded-md bg-[#dcfce7] text-[#166534] text-[11px] font-bold flex items-center gap-1">
            ↑ 18% <span className="font-semibold text-slate-500 ml-1">vs last month</span>
          </div>
        </div>

        {/* Large Decorative Sparkline */}
        <div className="flex-1 w-full max-w-[400px] h-12 flex items-center ml-auto">
          <svg width="100%" height="100%" viewBox="0 0 400 48" preserveAspectRatio="none" className="overflow-visible">
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e613c" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#1e613c" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,48 L0,40 C50,30 100,50 150,35 C200,20 250,45 300,20 C350,-5 400,10 400,10 L400,48 Z" fill="url(#revGrad)" />
            <path d="M0,40 C50,30 100,50 150,35 C200,20 250,45 300,20 C350,-5 400,10 400,10" stroke="#1e613c" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <Link href="/admin/payments" className="shrink-0">
          <Button variant="ghost" className="text-[13px] font-bold text-[#1e613c] hover:bg-[#e4f2e8] hover:text-[#15462b]">
            View payments <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
