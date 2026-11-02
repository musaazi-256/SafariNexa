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
    { key: "all", label: "All", count: allCount },
    { key: "awaiting_confirmation", label: "Awaiting confirmation", count: awaitingCount },
    { key: "confirmed", label: "Confirmed", count: confirmedCount },
    { key: "completed", label: "Completed", count: completedCount },
    { key: "cancelled", label: "Cancelled", count: cancelledCount }
  ];

  // Fallback mock items matching screenshot


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
          <span className="text-sm text-muted-foreground">All dates</span>
<ExportVisibleRows />
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
        <div className="flex min-w-0 flex-wrap items-center gap-3 w-full lg:w-auto">
          <form className="relative w-full lg:w-80">
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

<PortalFilter />

<ExportVisibleRows />
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
                        <Link className="text-primary underline" href={`/admin/bookings/${booking.id}`}>Details</Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              // Mock rows matching screenshot
<TableRow><TableCell colSpan={7} className="py-10 text-center">No matching bookings.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="border-t border-slate-200 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Showing {totalCount ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} bookings
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
import { ExportVisibleRows, PortalFilter } from "@/components/portal-tools";
import Link from "next/link";
