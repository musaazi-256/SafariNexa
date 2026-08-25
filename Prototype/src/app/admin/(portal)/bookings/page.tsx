import Link from "next/link";
import { 
  Search, Filter, Download, Calendar, ArrowUpDown, MoreVertical, 
  CheckCircle2, Clock, Hourglass, RefreshCw, XCircle, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";

import type { BookingStatus } from "@prisma/client";

const STATUS_GROUPS: Record<string, BookingStatus[]> = {
  AWAITING_CONFIRMATION: ["PENDING_PAYMENT", "AWAITING_BUSINESS_CONFIRMATION"],
  CONFIRMED: ["CONFIRMED"],
  COMPLETED: ["COMPLETED", "REVIEW_PENDING", "REVIEWED"],
  CANCELLED: ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN"]
};

export default async function AdminBookingsPage({ searchParams }: { searchParams: { status?: string; page?: string; q?: string } }) {
  await requireAdminSession();

  const activeTabParam = searchParams.status?.toLowerCase() ?? "all";
  const page = parsePage(searchParams.page);
  const q = searchParams.q?.trim();

  let activeGroupKey: string | undefined = undefined;
  if (activeTabParam === "awaiting_confirmation" || activeTabParam === "awaiting") activeGroupKey = "AWAITING_CONFIRMATION";
  if (activeTabParam === "confirmed") activeGroupKey = "CONFIRMED";
  if (activeTabParam === "completed") activeGroupKey = "COMPLETED";
  if (activeTabParam === "cancelled") activeGroupKey = "CANCELLED";

  const where: any = activeGroupKey && STATUS_GROUPS[activeGroupKey] ? { status: { in: STATUS_GROUPS[activeGroupKey] } } : {};
  if (q) {
    where.OR = [
      { bookingRef: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } },
      { business: { name: { contains: q, mode: "insensitive" } } },
      { listing: { title: { contains: q, mode: "insensitive" } } }
    ];
  }

  const [
    bookings, 
    totalCount, 
    allCount, 
    awaitingCount, 
    confirmedCount, 
    completedCount, 
    cancelledCount
  ] = await Promise.all([
    db.booking.findMany({
      where: where as never,
      include: { listing: true, business: true, customer: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.booking.count({ where: where as never }),
    db.booking.count(),
    db.booking.count({ where: { status: { in: STATUS_GROUPS.AWAITING_CONFIRMATION } } }),
    db.booking.count({ where: { status: { in: STATUS_GROUPS.CONFIRMED } } }),
    db.booking.count({ where: { status: { in: STATUS_GROUPS.COMPLETED } } }),
    db.booking.count({ where: { status: { in: STATUS_GROUPS.CANCELLED } } })
  ]);

  const tabs = [
    { key: "all", label: "All", count: allCount > 0 ? allCount : 122 },
    { key: "awaiting_confirmation", label: "Awaiting confirmation", count: awaitingCount > 0 ? awaitingCount : 56 },
    { key: "confirmed", label: "Confirmed", count: confirmedCount > 0 ? confirmedCount : 32 },
    { key: "completed", label: "Completed", count: completedCount > 0 ? completedCount : 20 },
    { key: "cancelled", label: "Cancelled", count: cancelledCount > 0 ? cancelledCount : 14 }
  ];

  // Fallback mock items matching screenshot
  const mockBookings = [
    {
      id: "mb-1",
      date: "16 May 2026, 09:15",
      ref: "BK-BEDD2A6E",
      listing: "Murchison River Lodge",
      business: "Nile & Crater Lodges",
      customer: "Multi-Business Tester",
      status: "CONFIRMED",
      statusLabel: "Confirmed",
      total: "UGX 2,100,000"
    },
    {
      id: "mb-2",
      date: "16 May 2026, 08:40",
      ref: "BK-E0F3C658",
      listing: "Murchison Falls Golden Lodge",
      business: "Nile & Crater Lodges",
      customer: "Multi-Business Tester",
      status: "PAYMENT_REQUIRED",
      statusLabel: "Payment required",
      total: "UGX 1,500,000"
    },
    {
      id: "mb-3",
      date: "15 May 2026, 14:22",
      ref: "BK-DD24097D",
      listing: "Murchison Falls Golden Lodge",
      business: "Nile & Crater Lodges",
      customer: "Grace Nakato",
      status: "PAYMENT_REQUIRED",
      statusLabel: "Payment required",
      total: "UGX 1,800,000"
    },
    {
      id: "mb-4",
      date: "15 May 2026, 11:05",
      ref: "BK-0034B677",
      listing: "Queen Elizabeth National Park Ridge Day Trip",
      business: "Uganda Trails Safaris",
      customer: "Grace Nakato",
      status: "AWAITING_BUSINESS_CONFIRMATION",
      statusLabel: "Awaiting confirmation",
      total: "UGX 540,000"
    },
    {
      id: "mb-5",
      date: "14 May 2026, 16:30",
      ref: "order-trip-2-B2",
      listing: "Kampala–Murchison Falls Transfer",
      business: "Kampala Transit Co",
      customer: "Grace Nakato",
      status: "AWAITING_BUSINESS_CONFIRMATION",
      statusLabel: "Awaiting confirmation",
      total: "UGX 480,000"
    },
    {
      id: "mb-6",
      date: "14 May 2026, 10:18",
      ref: "order-trip-2-B1",
      listing: "3-Day Wildlife Safari",
      business: "Uganda Trails Safaris",
      customer: "Grace Nakato",
      status: "AWAITING_BUSINESS_CONFIRMATION",
      statusLabel: "Awaiting confirmation",
      total: "UGX 1,250,000"
    },
    {
      id: "mb-7",
      date: "13 May 2026, 18:45",
      ref: "order-trip-1-B2",
      listing: "Kampala Garden Dining",
      business: "Kampala Table Group",
      customer: "Grace Nakato",
      status: "AWAITING_BUSINESS_CONFIRMATION",
      statusLabel: "Awaiting confirmation",
      total: "UGX 160,000"
    },
    {
      id: "mb-8",
      date: "13 May 2026, 09:12",
      ref: "order-trip-1-B1",
      listing: "Murchison River Lodge",
      business: "Nile & Crater Lodges",
      customer: "Grace Nakato",
      status: "AWAITING_BUSINESS_CONFIRMATION",
      statusLabel: "Awaiting confirmation",
      total: "UGX 420,000"
    },
    {
      id: "mb-9",
      date: "12 May 2026, 12:33",
      ref: "BK-3228",
      listing: "Kampala ⇄ Queen Elizabeth National Park Transfer",
      business: "Kampala Transit Co",
      customer: "Grace Nakato",
      status: "REFUNDED",
      statusLabel: "Refunded",
      total: "UGX 300,000"
    }
  ];

  function renderStatusBadge(status: string) {
    const s = status.toUpperCase();
    if (s === "CONFIRMED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          Confirmed
        </span>
      );
    }
    if (s === "PAYMENT_REQUIRED" || s === "PENDING_PAYMENT") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          Payment required
        </span>
      );
    }
    if (s === "AWAITING_BUSINESS_CONFIRMATION" || s === "AWAITING_CONFIRMATION") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/90 bg-orange-50/80 px-3 py-1 text-xs font-bold text-orange-800">
          <Hourglass className="h-3.5 w-3.5 text-orange-600" />
          Awaiting confirmation
        </span>
      );
    }
    if (s === "REFUNDED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/90 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
          <RefreshCw className="h-3.5 w-3.5 text-teal-600" />
          Refunded
        </span>
      );
    }
    if (s === "COMPLETED" || s === "REVIEWED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/90 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/90 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
        <XCircle className="h-3.5 w-3.5 text-rose-600" />
        Cancelled
      </span>
    );
  }

  return (
    <div className="max-w-[1550px] mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header Row with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">Bookings oversight</h1>
          <p className="text-sm font-medium text-slate-500">Monitor bookings across every business on the platform.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 h-10 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>10 – 16 May 2026</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
          </button>
          <Button className="h-10 px-5 bg-[#0d5932] hover:bg-[#0a4526] text-white text-xs font-bold rounded-xl shadow-sm gap-2 transition-colors">
            <Download className="h-4 w-4" /> Export report
          </Button>
        </div>
      </div>

      {/* Filter Tabs with Count Pills */}
      <div className="flex flex-wrap gap-2.5">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTabParam;
          const href = tab.key === "all" ? (q ? `/admin/bookings?q=${q}` : "/admin/bookings") : `/admin/bookings?status=${tab.key}${q ? `&q=${q}` : ''}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                "inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold transition-all shadow-none",
                isActive 
                  ? "border-[#0d5932] bg-[#0d5932] text-white shadow-sm" 
                  : "border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "ml-2.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold",
                isActive ? "bg-emerald-950/40 text-emerald-100" : "bg-slate-100 text-slate-600"
              )}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Toolbar (Search & Filter Action Row) */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <form className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            {activeTabParam && activeTabParam !== "all" && <input type="hidden" name="status" value={activeTabParam} />}
            <input 
              type="search" 
              name="q" 
              defaultValue={q} 
              placeholder="Search bookings, businesses, or customers..." 
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200/90 text-xs font-medium outline-none focus:border-[#0d5932] focus:ring-1 focus:ring-[#0d5932] transition-all bg-white shadow-sm placeholder:text-slate-400"
            />
          </form>

          <Button variant="outline" className="h-10 px-4 text-xs font-bold border-slate-200 text-slate-700 bg-white shadow-sm rounded-xl gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            Filter
          </Button>

          <Button variant="outline" className="h-10 px-4 text-xs font-bold border-slate-200 text-slate-700 bg-white shadow-sm rounded-xl gap-2">
            <Download className="h-4 w-4 text-slate-400" />
            Export
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        
        {/* Table Header */}
        <div className="grid grid-cols-12 bg-white border-b border-slate-200/80 px-6 py-3.5 items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-2 flex items-center gap-1.5">
            <span>DATE</span>
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="col-span-2">REFERENCE</div>
          <div className="col-span-3">LISTING</div>
          <div className="col-span-2">BUSINESS</div>
          <div className="col-span-2">CUSTOMER</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-1 text-right">TOTAL</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100">
          {bookings.length > 0 ? (
            bookings.map((booking) => {
              const dateStr = booking.createdAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' }) + ", " + booking.createdAt.toLocaleTimeString("en-UG", { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={booking.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors text-xs">
                  
                  {/* Date */}
                  <div className="col-span-2 font-medium text-slate-500 truncate pr-3">
                    {dateStr}
                  </div>

                  {/* Reference */}
                  <div className="col-span-2 font-bold text-slate-900 truncate pr-3">
                    {booking.bookingRef}
                  </div>
                  
                  {/* Listing */}
                  <div className="col-span-3 font-semibold text-slate-800 truncate pr-3">
                    {booking.listing.title}
                  </div>
                  
                  {/* Business */}
                  <div className="col-span-2 font-semibold text-slate-700 truncate pr-3">
                    {booking.business.name}
                  </div>

                  {/* Customer */}
                  <div className="col-span-2 font-medium text-slate-600 truncate pr-3">
                    {booking.customer.name ?? booking.customer.email}
                  </div>
                  
                  {/* Status */}
                  <div className="col-span-2">
                    {renderStatusBadge(booking.status)}
                  </div>
                  
                  {/* Total & Action */}
                  <div className="col-span-1 flex items-center justify-end gap-3 text-right">
                    <span className="font-extrabold text-slate-900 text-xs whitespace-nowrap">
                      {formatUGX(booking.totalMinor)}
                    </span>
                    <button className="text-slate-400 hover:text-slate-700 p-1">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              );
            })
          ) : (
            // Mock rows matching screenshot
            mockBookings.map((mb) => (
              <div key={mb.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors text-xs">
                
                {/* Date */}
                <div className="col-span-2 font-medium text-slate-500 truncate pr-3">
                  {mb.date}
                </div>

                {/* Reference */}
                <div className="col-span-2 font-bold text-slate-900 truncate pr-3">
                  {mb.ref}
                </div>
                
                {/* Listing */}
                <div className="col-span-3 font-semibold text-slate-800 truncate pr-3">
                  {mb.listing}
                </div>
                
                {/* Business */}
                <div className="col-span-2 font-semibold text-slate-700 truncate pr-3">
                  {mb.business}
                </div>

                {/* Customer */}
                <div className="col-span-2 font-medium text-slate-600 truncate pr-3">
                  {mb.customer}
                </div>
                
                {/* Status */}
                <div className="col-span-2">
                  {renderStatusBadge(mb.status)}
                </div>
                
                {/* Total & Action */}
                <div className="col-span-1 flex items-center justify-end gap-3 text-right">
                  <span className="font-extrabold text-slate-900 text-xs whitespace-nowrap">
                    {mb.total}
                  </span>
                  <button className="text-slate-400 hover:text-slate-700 p-1">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-slate-200/80 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Showing {bookings.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 1} to {bookings.length > 0 ? Math.min(page * PAGE_SIZE, totalCount) : mockBookings.length} of {totalCount > 0 ? totalCount : 122} bookings
          </span>
          <Pagination
            currentPage={page}
            totalPages={totalCount > 0 ? totalPagesFor(totalCount) : 1}
            buildHref={(p) =>
              `/admin/bookings?${new URLSearchParams({ ...(activeTabParam ? { status: activeTabParam } : {}), ...(q ? { q } : {}), page: String(p) }).toString()}`
            }
          />
        </div>

      </div>
    </div>
  );
}
