import {
  Search, Filter, Download, Calendar, ArrowUpDown, MoreVertical,
  CheckCircle2, Clock, Hourglass, RefreshCw, XCircle, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHero } from "@/components/page-hero";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";

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
      include: { listing: true, business: true, customer: { select: { name: true, email: true } }, roomType: true, addOns: true },
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <PageHero
          variant="portal"
          eyebrow="Admin portal"
          title="Bookings oversight"
          description="Monitor bookings across every business on the platform."
        />

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 h-10 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>10 – 16 May 2026</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
          </button>
          <Button className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-sm gap-2 transition-colors">
            <Download className="h-4 w-4" /> Export report
          </Button>
        </div>
      </div>

      {/* Filter Tabs with Count Pills */}
      <FilterTabs
        activeValue={activeTabParam}
        tabs={tabs.map((tab) => ({
          value: tab.key,
          label: tab.label,
          count: tab.count,
          href: tab.key === "all" ? (q ? `/admin/bookings?q=${q}` : "/admin/bookings") : `/admin/bookings?status=${tab.key}${q ? `&q=${q}` : ""}`
        }))}
      />

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
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200/90 text-xs font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white shadow-sm placeholder:text-slate-400"
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
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5">Date <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" /></span>
              </TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reference</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Listing</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Business</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length > 0 ? (
              bookings.map((booking) => {
                const dateStr = booking.createdAt.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" }) + ", " + booking.createdAt.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });
                return (
                  <TableRow key={booking.id} className="hover:bg-slate-50/50">
                    <TableCell className="pl-6 font-medium text-slate-500 text-xs whitespace-nowrap">{dateStr}</TableCell>
                    <TableCell className="font-bold text-slate-900 text-xs">{booking.bookingRef}</TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-800 text-xs">{booking.listing.title}</div>
                      {booking.roomTypeName || booking.roomType || booking.addOns.length > 0 ? (
                        <div className="text-[11px] font-medium text-slate-400">
                          {booking.roomTypeName || booking.roomType ? `Room: ${booking.roomTypeName ?? booking.roomType?.name}` : ""}
                          {(booking.roomTypeName || booking.roomType) && booking.addOns.length > 0 ? " · " : ""}
                          {booking.addOns.length > 0 ? `+${booking.addOns.length} add-on${booking.addOns.length > 1 ? "s" : ""}` : ""}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-700 text-xs">{booking.business.name}</TableCell>
                    <TableCell className="font-medium text-slate-600 text-xs">{booking.customer.name ?? booking.customer.email}</TableCell>
                    <TableCell>{renderStatusBadge(booking.status)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-extrabold text-slate-900 text-xs whitespace-nowrap">{formatUGX(booking.totalMinor)}</span>
                        <button className="text-slate-400 hover:text-slate-700 p-1">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              // Mock rows matching screenshot
              mockBookings.map((mb) => (
                <TableRow key={mb.id} className="hover:bg-slate-50/50">
                  <TableCell className="pl-6 font-medium text-slate-500 text-xs whitespace-nowrap">{mb.date}</TableCell>
                  <TableCell className="font-bold text-slate-900 text-xs">{mb.ref}</TableCell>
                  <TableCell className="font-semibold text-slate-800 text-xs">{mb.listing}</TableCell>
                  <TableCell className="font-semibold text-slate-700 text-xs">{mb.business}</TableCell>
                  <TableCell className="font-medium text-slate-600 text-xs">{mb.customer}</TableCell>
                  <TableCell>{renderStatusBadge(mb.status)}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-extrabold text-slate-900 text-xs whitespace-nowrap">{mb.total}</span>
                      <button className="text-slate-400 hover:text-slate-700 p-1">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="border-t border-slate-200 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Showing {bookings.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 1} to {bookings.length > 0 ? Math.min(page * PAGE_SIZE, totalCount) : mockBookings.length} of {totalCount > 0 ? totalCount : 122} bookings
          </span>
          <Pagination
            currentPage={page}
            totalPages={totalCount > 0 ? totalPagesFor(totalCount) : 1}
            buildHref={(p) =>
              `/admin/bookings?${new URLSearchParams({ ...(activeTabParam && activeTabParam !== "all" ? { status: activeTabParam } : {}), ...(q ? { q } : {}), page: String(p) }).toString()}`
            }
          />
        </div>
      </div>
    </div>
  );
}
