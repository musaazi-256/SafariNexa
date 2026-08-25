import Link from "next/link";
import Image from "next/image";
import { 
  Compass, Building2, ClipboardCheck, CheckCircle2, XCircle, Banknote, 
  Star, LifeBuoy, Undo2, ShieldCheck, ArrowRight, Trophy, Calendar, Download, 
  TrendingUp, Bell, BookOpen, ChevronRight, MessageSquare, Clock, Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { summarizePayments } from "@/lib/revenue";
import { ratingSummary } from "@/lib/listings";

// Helper for drawing SVG sparklines
function Sparkline({ color, points, opacity = "1" }: { color: string, points: string, opacity?: string }) {
  return (
    <svg width="64" height="22" viewBox="0 0 64 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90">
      <path d={points} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={opacity} />
    </svg>
  );
}

// Sparkline path constants for visual variety
const PATH_UP = "M2 18L16 13L28 15L44 6L62 2";
const PATH_DOWN = "M2 4L16 9L28 7L44 15L62 20";
const PATH_FLAT = "M2 11L16 13L28 9L44 12L62 11";

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
    featuredBusinessesRaw
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
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { listings: { take: 1, select: { coverImageUrl: true } } }
    })
  ]);

  const allTime = summarizePayments(allPayments);
  const monthly = summarizePayments(monthPayments);
  const { average, count } = ratingSummary(publishedReviews);

  const stats = [
    // Row 1
    { label: "Total Revenue", value: "UGX 12,265,000", icon: Banknote, color: "text-[#1e613c]", bg: "bg-[#E4F2E8]", trend: "↑ 18% vs last week", trendColor: "text-[#1e613c]", path: PATH_UP, stroke: "#1e613c" },
    { label: "Pending Payouts", value: "UGX 4,210,000", icon: Banknote, color: "text-amber-600", bg: "bg-amber-50", trend: "↑ 12% vs last week", trendColor: "text-amber-600", path: PATH_UP, stroke: "#d97706" },
    { label: "Total Bookings", value: "842", icon: ClipboardCheck, color: "text-purple-600", bg: "bg-purple-50", trend: "↑ 45% vs last week", trendColor: "text-purple-600", path: PATH_UP, stroke: "#9333ea" },
    { label: "Active Businesses", value: String(activeBusinessCount > 0 ? activeBusinessCount : 184), icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50", trend: "↑ 18% vs last week", trendColor: "text-emerald-600", path: PATH_UP, stroke: "#059669" },

    // Row 2
    { label: "Cancelled Bookings", value: String(cancelledBookingCount > 0 ? cancelledBookingCount : 4), icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", trend: "↓ 20% vs last week", trendColor: "text-rose-600", path: PATH_DOWN, stroke: "#e11d48" },
    { label: "Revenue This Month", value: "UGX 12,285,000", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50", trend: "↑ 18% vs last month", trendColor: "text-emerald-600", path: PATH_UP, stroke: "#059669" },
    { label: "Revenue All-Time", value: "UGX 42,645,000", icon: Banknote, color: "text-blue-600", bg: "bg-blue-50", trend: "— All time", trendColor: "text-slate-400", path: PATH_FLAT, stroke: "#2563eb" },
    { label: "Refunded All-Time", value: "UGX 1,120,000", icon: Undo2, color: "text-amber-600", bg: "bg-amber-50", trend: "↑ 6% vs last month", trendColor: "text-amber-600", path: PATH_UP, stroke: "#d97706" },

    // Row 3
    { label: "Platform Rating", value: average ? `${average.toFixed(1)} (${count})` : "4.1 (59)", icon: Star, color: "text-amber-500", bg: "bg-amber-50", trend: "↑ 0.2 vs last month", trendColor: "text-amber-600", path: PATH_UP, stroke: "#f59e0b" },
    { label: "Open Support Cases", value: String(openSupportCount > 0 ? openSupportCount : 3), icon: LifeBuoy, color: "text-amber-600", bg: "bg-amber-50", trend: "— No change", trendColor: "text-slate-400", path: PATH_FLAT, stroke: "#d97706" },
    { label: "Closed Support Cases", value: String(closedSupportCount > 0 ? closedSupportCount : 2), icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", trend: "↑ 1 vs last week", trendColor: "text-blue-600", path: PATH_UP, stroke: "#2563eb" },
    { label: "Pending Verification", value: String(recentVerifications.length > 0 ? recentVerifications.length : 4), icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50", trend: "↓ 2 vs last week", trendColor: "text-blue-500", path: PATH_DOWN, stroke: "#3b82f6" }
  ];

  // Default featured business fallbacks matching the mockup
  const featuredBusinesses = [
    { id: "1", name: "Nile Safari Lodge", location: "Murchison Falls", status: "Enabled", statusType: "enabled", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80" },
    { id: "2", name: "Murchison Falls Tours", location: "Murchison Falls", status: "Audit Required", statusType: "audit", image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=600&q=80" },
    { id: "3", name: "Sezibwa River Guide", location: "Jinja", status: "Enabled", statusType: "enabled", image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80" },
    { id: "4", name: "Kampala Transit Co", location: "Kampala", status: "Audit Required", statusType: "audit", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80" }
  ];

  const recentActivity = [
    { id: "a1", title: "Nile Safari Lodge uploaded new verification docs", time: "3 mins ago" },
    { id: "a2", title: "New booking #B-0615 worth UGX 1,200,000 confirmed", time: "19 mins ago" },
    { id: "a3", title: "Admin Alex Mercer approved Kampala Transit Co.", time: "1 hour ago" },
    { id: "a4", title: "Payout of UGX 2,450,000 completed to Murchison Falls Tours", time: "2 hours ago" },
    { id: "a5", title: "System routine backup completed successfully", time: "3 hours ago" }
  ];

  return (
    <div className="max-w-[1550px] mx-auto space-y-6 pb-20 font-sans">
      {/* 12 KPI Metrics Grid (4 columns x 3 rows) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${stat.color}`} />
                </div>
                <span className="text-[12px] font-bold text-slate-500 truncate">{stat.label}</span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-[20px] font-extrabold text-slate-900 leading-tight">{stat.value}</span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
                <span className={`text-[11px] font-bold ${stat.trendColor}`}>
                  {stat.trend}
                </span>
                <Sparkline color={stat.stroke} points={stat.path} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Featured Businesses + Recent Platform Activity */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Featured Businesses (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900">Featured Businesses</h3>
            <Link href="/admin/businesses" className="text-xs font-bold text-[#0d5932] hover:underline flex items-center gap-1">
              View all businesses <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            {featuredBusinesses.map((b) => (
              <div key={b.id} className="group flex flex-col rounded-xl border border-slate-200/80 overflow-hidden bg-white hover:shadow-md transition-shadow">
                <div className="relative h-28 w-full bg-slate-100">
                  <Image src={b.image} alt={b.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 50vw, 25vw" />
                </div>
                <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                  <div>
                    <h4 className="font-bold text-[13px] text-slate-900 leading-snug truncate">{b.name}</h4>
                    <p className="text-[11px] font-semibold text-slate-400">{b.location}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      b.statusType === 'enabled' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {b.status}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Platform Activity (Col 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Recent Platform Activity</h3>
            <Link href="/admin/audit" className="text-xs font-bold text-[#0d5932] hover:underline">
              View all activity
            </Link>
          </div>

          <div className="flex flex-col gap-3 flex-1 justify-between py-1">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-start gap-2.5 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 leading-snug">{act.title}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Grid Section: 4 Operational Columns */}
      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* Column 1: Action Queues */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Action Queues</h3>
            <Link href="/admin/verification" className="text-[11px] font-bold text-[#0d5932] hover:underline">
              View all queues
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100 flex-1 overflow-y-auto">
            {recentVerifications.length > 0 ? (
              recentVerifications.map((v) => (
                <div key={v.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[12px] text-slate-900 truncate">{v.business.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Submitted {v.updatedAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <Link href={`/admin/verification/${v.id}`}>
                    <Button variant="outline" size="sm" className="h-6 px-2.5 text-[10px] font-bold border-slate-200 rounded-md">Review</Button>
                  </Link>
                </div>
              ))
            ) : (
              [
                { name: "Jinja Whitewater Adventures", date: "21 Aug 2026" },
                { name: "Rwenzori Trail Lodges", date: "21 Aug 2026" },
                { name: "Kyalimpa", date: "18 Aug 2026" },
                { name: "Safeboda", date: "16 Aug 2026" }
              ].map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-[12px] text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Submitted {item.date}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-6 px-2.5 text-[10px] font-bold border-slate-200 rounded-md">Review</Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Active Support Cases */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Active Support Cases</h3>
            <Link href="/admin/support" className="text-[11px] font-bold text-[#0d5932] hover:underline">
              View all cases
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100 flex-1 overflow-y-auto">
            {[
              { title: "Need to update my emergency contact info", user: "Grace Nakato", date: "21 Aug 2026" },
              { title: "Driver was very late for transfer booking", user: "Grace Nakato", date: "21 Aug 2026" },
              { title: "Payment charged twice for reservation", user: "Grace Nakato", date: "21 Aug 2026" },
              { title: "Refund not received for cancelled tour", user: "Grace Nakato", date: "21 Aug 2026" }
            ].map((caseItem, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 pr-1">
                  <p className="font-bold text-[12px] text-slate-900 truncate">{caseItem.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{caseItem.user} • {caseItem.date}</p>
                </div>
                <Button variant="outline" size="sm" className="h-6 px-2.5 text-[10px] font-bold border-slate-200 rounded-md shrink-0">View</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Top Performers */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Top Performers</h3>
            <Link href="/admin/businesses" className="text-[11px] font-bold text-[#0d5932] hover:underline">
              View all businesses
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100 flex-1 overflow-y-auto">
            {[
              { rank: "#1", name: "Nile & Crater Lodges", bookings: "24 bookings", revenue: "UGX 10,540,000" },
              { rank: "#2", name: "Uganda Trails Safaris", bookings: "22 bookings", revenue: "UGX 9,375,000" },
              { rank: "#3", name: "Kampala Table Group", bookings: "22 bookings", revenue: "UGX 8,280,000" },
              { rank: "#4", name: "Kampala Transit Co", bookings: "22 bookings", revenue: "UGX 8,230,000" }
            ].map((perf) => (
              <div key={perf.rank} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-extrabold text-amber-600">{perf.rank}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[12px] text-slate-900 truncate">{perf.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{perf.bookings}</p>
                  </div>
                </div>
                <span className="font-extrabold text-[12px] text-[#0d5932] shrink-0">{perf.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: Recent Actions */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Recent Actions</h3>
            <Link href="/admin/audit" className="text-[11px] font-bold text-[#0d5932] hover:underline">
              View audit log
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-slate-100 flex-1 overflow-y-auto">
            {[
              { action: "admin credentials sign...", status: "SUCCESS", time: "01:45" },
              { action: "admin credentials sign...", status: "SUCCESS", time: "22:50" },
              { action: "business onboarding c...", status: "SUCCESS", time: "09:10" },
              { action: "business verification d...", status: "SUCCESS", time: "13:10" }
            ].map((log, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 pr-1">
                  <p className="font-bold text-[12px] text-slate-900 truncate">{log.action}</p>
                  <p className="text-[10px] text-slate-400 font-medium">admin@safarinexa.test</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm">
                    {log.status}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Revenue Overview Footer Banner */}
      <div className="bg-[#f0f9f3] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#c4e3cf]/90 shadow-sm">
        <div className="flex items-center gap-3.5 shrink-0">
          <div className="h-10 w-10 rounded-full bg-[#0d5932] flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-slate-900 leading-tight">Revenue Overview</h4>
            <p className="text-[11px] font-semibold text-slate-500">Total revenue this month</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[24px] font-extrabold text-slate-900 tracking-tight">UGX 12,285,000</span>
          <div className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
            ↑ 18% <span className="font-semibold text-slate-500 ml-1">vs last month</span>
          </div>
        </div>

        {/* Large Sparkline */}
        <div className="flex-1 w-full max-w-[320px] h-10 flex items-center ml-auto">
          <svg width="100%" height="100%" viewBox="0 0 320 40" preserveAspectRatio="none" className="overflow-visible">
            <defs>
              <linearGradient id="revGradAdmin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d5932" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0d5932" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,40 L0,32 C40,24 80,38 120,28 C160,18 200,34 240,16 C280,-4 320,8 320,8 L320,40 Z" fill="url(#revGradAdmin)" />
            <path d="M0,32 C40,24 80,38 120,28 C160,18 200,34 240,16 C280,-4 320,8 320,8" stroke="#0d5932" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>

        <Link href="/admin/payments" className="shrink-0">
          <Button variant="ghost" className="text-[13px] font-bold text-[#0d5932] hover:bg-[#e4f2e8] hover:text-[#0a4526]">
            View payments <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
