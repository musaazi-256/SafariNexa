import { BUSINESS_BOOKING_FILTERS } from "@/lib/business-booking-filters";
import { RecordDateFilter } from "@/components/record-date-filter";
import { recordDateFilter } from "@/lib/record-date-filter";
import { PortalToolbar } from "@/components/portal-toolbar";
import { PortalSearch } from "@/components/portal-search";
import { TableColumnLabel } from "@/components/ui/table-column-label";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { toBookingStatus } from "@/lib/status";
import { TableActionLink } from "@/components/ui/table-action-link";
import {
  Search, Calendar
} from "lucide-react";
import { Pagination } from "@/components/page-pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RecordFilter } from "@/components/record-filter";
import { PageHero } from "@/components/page-hero";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";

import type { BookingStatus } from "@prisma/client";

const STATUS_GROUPS: Record<string, BookingStatus[]> = Object.fromEntries(
  BUSINESS_BOOKING_FILTERS.map(filter=>[filter.value,filter.statuses])
);
STATUS_GROUPS.AWAITING_CONFIRMATION = STATUS_GROUPS.AWAITING_BUSINESS_CONFIRMATION;

export default async function AdminBookingsPage({ searchParams }: { searchParams: { status?: string; page?: string; q?: string; period?: string } }) {
  await requireAdminSession();

  const activeTabParam = searchParams.status?.toLowerCase() ?? "all";
  const page = parsePage(searchParams.page);
  const q = searchParams.q?.trim();

  const requestedGroup = activeTabParam === "awaiting" || activeTabParam === "awaiting_confirmation" ? "AWAITING_BUSINESS_CONFIRMATION" : activeTabParam.toUpperCase();
  const activeGroupKey = Object.hasOwn(STATUS_GROUPS, requestedGroup) ? requestedGroup : undefined;
  const where: any = { ...recordDateFilter(searchParams.period), ...(activeGroupKey && STATUS_GROUPS[activeGroupKey] ? { status: { in: STATUS_GROUPS[activeGroupKey] } } : {}) };
  if (q) {
    where.OR = [
      { bookingRef: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } },
      { business: { name: { contains: q, mode: "insensitive" } } },
      { listing: { title: { contains: q, mode: "insensitive" } } }
    ];
  }

  const countWhere = { ...where };
  delete countWhere.status;
  const [bookings,totalCount,statusCounts] = await Promise.all([
    db.booking.findMany({
      where: where as never,
      include: { listing: true, business: true, customer: { select: { name: true, email: true } }, roomType: true, addOns: true },
      orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE
    }),
    db.booking.count({where:where as never}),
    db.booking.groupBy({by:["status"],where:countWhere,_count:{status:true}})
  ]);
  const options = [
    {value:"all",label:"All bookings",count:statusCounts.reduce((sum,row)=>sum+row._count.status,0)},
    ...BUSINESS_BOOKING_FILTERS.map(filter=>({
      value:filter.value,
      label:filter.value==="AWAITING_BUSINESS_CONFIRMATION" ? "Awaiting business confirmation" : filter.label,
      count:statusCounts.filter(row=>filter.statuses.includes(row.status)).reduce((sum,row)=>sum+row._count.status,0)
    }))
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


      </div>

      {/* Filter Tabs with Count Pills */}
      <PortalToolbar tableId="admin-bookings" search={<PortalSearch label="Search bookings, businesses, or customers" placeholder="Search bookings, businesses, or customers…" />} filters={<><RecordFilter label="Booking status" name="status" defaultValue="all"
        value={activeGroupKey ?? "all"} options={options}
      />
<RecordDateFilter label="Booking created" /></>} />


      {/* Data Table */}
      <div>
        <Table externalTools tableId="admin-bookings" aria-label="Bookings" density="compact">
          <TableHeader>
            <TableRow>
              <TableHead>
                <TableColumnLabel help="The date and time the booking was created, rather than the service date.">Date</TableColumnLabel>
              </TableHead>
              <TableHead><TableColumnLabel help="The unique reference for this booking. Open it to view booking details.">Reference</TableColumnLabel></TableHead>
              <TableHead>Listing</TableHead><TableHead>Room type</TableHead><TableHead className="text-right">Add-ons</TableHead>
              <TableHead>Business</TableHead>
              <TableHead>Customer</TableHead><TableHead>Customer email</TableHead>
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
                  <TableRow key={booking.id}><TableCell className="font-normal whitespace-nowrap">{dateStr}</TableCell>
<TableCell className="font-normal"><Link href={`/admin/bookings/${booking.id}`}>{booking.bookingRef}</Link></TableCell><TableCell>{booking.listing.title}</TableCell><TableCell>{booking.roomTypeName ?? booking.roomType?.name ?? "—"}</TableCell><TableCell className="text-right tabular-nums">{booking.addOns.length}</TableCell><TableCell className="font-normal"><Link href={`/admin/businesses/${booking.businessId}`}>{booking.business.name}</Link></TableCell><TableCell>{booking.customer.name ?? "Guest"}</TableCell><TableCell>{booking.customer.email}</TableCell><TableCell><BookingStatusBadge status={toBookingStatus(booking.status)} perspective="staff" /></TableCell>
<TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-normal text-slate-700 text-sm whitespace-nowrap">{formatUGX(booking.totalMinor)}</span>
                      </div>
                    </TableCell>
<TableCell className="text-right"><TableActionLink href={`/admin/bookings/${booking.id}`} description={`View booking ${booking.bookingRef}`} /></TableCell></TableRow>
                );
              })
            ) : (
              // Keep the empty result inside the table.
<TableRow><TableCell colSpan={11} className="py-10 text-center">No matching bookings.</TableCell></TableRow>
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
              `/admin/bookings?${new URLSearchParams({ ...(activeTabParam && activeTabParam !== "all" ? { status: activeTabParam } : {}), ...(q ? { q } : {}), ...(searchParams.period ? {period:searchParams.period} : {}), page: String(p) }).toString()}`
            }
          />
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
