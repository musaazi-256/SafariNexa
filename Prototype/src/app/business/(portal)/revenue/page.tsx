import { PageHero } from "@/components/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { PLATFORM_COMMISSION_RATE, summarizePayments } from "@/lib/revenue";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Info, TrendingUp, TrendingDown, MoreVertical, Search, Filter, CreditCard, Smartphone } from "lucide-react";
import { RevenueOverviewChart, PayoutBreakdownChart, Sparkline } from "@/components/business/revenue-charts";
import { cn } from "@/lib/utils";

/** A booking's payment can live on the booking directly (single-item checkout) or on its
 * parent Order (cart checkout, possibly spanning other businesses too) — this resolves
 * whichever one actually exists, most-recent first. */
function resolveLatestPayment<T extends { status: string; provider: string; createdAt: Date }>(booking: {
  payments: T[];
  order: { payments: T[] } | null;
}) {
  return booking.payments[0] ?? booking.order?.payments[0] ?? null;
}

export default async function BusinessRevenuePage({ searchParams }: { searchParams: { page?: string } }) {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 pb-20">
        <EmptyState title="No business linked to this account" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const page = parsePage(searchParams.page);
  const where = { businessId };

  const paymentSelect = { status: true, provider: true, createdAt: true } as const;

  const [allBookings, pageBookings, totalCount] = await Promise.all([
    db.booking.findMany({
      where,
      select: {
        totalMinor: true,
        payments: { select: paymentSelect, orderBy: { createdAt: "desc" }, take: 1 },
        order: { select: { payments: { select: paymentSelect, orderBy: { createdAt: "desc" }, take: 1 } } }
      }
    }),
    db.booking.findMany({
      where,
      include: {
        listing: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
        order: { include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } } }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.booking.count({ where })
  ]);

  const { grossMinor, commissionMinor, netMinor, refundedMinor } = summarizePayments(
    allBookings.map((booking) => ({
      status: resolveLatestPayment(booking)?.status ?? "NOT_STARTED",
      amountMinor: booking.totalMinor
    }))
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B4928] mb-1">BUSINESS PORTAL</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Revenue & payouts</h1>
          <p className="text-sm text-slate-500">Track paid bookings, commission, and net payout.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="h-10 border-slate-200 text-slate-700 font-bold">
            <Calendar className="mr-2 h-4 w-4 text-slate-400" />
            1 Aug 2026 – 31 Aug 2026
          </Button>
          <Button variant="outline" className="h-10 border-slate-200 text-slate-700 font-bold">
            <Download className="mr-2 h-4 w-4 text-slate-400" />
            Export
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Gross Revenue */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-700 font-bold text-[10px]">$</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Gross revenue</p>
                <Info className="h-3 w-3 text-slate-300" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatUGX(grossMinor)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                <span className="text-xs font-bold text-green-600">18.3%</span>
                <span className="text-xs font-medium text-slate-400">vs 1 – 31 Jul 2026</span>
              </div>
            </div>
            <Sparkline data={[1, 3, 2, 5, 4, 7, 6]} color="#16a34a" />
          </CardContent>
        </Card>

        {/* Platform Commission */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-[10px]">%</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Platform commission ({Math.round(PLATFORM_COMMISSION_RATE * 100)}%)</p>
                <Info className="h-3 w-3 text-slate-300" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatUGX(commissionMinor)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-bold text-blue-600">18.3%</span>
                <span className="text-xs font-medium text-slate-400">vs 1 – 31 Jul 2026</span>
              </div>
            </div>
            <Sparkline data={[1, 3, 2, 5, 4, 7, 6]} color="#2563eb" />
          </CardContent>
        </Card>

        {/* Net Payout */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <CreditCard className="h-3 w-3 text-purple-600" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Net payout</p>
                <Info className="h-3 w-3 text-slate-300" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatUGX(netMinor)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-xs font-bold text-purple-600">18.3%</span>
                <span className="text-xs font-medium text-slate-400">vs 1 – 31 Jul 2026</span>
              </div>
            </div>
            <Sparkline data={[1, 3, 2, 5, 4, 7, 6]} color="#9333ea" />
          </CardContent>
        </Card>

        {/* Refunded */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-[12px]">↺</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Refunded</p>
                <Info className="h-3 w-3 text-slate-300" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{formatUGX(refundedMinor)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingDown className="h-3.5 w-3.5 text-orange-600" />
                <span className="text-xs font-bold text-orange-600">12.6%</span>
                <span className="text-xs font-medium text-slate-400">vs 1 – 31 Jul 2026</span>
              </div>
            </div>
            <Sparkline data={[6, 5, 3, 4, 2, 3, 1]} color="#ea580c" />
          </CardContent>
        </Card>

      </div>

      {/* Middle Section: Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Overview */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Revenue overview</h2>
              <select className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#16a34a]"></div>
                <span className="text-[11px] font-semibold text-slate-500">Gross revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-[2px] w-3 border-t-[2px] border-dashed border-[#22c55e]"></div>
                <span className="text-[11px] font-semibold text-slate-500">Net payout</span>
              </div>
            </div>
            
            <RevenueOverviewChart />
          </CardContent>
        </Card>

        {/* Payout Breakdown */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-bold text-slate-900">Payout breakdown</h2>
              <Info className="h-3.5 w-3.5 text-slate-300" />
            </div>
            
            <PayoutBreakdownChart netMinor={netMinor} />
            
            <div className="mt-auto space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#16a34a]"></div>
                  <span className="text-xs font-bold text-slate-700">Paid to you</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{formatUGX(5614400)} <span className="text-slate-400 font-medium">(96.2%)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ade80]"></div>
                  <span className="text-xs font-bold text-slate-700">Processing</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{formatUGX(180000)} <span className="text-slate-400 font-medium">(3.1%)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#fde047]"></div>
                  <span className="text-xs font-bold text-slate-700">On hold</span>
                </div>
                <span className="text-xs font-bold text-slate-900">{formatUGX(40000)} <span className="text-slate-400 font-medium">(0.7%)</span></span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Total</span>
                <span className="text-sm font-extrabold text-slate-900">{formatUGX(5834400)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0B4928] text-white text-sm font-bold shadow-sm">
            All transactions <span className="bg-white/20 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">27</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
            Paid <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">18</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
            Refunded <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">2</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
            Pending payout <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">4</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
            Not started <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm text-[10px] font-bold">3</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9 px-3 border-slate-200 text-slate-700 font-bold rounded-lg shadow-sm">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Filters
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="pl-9 pr-4 h-9 w-[220px] rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#0B4928] shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      {pageBookings.length === 0 ? (
        <EmptyState title="No transactions yet" description="Paid bookings will show up here." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-500 h-11 text-xs">Date ↕</TableHead>
                <TableHead className="font-bold text-slate-500 h-11 text-xs">Listing</TableHead>
                <TableHead className="font-bold text-slate-500 h-11 text-xs">Method ↕</TableHead>
                <TableHead className="font-bold text-slate-500 h-11 text-xs">Status</TableHead>
                <TableHead className="font-bold text-slate-500 h-11 text-xs text-right">Gross amount ↕</TableHead>
                <TableHead className="font-bold text-slate-500 h-11 text-xs text-right">Commission (12%) ↕</TableHead>
                <TableHead className="font-bold text-slate-500 h-11 text-xs text-right">Net payout ↕</TableHead>
                <TableHead className="font-bold text-slate-500 h-11 text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageBookings.map((booking) => {
                const payment = resolveLatestPayment(booking);
                const isSuccessful = payment?.status === "SUCCESSFUL";
                const isFailed = payment?.status === "FAILED";
                const commission = Math.round(booking.totalMinor * PLATFORM_COMMISSION_RATE);
                const net = isSuccessful ? booking.totalMinor - commission : 0;
                
                // Determine mock payment display info
                let ProviderIcon = CreditCard;
                let providerName = "Card";
                if (payment?.provider === "MTN_MOBILE_MONEY") {
                  ProviderIcon = Smartphone;
                  providerName = "MTN Mobile Money";
                } else if (payment?.provider === "AIRTEL_MONEY") {
                  ProviderIcon = Smartphone;
                  providerName = "Airtel Money";
                }

                // Determine Status Badge styles
                let dotColor = "bg-yellow-400";
                let badgeBg = "bg-yellow-50";
                let badgeText = "text-yellow-700";
                let statusLabel = "Not started";

                if (isSuccessful) {
                  dotColor = "bg-green-500";
                  badgeBg = "bg-green-50";
                  badgeText = "text-green-700";
                  statusLabel = "Paid";
                } else if (isFailed) {
                  dotColor = "bg-red-500";
                  badgeBg = "bg-red-50";
                  badgeText = "text-red-700";
                  statusLabel = "Failed";
                }
                // (Refunded is a separate state usually, assuming handled similarly for now)
                
                return (
                  <TableRow key={booking.id} className="border-slate-100 group transition-colors hover:bg-slate-50/50">
                    <TableCell className="text-[13px] font-semibold text-slate-700 whitespace-nowrap">
                      {booking.createdAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-slate-200">
                          {booking.listing.coverImageUrl ? (
                            <img src={booking.listing.coverImageUrl} className="h-full w-full object-cover" />
                          ) : <div className="h-full w-full bg-slate-100" />}
                        </div>
                        <div className="flex flex-col max-w-[200px]">
                          <span className="text-[13px] font-bold text-slate-900 truncate">{booking.listing.title}</span>
                          <span className="text-[11px] font-semibold text-slate-400 truncate">{booking.bookingRef}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {payment ? (
                        <div className="flex items-center gap-2">
                          <ProviderIcon className="h-4 w-4 text-slate-400" />
                          <span className="text-[13px] font-bold text-slate-700">{providerName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md", badgeBg)}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                        <span className={cn("text-[11px] font-bold", badgeText)}>{statusLabel}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-bold text-[13px] text-slate-900 whitespace-nowrap">
                      {formatUGX(booking.totalMinor)}
                    </TableCell>
                    
                    <TableCell className="text-right text-[13px] font-medium text-slate-600 whitespace-nowrap">
                      {isSuccessful || isFailed ? formatUGX(commission) : "—"}
                    </TableCell>
                    
                    <TableCell className="text-right text-[13px] font-bold text-slate-900 whitespace-nowrap">
                      {isSuccessful ? formatUGX(net) : "—"}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} transactions
            </span>
            <div className="flex items-center gap-4">
              <select className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1 outline-none shadow-sm">
                <option>10 per page</option>
                <option>25 per page</option>
                <option>50 per page</option>
              </select>
              <Pagination currentPage={page} totalPages={totalPagesFor(totalCount)} buildHref={(p) => `/business/revenue?page=${p}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
