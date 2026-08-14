import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { ratingSummary } from "@/lib/listings";
import { summarizePayments } from "@/lib/revenue";
import { Compass, Building2, ClipboardCheck, CheckCircle2, XCircle, Banknote, Star, LifeBuoy } from "lucide-react";

export default async function AdminReportsPage() {
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
    closedSupportCount
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
    db.supportCase.count({ where: { status: { in: ["RESOLVED", "CLOSED"] } } })
  ]);

  const allTime = summarizePayments(allPayments);
  const monthly = summarizePayments(monthPayments);
  const { average, count } = ratingSummary(publishedReviews);

  const stats = [
    { label: "Published listings", value: String(publishedListingCount), icon: Compass, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Approved businesses", value: String(activeBusinessCount), icon: Building2, color: "text-[#1e613c]", bg: "bg-[#E4F2E8]" },
    { label: "Confirmed bookings", value: String(confirmedBookingCount), icon: ClipboardCheck, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Completed bookings", value: String(completedBookingCount), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Cancelled bookings", value: String(cancelledBookingCount), icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Revenue this month", value: formatUGX(monthly.grossMinor), icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Revenue all-time", value: formatUGX(allTime.grossMinor), icon: Banknote, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Platform rating", value: average ? `${average.toFixed(1)} (${count})` : "—", icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Open support cases", value: String(openSupportCount), icon: LifeBuoy, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Closed support cases", value: String(closedSupportCount), icon: CheckCircle2, color: "text-slate-600", bg: "bg-slate-100" }
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B4928] mb-1">ADMIN PORTAL</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Platform Reports</h1>
          <p className="text-sm text-slate-500 max-w-2xl">Bookings, revenue, listings, reviews, and support health across the platform.</p>
        </div>

        {/* Segmented Controls (Visual Only) */}
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm h-10 w-fit">
          <div className="flex items-center justify-center rounded-md bg-[#E4F2E8] px-4 py-1.5 text-[13px] font-bold text-[#1e613c]">
            All-time
          </div>
          <div className="flex items-center justify-center rounded-md px-4 py-1.5 text-[13px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
            This Month
          </div>
          <div className="flex items-center justify-center rounded-md px-4 py-1.5 text-[13px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer">
            This Week
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold text-slate-900 leading-tight">{stat.value}</span>
                <span className="text-[13px] font-semibold text-slate-500 mb-0.5 mt-1">{stat.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
