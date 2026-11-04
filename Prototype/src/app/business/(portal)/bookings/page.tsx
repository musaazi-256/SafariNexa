import { RecordDateFilter } from "@/components/record-date-filter";
import { recordDateFilter } from "@/lib/record-date-filter";
import { PortalToolbar } from "@/components/portal-toolbar";
import { bookingPaymentSummary } from "@/lib/booking-payment-summary";
import { PaymentStatusBadge } from "@/components/ui/status-badge";
import { toPaymentStatus } from "@/lib/status";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { PortalSearch } from "@/components/portal-search";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { toBookingStatus } from "@/lib/status";
import { TableColumnLabel } from "@/components/ui/table-column-label";
import Link from "next/link";
import { Download, Calendar, Hourglass, Check, CalendarCheck, X, Banknote, Filter, Search, MoreVertical, ArrowUpDown } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/page-pagination";
import { RecordFilter } from "@/components/record-filter";
import { BUSINESS_BOOKING_FILTERS, businessBookingFilter } from "@/lib/business-booking-filters";
import type { Prisma } from "@prisma/client";
import { PageHero } from "@/components/page-hero";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";

export default async function BusinessBookingsPage({ searchParams }: { searchParams: { status?: string; page?: string; q?: string; period?: string } }) {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="space-y-6">
        <EmptyState title="No business linked" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const selectedFilter = businessBookingFilter(searchParams.status);
  const activeTab = selectedFilter?.value;
  const q = searchParams.q?.trim();
  const page = parsePage(searchParams.page);
  const searchWhere: Prisma.BookingWhereInput = { businessId, ...recordDateFilter(searchParams.period), ...(q ? { OR: [
    { bookingRef: { contains: q, mode: "insensitive" } },
    { listing: { title: { contains: q, mode: "insensitive" } } },
    { customer: { name: { contains: q, mode: "insensitive" } } },
    { customer: { email: { contains: q, mode: "insensitive" } } }
  ] } : {}) };
  const where: Prisma.BookingWhereInput = { ...searchWhere, ...(selectedFilter ? { status: { in: selectedFilter.statuses } } : {}) };

  // Fetch data
  const [
    bookings, 
    totalFilteredCount, 
    statusCountsResult,
    revenueResult,
    matchingStatusCounts
  ] = await Promise.all([
    db.booking.findMany({
      where,
      include: { listing: true, customer: { select: { name: true, email: true, phone: true } }, payments:{include:{refunds:true}}, order:{include:{payments:{include:{refunds:true}}}} },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.booking.count({ where }),
    db.booking.groupBy({
      by: ["status"],
      _count: { status: true },
      where: { businessId }
    }),
    db.booking.aggregate({
      _sum: { totalMinor: true },
      where: { businessId, status: { in: ["CONFIRMED", "COMPLETED", "REVIEW_PENDING", "REVIEWED"] } }
    }),
    db.booking.groupBy({ by: ["status"], _count: { status: true }, where: searchWhere })
  ]);

  // Aggregate counts
  const statusCounts = statusCountsResult.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status;
    return acc;
  }, {} as Record<string, number>);

  const awaitingCount = statusCounts["AWAITING_BUSINESS_CONFIRMATION"] || 0;
  const confirmedCount = statusCounts["CONFIRMED"] || 0;
  const completedCount = (statusCounts["COMPLETED"] || 0) + (statusCounts["REVIEW_PENDING"] || 0) + (statusCounts["REVIEWED"] || 0);
  const cancelledCount = (statusCounts["CANCELLED_BY_CUSTOMER"] || 0) + (statusCounts["CANCELLED_BY_BUSINESS"] || 0) + (statusCounts["CANCELLED_BY_ADMIN"] || 0);
  
  const totalRevenue = revenueResult._sum.totalMinor || 0;

  const filterOptions = [
    { value: "ALL", label: "All bookings", count: matchingStatusCounts.reduce((sum, row) => sum + row._count.status, 0) },
    ...BUSINESS_BOOKING_FILTERS.map(filter => ({ value: filter.value, label: filter.label,
      count: matchingStatusCounts.filter(row => filter.statuses.includes(row.status)).reduce((sum, row) => sum + row._count.status, 0)
    }))
  ];

  const totalPages = totalPagesFor(totalFilteredCount);


  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <PageHero
          variant="portal"
          title="Bookings"
          description="Handle booking requests and confirmations."
        />
        <div className="flex items-center gap-3 shrink-0">

<Button asChild variant="outline"><Link href="/business/bookings/calendar">Calendar view</Link></Button>
        </div>
      </div>

      {/* Stat Cards */}
      <StatGrid columns={5}>
        <StatCard label="Awaiting confirmation" value={awaitingCount} description="Requests needing a response" icon={Hourglass} href="/business/bookings?status=awaiting_business_confirmation" actionLabel="View requests" />
        <StatCard label="Confirmed" value={confirmedCount} description="Currently confirmed bookings" icon={Check} href="/business/bookings?status=confirmed" actionLabel="View bookings" />
        <StatCard label="Completed" value={completedCount} description="Includes bookings awaiting or receiving a review" icon={CalendarCheck} href="/business/bookings?status=completed" actionLabel="View bookings" />
        <StatCard label="Cancelled" value={cancelledCount} description="Cancelled by customers, businesses or admins" icon={X} href="/business/bookings?status=cancelled" actionLabel="View bookings" />
        <StatCard label="Confirmed booking value" value={formatUGX(totalRevenue)} description="Confirmed and completed bookings · all time" icon={Banknote} help="Sum of booking totals for confirmed, completed and reviewed bookings. This is booking value, not a settled-payment or payout total." />
      </StatGrid>

      {/* One status control and one search; counts follow the current search. */}
      <PortalToolbar tableId="business-bookings" search={<PortalSearch label="Search bookings" placeholder="Reference, listing or customer…" />} filters={<><RecordFilter label="Booking status" name="status" value={activeTab ?? "ALL"} options={filterOptions} />
<RecordDateFilter label="Booking created" /></>} />


      {/* Main Table */}
      {bookings.length === 0 ? (
        <EmptyState title="No bookings found" description="No bookings match your search and status. Try another status or clear the search." />
      ) : (
        <div>
          <Table externalTools tableId="business-bookings" aria-label="Bookings" density="compact">
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead><TableHead>Listing</TableHead><TableHead>Customer</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
                <TableHead>Service date</TableHead><TableHead>Service time</TableHead>
                <TableHead>Booking status</TableHead><TableHead>Payment status</TableHead>
                <TableHead className="text-right">Total</TableHead><TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {

                
                return (
                  <TableRow key={booking.id}>
                    <TableCell><Link href={`/business/bookings/${booking.id}`}>{booking.bookingRef}</Link></TableCell>
                    <TableCell>{booking.listing.title}</TableCell>
                    <TableCell>{booking.customer.name ?? "Guest"}</TableCell><TableCell>{booking.customer.email}</TableCell><TableCell>{booking.customer.phone ?? "—"}</TableCell>
                    <TableCell>{booking.startDate ? booking.startDate.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Kampala" }) : "—"}</TableCell>
                    <TableCell>{booking.startDate ? booking.startDate.toLocaleTimeString("en-UG", { hour: "numeric", minute: "2-digit", timeZone: "Africa/Kampala" }) : "—"}</TableCell>
                    <TableCell><BookingStatusBadge status={toBookingStatus(booking.status)} perspective="staff" /></TableCell>
                    <TableCell>{booking.totalMinor === 0 ? <span className="text-xs text-muted-foreground">No payment required</span> : <PaymentStatusBadge status={toPaymentStatus(bookingPaymentSummary(booking).status)} />}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatUGX(booking.totalMinor)}</TableCell>
                    <TableCell><div className="flex items-center gap-3"><Link href={`/business/bookings/${booking.id}#payments`}>Manage payment</Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label={`Actions for booking ${booking.bookingRef}`} title="Booking actions" variant="outline" size="icon" className="h-8 w-8 text-slate-400 border-border ml-auto">
                            <MoreVertical className="h-4 w-4 text-slate-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 font-normal text-sm">
                          <DropdownMenuItem asChild>
                            <Link href={`/business/bookings/${booking.id}`} className="w-full cursor-pointer">View details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/business/messages?bookingId=${booking.id}`} className="w-full cursor-pointer text-slate-700">
                              Message customer
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="border-t border-border bg-slate-50/30 px-6 py-4 flex flex-wrap gap-3 items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalFilteredCount)} of {totalFilteredCount} bookings
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              buildHref={(p) => `/business/bookings?${new URLSearchParams({ ...(activeTab ? { status: activeTab.toLowerCase() } : {}), ...(searchParams.q ? { q: searchParams.q } : {}), ...(searchParams.period ? {period:searchParams.period} : {}), page: String(p) }).toString()}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
