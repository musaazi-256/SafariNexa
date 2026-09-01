import Link from "next/link";
import { Download, Calendar, Hourglass, Check, CalendarCheck, X, Banknote, Filter, Search, MoreVertical, ArrowUpDown } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const STATUS_GROUPS: Record<string, string[]> = {
  AWAITING_BUSINESS_CONFIRMATION: ["AWAITING_BUSINESS_CONFIRMATION"],
  CONFIRMED: ["CONFIRMED"],
  COMPLETED: ["COMPLETED", "REVIEW_PENDING", "REVIEWED"],
  CANCELLED: ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN"]
};

export default async function BusinessBookingsPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
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
  const where = { businessId, ...(activeTab && STATUS_GROUPS[activeTab] ? { status: { in: STATUS_GROUPS[activeTab] } } : {}) };

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
  const allCount = awaitingCount + confirmedCount + completedCount + cancelledCount;
  
  const totalRevenue = revenueResult._sum.totalMinor || 0;

  const TABS = [
    { value: "ALL", label: "All", count: allCount },
    { value: "AWAITING_BUSINESS_CONFIRMATION", label: "Awaiting confirmation", count: awaitingCount },
    { value: "CONFIRMED", label: "Confirmed", count: confirmedCount },
    { value: "COMPLETED", label: "Completed", count: completedCount },
    { value: "CANCELLED", label: "Cancelled", count: cancelledCount }
  ];

  const totalPages = totalPagesFor(totalFilteredCount);

  // Status mapping for dot badges
  const getStatusDisplay = (status: string) => {
    if (STATUS_GROUPS.AWAITING_BUSINESS_CONFIRMATION.includes(status)) return { text: "Awaiting confirmation", dot: "bg-orange-500", bg: "bg-orange-50", textCol: "text-orange-600" };
    if (STATUS_GROUPS.CONFIRMED.includes(status)) return { text: "Confirmed", dot: "bg-green-500", bg: "bg-green-50", textCol: "text-green-700" };
    if (STATUS_GROUPS.COMPLETED.includes(status)) return { text: "Completed", dot: "bg-purple-500", bg: "bg-purple-50", textCol: "text-purple-700" };
    if (STATUS_GROUPS.CANCELLED.includes(status)) return { text: "Cancelled", dot: "bg-red-500", bg: "bg-red-50", textCol: "text-red-700" };
    
    // Some extra statuses based on design (e.g. refunded, payment failed, payment required)
    if (status === "REFUNDED") return { text: "Refunded", dot: "bg-green-500", bg: "bg-green-50", textCol: "text-green-700" };
    if (status === "PAYMENT_FAILED") return { text: "Payment failed", dot: "bg-red-500", bg: "bg-red-50", textCol: "text-red-700" };
    if (status === "PAYMENT_REQUIRED") return { text: "Payment required", dot: "bg-orange-500", bg: "bg-orange-50", textCol: "text-orange-600" };
    
    return { text: status, dot: "bg-slate-500", bg: "bg-slate-100", textCol: "text-slate-700" };
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B4928] mb-1">BUSINESS PORTAL</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Bookings</h1>
          <p className="text-sm text-slate-500">Handle booking requests and confirmations.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" className="font-semibold text-slate-700 border-slate-200">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button className="bg-[#0B4928] hover:bg-[#0B4928]/90 text-white font-semibold shadow-sm">
            <Calendar className="h-4 w-4 mr-2" /> Calendar view
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex flex-col items-center justify-center shrink-0">
                <Hourglass className="h-5 w-5 text-orange-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 truncate">Awaiting confirmation</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{awaitingCount}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer">
              <span>Requests pending</span>
              <span>&gt;</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex flex-col items-center justify-center shrink-0">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 truncate">Confirmed</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{confirmedCount}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer">
              <span>Bookings confirmed</span>
              <span>&gt;</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex flex-col items-center justify-center shrink-0">
                <CalendarCheck className="h-5 w-5 text-purple-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 truncate">Completed</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{completedCount}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer">
              <span>Bookings completed</span>
              <span>&gt;</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex flex-col items-center justify-center shrink-0">
                <X className="h-5 w-5 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 truncate">Cancelled</p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{cancelledCount}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer">
              <span>Bookings cancelled</span>
              <span>&gt;</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-100">
          <CardContent className="p-5 flex flex-col h-full justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex flex-col items-center justify-center shrink-0">
                <Banknote className="h-5 w-5 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-500 truncate">Total revenue</p>
                <p className="text-xl font-extrabold text-slate-900 mt-2 truncate">
                  {formatUGX(totalRevenue)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer">
              <span>From all bookings</span>
              <span>&gt;</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4 mt-8">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const isActive = tab.value === "ALL" ? !activeTab : activeTab === tab.value;
            const href = tab.value === "ALL" ? "/business/bookings" : `/business/bookings?status=${tab.value.toLowerCase()}`;
            return (
              <Link
                key={tab.value}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  isActive 
                    ? "bg-[#0B4928] text-white border-transparent" 
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {tab.label}
                <span className={cn(
                  "flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Button variant="outline" className="border-slate-200 text-slate-700 font-semibold h-10">
            <Filter className="h-4 w-4 mr-2" /> Filters
          </Button>
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search bookings..." className="pl-9 h-10 bg-slate-50/50 border-slate-200" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      {bookings.length === 0 ? (
        <EmptyState title="No bookings found" description="You don't have any bookings in this category yet." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-slate-600 h-12 w-[120px]">Reference</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12 w-[350px]">Listing</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Customer</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">
                  <div className="flex items-center gap-2">Date <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" /></div>
                </TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">Status</TableHead>
                <TableHead className="font-semibold text-slate-600 h-12 text-right">
                  <div className="flex items-center justify-end gap-2">Total <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" /></div>
                </TableHead>
                <TableHead className="font-semibold text-slate-600 h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const statusInfo = getStatusDisplay(booking.status);
                
                return (
                  <TableRow key={booking.id} className="border-b border-slate-100 hover:bg-slate-50/50 group">
                    <TableCell className="font-bold text-slate-900 py-4">
                      {booking.bookingRef}
                    </TableCell>
                    
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 overflow-hidden shadow-sm border border-slate-200/60">
                          {booking.listing.coverImageUrl ? (
                            <img src={booking.listing.coverImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-slate-100" />
                          )}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <p className="font-bold text-slate-900 truncate">{booking.listing.title}</p>
                          <p className="text-xs text-slate-500 font-medium truncate">{booking.bookingRef}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 truncate">{booking.customer.name ?? booking.customer.email}</span>
                        <span className="text-xs text-slate-500 font-medium truncate">{booking.customer.phone ?? "No phone provided"}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">
                          {booking.startDate ? new Date(booking.startDate).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {booking.startDate ? new Date(booking.startDate).toLocaleTimeString("en-UG", { hour: "numeric", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold", statusInfo.bg, statusInfo.textCol)}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", statusInfo.dot)} />
                        {statusInfo.text}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-bold text-slate-900">
                      {formatUGX(booking.totalMinor)}
                    </TableCell>

                    <TableCell className="text-right py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 text-slate-400 border-slate-200 ml-auto">
                            <MoreVertical className="h-4 w-4 text-slate-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 font-medium text-sm">
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
          {totalPages > 1 && (
            <div className="border-t border-slate-200 bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-500">
                Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalFilteredCount)} of {totalFilteredCount} bookings
              </p>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-500">10 per page</span>
                  <div className="border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-400">v</div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Link 
                    href={`/business/bookings?${new URLSearchParams({ ...(activeTab ? { status: activeTab.toLowerCase() } : {}), page: String(Math.max(1, page - 1)) }).toString()}`}
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"
                  >
                    &lt;
                  </Link>
                  <span className="h-8 w-8 flex items-center justify-center rounded-full bg-[#0B4928] text-white font-bold text-sm shadow-sm">
                    {page}
                  </span>
                  {page < totalPages && (
                    <Link 
                      href={`/business/bookings?${new URLSearchParams({ ...(activeTab ? { status: activeTab.toLowerCase() } : {}), page: String(page + 1) }).toString()}`}
                      className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                    >
                      {page + 1}
                    </Link>
                  )}
                  <Link 
                    href={`/business/bookings?${new URLSearchParams({ ...(activeTab ? { status: activeTab.toLowerCase() } : {}), page: String(Math.min(totalPages, page + 1)) }).toString()}`}
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"
                  >
                    &gt;
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
