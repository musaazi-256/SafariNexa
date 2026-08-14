import Link from "next/link";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { summarizePayments } from "@/lib/revenue";
import { Building2, ShieldCheck, LifeBuoy, Banknote, Users, ClipboardCheck, Star, Gauge, Settings, ChevronRight, ArrowRight } from "lucide-react";

const MODULES = [
  { title: "Verification queue", href: "/admin/verification", description: "Review submitted business evidence.", icon: ShieldCheck, color: "text-orange-600", bg: "bg-orange-50" },
  { title: "Businesses", href: "/admin/businesses", description: "Manage business profiles and listing risk.", icon: Building2, color: "text-[#1e613c]", bg: "bg-[#E4F2E8]" },
  { title: "Users & Access", href: "/admin/users", description: "Roles, permissions, and audit history.", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Bookings", href: "/admin/bookings", description: "Monitor booking states and disputes.", icon: ClipboardCheck, color: "text-purple-600", bg: "bg-purple-50" },
  { title: "Payments", href: "/admin/payments", description: "Refunds, payouts, and reconciliation.", icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "Support", href: "/admin/support", description: "Resolve customer or business issues.", icon: LifeBuoy, color: "text-purple-600", bg: "bg-purple-50" },
  { title: "Reviews", href: "/admin/reviews", description: "Moderate verified reviews and replies.", icon: Star, color: "text-orange-600", bg: "bg-orange-50" },
  { title: "Reports", href: "/admin/reports", description: "Platform-wide stats at a glance.", icon: Gauge, color: "text-[#1e613c]", bg: "bg-[#E4F2E8]" },
  { title: "Settings", href: "/admin/settings", description: "Global platform configuration.", icon: Settings, color: "text-slate-600", bg: "bg-slate-100" }
];

export default async function AdminDashboardPage() {
  await requireAdminSession();

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [businessCount, pendingVerificationCount, openSupportCount, monthPayments] = await Promise.all([
    db.businessProfile.count(),
    db.businessVerification.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    db.supportCase.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER"] } } }),
    db.payment.findMany({ where: { completedAt: { gte: startOfMonth } }, select: { status: true, amountMinor: true } })
  ]);

  const { grossMinor } = summarizePayments(monthPayments);

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20 font-sans">
      
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e613c] mb-1">ADMIN PORTAL</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Admin dashboard</h1>
        <p className="text-[13px] text-slate-500 font-semibold max-w-2xl">Verify businesses, moderate content, manage users, monitor bookings/payments, and resolve support issues.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Total Businesses */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-full bg-[#E4F2E8] flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-[#1e613c]" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 leading-tight">{businessCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900">Total businesses</span>
              <span className="text-[11px] font-semibold text-slate-500">Across all platforms</span>
            </div>
          </div>
          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50">
            <Link href="/admin/businesses" className="text-[12px] font-bold text-[#1e613c] flex items-center gap-1 hover:underline">
              View all businesses <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                <ShieldCheck className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 leading-tight">{pendingVerificationCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900">Pending verification</span>
              <span className="text-[11px] font-semibold text-slate-500">Submitted or under review</span>
            </div>
          </div>
          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50">
            <Link href="/admin/verification" className="text-[12px] font-bold text-orange-600 flex items-center gap-1 hover:underline">
              Go to queue <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Open Support Cases */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                <LifeBuoy className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 leading-tight">{openSupportCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900">Open support cases</span>
              <span className="text-[11px] font-semibold text-slate-500">Needing reply or resolution</span>
            </div>
          </div>
          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50">
            <Link href="/admin/support" className="text-[12px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
              View support <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* MTD Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                <Banknote className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 leading-tight whitespace-nowrap">{formatUGX(grossMinor)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900">MTD Gross Revenue</span>
              <span className="text-[11px] font-semibold text-slate-500">Across all businesses</span>
            </div>
          </div>
          <div className="border-t border-slate-100 px-6 py-3 bg-slate-50/50">
            <Link href="/admin/reports" className="text-[12px] font-bold text-[#1e613c] flex items-center gap-1 hover:underline">
              View reports <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-8 py-5 bg-slate-50/30">
          <h2 className="text-lg font-bold text-slate-900">Platform Management</h2>
          <p className="text-[13px] font-semibold text-slate-500 mt-1">Quick access to essential moderation and operational tools.</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-slate-100 bg-white">
          {MODULES.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={item.title} href={item.href} className={`flex items-start gap-4 p-6 hover:bg-slate-50/80 transition-colors group ${index < 3 ? 'border-b border-slate-100' : ''} ${(index >= 3 && index < 6) ? 'border-b border-slate-100 lg:border-b-0' : ''}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[14px] text-slate-900 group-hover:text-[#1e613c] transition-colors">{item.title}</span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#1e613c] transition-colors" />
                  </div>
                  <p className="text-[12px] font-semibold text-slate-500 mt-1 pr-4">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
