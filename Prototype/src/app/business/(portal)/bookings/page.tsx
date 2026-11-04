import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { PortalSearch } from "@/components/portal-search";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { toBookingStatus } from "@/lib/status";
import { TableColumnLabel } from "@/components/ui/table-column-label";
import { RemoteImage } from "@/components/remote-image";
import Link from "next/link";
import { Download, Calendar, Hourglass, Check, CalendarCheck, X, Banknote, Filter, Search, MoreVertical, ArrowUpDown } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHero } from "@/components/page-hero";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const STATUS_GROUPS: Record<string, string[]> = {
  PENDING_PAYMENT: ["PENDING_PAYMENT","PAYMENT_FAILED","PAYMENT_PROCESSING"],
  AWAITING_BUSINESS_CONFIRMATION: ["AWAITING_BUSINESS_CONFIRMATION"],
  CONFIRMED: ["CONFIRMED"],
  COMPLETED: ["COMPLETED", "REVIEW_PENDING", "REVIEWED"],
  CANCELLED: ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN"]
};

export default async function BusinessBookingsPage({ searchParams }: { searchParams: { status?: string; page?: string; q?: string } }) {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="space-y-6">
        <EmptyState title="No business linked" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const activeTab = searchParams.status?.toUpperCase();
  const page = parsePage(searchParams.page);
  const where = { ...(searchParams.q ? { OR: [{ bookingRef: { contains: searchParams.q.trim(), mode: "insensitive" as const } }, { listing: { title: { contains: searchParams.q.trim(), mode: "insensitive" as const } } }] } : {}), businessId, ...(activeTab && STATUS_GROUPS[activeTab] ? { status: { in: STATUS_GROUPS[activeTab] } } : {}) };

  // Fetch data
  const [
    bookings, 
    totalFilteredCount, 
    statusCountsResult,
    revenueResult
  ] = await Promise.all([
    db.booking.findMany({
      where: where as never,
      include: { listing: true, customer: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.booking.count({ where: where as never }),
    db.booking.groupBy({
      by: ["status"],
      _count: { status: true },
      where: { businessId }
    }),
    db.booking.aggregate({
      _sum: { totalMinor: true },
      where: { businessId, status: { in: ["CONFIRMED", "COMPLETED", "REVIEW_PENDING", "REVIEWED"] } }
    })
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
  const allCount = Object.values(statusCounts).reduce((sum,count)=>sum+count,0);
  
  const totalRevenue = revenueResult._sum.totalMinor || 0;

  const TABS = [
    { value: "ALL", label: "All", count: allCount },
    { value: "AWAITING_BUSINESS_CONFIRMATION", label: "Awaiting confirmation", count: awaitingCount },
    { value: "PENDING_PAYMENT", label: "Awaiting customer payment", count: STATUS_GROUPS.PENDING_PAYMENT.reduce((sum,status)=>sum+(statusCounts[status]||0),0) },
    { value: "CONFIRMED", label: "Confirmed", count: confirmedCount },
    { value: "COMPLETED", label: "Completed", count: completedCount },
    { value: "CANCELLED", label: "Cancelled", count: cancelledCount }
  ];

  const totalPages = totalPagesFor(totalFilteredCount);


  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <PageHero
          variant="portal"
          eyebrow="Business portal"
          title="Bookings"
          description="Handle booking requests and confirmations."
        />
        <div className="flex items-center gap-3 shrink-0">
<ExportVisibleRows />
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

      {/* Tabs & Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-border pb-4 mt-8">
        <FilterTabs
          activeValue={activeTab ?? "ALL"}
          tabs={TABS.map((tab) => ({
            value: tab.value,
            label: tab.label,
            count: tab.count,
            href: `/business/bookings?${new URLSearchParams({ ...(tab.value !== "ALL" ? { status: tab.value.toLowerCase() } : {}), ...(searchParams.q ? { q: searchParams.q } : {}) })}`
          }))}
        />

        <div className="flex items-center gap-3 w-full lg:w-auto">
<PortalFilter />
          <PortalSearch label="Search bookings" placeholder="Search bookings…" />
        </div>
      </div>

      {/* Main Table */}
      {bookings.length === 0 ? (
        <EmptyState title="No bookings found" description="You don't have any bookings in this category yet." />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]"><TableColumnLabel help="The unique reference for this booking. Open it to view booking details.">Reference</TableColumnLabel></TableHead>
                <TableHead className="w-[350px]">Listing</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">Date</div>
                </TableHead>
                <TableHead><TableColumnLabel help="The current booking stage. Payment and booking confirmation are tracked separately.">Status</TableColumnLabel></TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-2">Total</div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {

                
                return (
                  <TableRow key={booking.id} className="group">
                    <TableCell className="font-normal">
                      <Link href={`/business/bookings/${booking.id}`}>{booking.bookingRef}</Link>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 overflow-hidden shadow-sm border border-border/60">
                          {booking.listing.coverImageUrl ? (
                            <RemoteImage src={booking.listing.coverImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-slate-100" />
                          )}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <p className="font-normal text-slate-700 truncate">{booking.listing.title}</p>
                          <p className="text-xs text-slate-500 font-normal truncate">{booking.bookingRef}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-normal text-slate-700 truncate">{booking.customer.name ?? booking.customer.email}</span>
                        <span className="text-xs text-slate-500 font-normal truncate">{booking.customer.phone ?? "No phone provided"}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-normal text-slate-700">
                          {booking.startDate ? new Date(booking.startDate).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">
                          {booking.startDate ? new Date(booking.startDate).toLocaleTimeString("en-UG", { hour: "numeric", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <BookingStatusBadge status={toBookingStatus(booking.status)} perspective="staff" />
                    </TableCell>

                    <TableCell className="text-right font-normal">
                      {formatUGX(booking.totalMinor)}
                    </TableCell>

                    <TableCell className="text-right">
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
                    </TableCell>
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
              buildHref={(p) => `/business/bookings?${new URLSearchParams({ ...(activeTab ? { status: activeTab.toLowerCase() } : {}), ...(searchParams.q ? { q: searchParams.q } : {}), page: String(p) }).toString()}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
import { ExportVisibleRows, PortalFilter } from "@/components/portal-tools";
