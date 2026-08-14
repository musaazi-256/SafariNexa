import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { formatUGX } from "@/lib/booking";
import { requireAdminSession } from "@/lib/admin";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { toBookingStatus } from "@/lib/status";
import { cn } from "@/lib/utils";

const STATUS_GROUPS: Record<string, string[]> = {
  AWAITING_BUSINESS_CONFIRMATION: ["AWAITING_BUSINESS_CONFIRMATION"],
  CONFIRMED: ["CONFIRMED"],
  COMPLETED: ["COMPLETED", "REVIEW_PENDING", "REVIEWED"],
  CANCELLED: ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN"]
};

const TABS = [
  { value: "ALL", label: "All" },
  { value: "AWAITING_BUSINESS_CONFIRMATION", label: "Awaiting confirmation" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" }
];

export default async function AdminBookingsPage({ searchParams }: { searchParams: { status?: string; page?: string } }) {
  await requireAdminSession();

  const activeTab = searchParams.status?.toUpperCase();
  const page = parsePage(searchParams.page);
  const where = activeTab && STATUS_GROUPS[activeTab] ? { status: { in: STATUS_GROUPS[activeTab] } } : undefined;

  const [bookings, totalCount] = await Promise.all([
    db.booking.findMany({
      where: where as never,
      include: { listing: true, business: true, customer: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.booking.count({ where: where as never })
  ]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e613c] mb-1">ADMIN PORTAL</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Bookings oversight</h1>
        <p className="text-[13px] text-slate-500 font-semibold max-w-2xl">Monitor bookings across every business on the platform.</p>
      </div>

      {/* Pill Filters */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.value === "ALL" ? !activeTab : activeTab === tab.value;
          const href = tab.value === "ALL" ? "/admin/bookings" : `/admin/bookings?status=${tab.value.toLowerCase()}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "rounded-full border px-4 py-1.5 text-[13px] font-bold transition-all",
                isActive 
                  ? "border-[#1e613c] bg-[#1e613c] text-white shadow-sm" 
                  : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Table Container */}
      {bookings.length === 0 ? (
        <EmptyState title="No bookings here" description="Nothing matches this filter right now." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-6 py-3 items-center">
            <div className="col-span-2 flex items-center gap-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Reference
            </div>
            <div className="col-span-3 flex items-center gap-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Listing
            </div>
            <div className="col-span-2 flex items-center gap-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Business
            </div>
            <div className="col-span-2 flex items-center gap-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Customer
            </div>
            <div className="col-span-2 flex items-center gap-1 text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Status
            </div>
            <div className="col-span-1 text-right text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              Total
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <div key={booking.id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-slate-50/50 transition-colors">
                
                {/* Reference */}
                <div className="col-span-2 font-bold text-[13px] text-slate-900 truncate pr-4">
                  {booking.bookingRef}
                </div>
                
                {/* Listing */}
                <div className="col-span-3 text-[13px] font-semibold text-slate-600 truncate pr-4">
                  {booking.listing.title}
                </div>
                
                {/* Business */}
                <div className="col-span-2 text-[13px] font-semibold text-slate-600 truncate pr-4">
                  {booking.business.name}
                </div>

                {/* Customer */}
                <div className="col-span-2 text-[13px] font-semibold text-slate-600 truncate pr-4">
                  {booking.customer.name ?? booking.customer.email}
                </div>
                
                {/* Status */}
                <div className="col-span-2 flex items-center">
                  <BookingStatusBadge status={toBookingStatus(booking.status)} />
                </div>
                
                {/* Total */}
                <div className="col-span-1 text-[13px] font-bold text-slate-900 text-right whitespace-nowrap">
                  {formatUGX(booking.totalMinor)}
                </div>

              </div>
            ))}
          </div>

          {/* Pagination Footer */}
          <div className="border-t border-slate-200 bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">
              Showing {bookings.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} bookings
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPagesFor(totalCount)}
              buildHref={(p) =>
                `/admin/bookings?${new URLSearchParams({ ...(activeTab ? { status: activeTab.toLowerCase() } : {}), page: String(p) }).toString()}`
              }
            />
          </div>

        </div>
      )}
    </div>
  );
}
