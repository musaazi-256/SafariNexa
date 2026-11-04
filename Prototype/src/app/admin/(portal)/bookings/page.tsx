import { PortalSearch } from "@/components/portal-search";
import { TableColumnLabel } from "@/components/ui/table-column-label";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { toBookingStatus } from "@/lib/status";
import { TableActionLink } from "@/components/ui/table-action-link";
import {
  Search, Calendar
} from "lucide-react";
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
          <span className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 text-xs font-medium text-slate-700 shadow-sm"><Calendar className="mr-2 h-4 w-4 text-slate-400"/>All dates</span>
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
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <PortalSearch label="Search bookings, businesses, or customers" placeholder="Search bookings, businesses, or customers…" />

<PortalFilter />

<ExportVisibleRows />
        </div>
      </div>

      {/* Data Table */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <TableColumnLabel help="The date and time the booking was created, rather than the service date.">Date</TableColumnLabel>
              </TableHead>
              <TableHead><TableColumnLabel help="The unique reference for this booking. Open it to view booking details.">Reference</TableColumnLabel></TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead><TableColumnLabel help="The current booking stage. Payment and booking confirmation are tracked separately.">Status</TableColumnLabel></TableHead>
              <TableHead className="text-right"><TableColumnLabel help="The recorded booking total, including selected add-ons. Check payment details to see the amount paid.">Total</TableColumnLabel></TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length > 0 ? (
              bookings.map((booking) => {
                const dateStr = booking.createdAt.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" }) + ", " + booking.createdAt.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-normal whitespace-nowrap">{dateStr}</TableCell>
                    <TableCell className="font-normal"><Link href={`/admin/bookings/${booking.id}`}>{booking.bookingRef}</Link></TableCell>
                    <TableCell>
                      <div className="font-normal text-slate-700 text-sm">{booking.listing.title}</div>
                      {booking.roomTypeName || booking.roomType || booking.addOns.length > 0 ? (
                        <div className="text-xs font-normal text-slate-500">
                          {booking.roomTypeName || booking.roomType ? `Room: ${booking.roomTypeName ?? booking.roomType?.name}` : ""}
                          {(booking.roomTypeName || booking.roomType) && booking.addOns.length > 0 ? " · " : ""}
                          {booking.addOns.length > 0 ? `+${booking.addOns.length} add-on${booking.addOns.length > 1 ? "s" : ""}` : ""}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-normal"><Link href={`/admin/businesses/${booking.businessId}`}>{booking.business.name}</Link></TableCell>
                    <TableCell className="font-normal">{booking.customer.name ?? booking.customer.email}</TableCell>
                    <TableCell><BookingStatusBadge status={toBookingStatus(booking.status)} perspective="staff" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-normal text-slate-700 text-sm whitespace-nowrap">{formatUGX(booking.totalMinor)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right"><TableActionLink href={`/admin/bookings/${booking.id}`} description={`View booking ${booking.bookingRef}`} /></TableCell>
                  </TableRow>
                );
              })
            ) : (
              // Keep the empty result inside the table.
<TableRow><TableCell colSpan={8} className="py-10 text-center">No matching bookings.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="border-t border-border bg-slate-50/30 px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
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
