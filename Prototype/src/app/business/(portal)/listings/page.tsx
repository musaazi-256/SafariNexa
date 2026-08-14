import Link from "next/link";
import { redirect } from "next/navigation";
import type { ListingType } from "@prisma/client";
import { 
  List, Hourglass, Eye, Calendar, Utensils, Bed, Tent, Car, 
  MapPin, Filter, ArrowUpDown, Pencil, MoreVertical, Plus 
} from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default async function BusinessListingsPage({ searchParams }: { searchParams: { type?: string; page?: string } }) {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="space-y-6">
        <EmptyState title="No business linked" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const activeType = (searchParams.type?.toUpperCase() as ListingType | undefined) ?? undefined;
  const page = parsePage(searchParams.page);
  const where = { businessId, ...(activeType ? { type: activeType } : {}) };

  // Fetch data
  const [
    listings, 
    totalFilteredCount, 
    typeCountsResult,
    publishedCount,
    draftCount
  ] = await Promise.all([
    db.listing.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.listing.count({ where }),
    db.listing.groupBy({ by: ["type"], _count: { type: true }, where: { businessId } }),
    db.listing.count({ where: { businessId, status: "PUBLISHED" } }),
    db.listing.count({ where: { businessId, status: "DRAFT" } })
  ]);

  // Aggregate counts per type
  const typeCounts = typeCountsResult.reduce((acc, curr) => {
    acc[curr.type] = curr._count.type;
    return acc;
  }, {} as Record<string, number>);

  const totalListingsCount = publishedCount + draftCount;

  // Tabs structure
  const TABS = [
    { value: "ALL", label: "All listings", count: totalListingsCount },
    { value: "RESTAURANT", label: "Restaurants", count: typeCounts["RESTAURANT"] || 0 },
    { value: "TOUR", label: "Experiences", count: typeCounts["TOUR"] || 0 },
    { value: "TRANSPORT", label: "Transport", count: typeCounts["TRANSPORT"] || 0 },
    { value: "ACCOMMODATION", label: "Accommodation", count: typeCounts["ACCOMMODATION"] || 0 }
  ];

  async function setListingStatus(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/business/auth/sign-in");

    const listingId = String(formData.get("listingId"));
    const status = String(formData.get("status")) as "PUBLISHED" | "DRAFT" | "DELETED";

    const listing = await db.listing.findUnique({ where: { id: listingId }, include: { business: true } });
    if (!listing || !activeSession.user.businessIds.includes(listing.businessId)) throw new Error("Listing not found.");
    if (status === "PUBLISHED" && listing.business.verificationStatus !== "APPROVED") {
      throw new Error("This business isn't verified yet — publishing is blocked until approval.");
    }

    if (status === "DELETED") {
      // In reality we might just archive or soft delete
      await db.listing.update({ where: { id: listing.id }, data: { status: "ARCHIVED" } });
    } else {
      await db.listing.update({
        where: { id: listing.id },
        data: { status, publishedAt: status === "PUBLISHED" ? new Date() : listing.publishedAt }
      });
    }

    redirect("/business/listings");
  }

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "RESTAURANT": return <Utensils className="h-4 w-4 shrink-0 text-slate-500" />;
      case "ACCOMMODATION": return <Bed className="h-4 w-4 shrink-0 text-slate-500" />;
      case "TOUR": return <Tent className="h-4 w-4 shrink-0 text-slate-500" />;
      case "TRANSPORT": return <Car className="h-4 w-4 shrink-0 text-slate-500" />;
      default: return null;
    }
  };

  const getRelativeDate = (date: Date) => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference === 0) return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (daysDifference === -1) return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalPages = totalPagesFor(totalFilteredCount);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B4928] mb-1">BUSINESS PORTAL</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Listings</h1>
          <p className="text-sm text-slate-500">Create and manage your service offerings.</p>
        </div>
        <Button asChild className="bg-[#0B4928] hover:bg-[#0B4928]/90 text-white rounded-md h-10 px-5 font-semibold shrink-0">
          <Link href="/business/listings/new"><Plus className="h-4 w-4 mr-2" /> Create listing</Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Listings */}
        <Card className="rounded-2xl shadow-sm border-slate-100 flex flex-col justify-between">
          <CardContent className="pt-6 pb-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500">Total listings</p>
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <List className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{totalListingsCount}</p>
            <div className="mt-auto pt-4 flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-500">Published</span>
              <span className="text-[#0B4928]">{publishedCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Unpublished */}
        <Card className="rounded-2xl shadow-sm border-slate-100 flex flex-col justify-between">
          <CardContent className="pt-6 pb-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500">Unpublished</p>
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                <Hourglass className="h-4 w-4 text-orange-500" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{draftCount}</p>
            <div className="mt-auto pt-4 flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-500">Draft</span>
              <span className="text-orange-500">{draftCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Views this month */}
        <Card className="rounded-2xl shadow-sm border-slate-100 flex flex-col justify-between">
          <CardContent className="pt-6 pb-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500">Views this month</p>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">1,245</p>
            <div className="mt-auto pt-4 flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#0B4928]">↑ 18.6%</span>
              <span className="text-xs text-slate-500 font-medium">vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Bookings this month */}
        <Card className="rounded-2xl shadow-sm border-slate-100 flex flex-col justify-between">
          <CardContent className="pt-6 pb-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500">Bookings this month</p>
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-500" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">124</p>
            <div className="mt-auto pt-4 flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#0B4928]">↑ 22.4%</span>
              <span className="text-xs text-slate-500 font-medium">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4 mt-8">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const isActive = tab.value === "ALL" ? !activeType : activeType === tab.value;
            const href = tab.value === "ALL" ? "/business/listings" : `/business/listings?type=${tab.value.toLowerCase()}`;
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
                  "flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>
        
        <Button variant="outline" className="border-slate-200 text-slate-700 font-semibold h-10 w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" /> Filters
        </Button>
      </div>

      {/* Main Table */}
      {listings.length === 0 ? (
        <EmptyState title="No listings found" description="You don't have any listings in this category yet." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-slate-600 h-12">
                  <div className="flex items-center gap-2">Listing <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" /></div>
                </TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">
                  <div className="flex items-center gap-2">Type <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" /></div>
                </TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">
                  <div className="flex items-center gap-2">Location <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" /></div>
                </TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">
                  <div className="flex items-center gap-2">Price <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" /></div>
                </TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">
                  <div className="flex items-center gap-2">Status <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" /></div>
                </TableHead>
                <TableHead className="font-semibold text-slate-600 h-12">
                  <div className="flex items-center gap-2">Updated <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" /></div>
                </TableHead>
                <TableHead className="font-semibold text-slate-600 h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id} className="border-b border-slate-100 hover:bg-slate-50/50 group">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 overflow-hidden shadow-sm border border-slate-200/60">
                        {listing.coverImageUrl ? (
                          <img src={listing.coverImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-slate-100" />
                        )}
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <p className="font-bold text-slate-900 truncate">{listing.title}</p>
                        <p className="text-xs text-slate-500 font-medium">
                          {listing.type.substring(0,3).toUpperCase()}-{listing.id.slice(-4).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium text-slate-700 capitalize">
                      {getTypeIcon(listing.type)}
                      {listing.type.toLowerCase()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
                      {listing.city ?? "—"}
                    </div>
                  </TableCell>
                  
                  <TableCell className="font-medium text-slate-900">
                    {formatUGX(listing.basePriceMinor)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 font-bold text-[11px] tracking-wider uppercase">
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        listing.status === "PUBLISHED" ? "bg-[#0B4928]" : 
                        listing.status === "DRAFT" ? "bg-orange-500" : "bg-slate-400"
                      )} />
                      <span className={
                        listing.status === "PUBLISHED" ? "text-[#0B4928]" : 
                        listing.status === "DRAFT" ? "text-orange-600" : "text-slate-500"
                      }>
                        {listing.status}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm font-medium text-slate-600">
                    {getRelativeDate(listing.updatedAt)}
                  </TableCell>

                  <TableCell className="text-right py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline" className="h-8 font-semibold text-slate-700 bg-white">
                        <Link href={`/business/listings/${listing.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5 mr-2 text-slate-400" /> Edit
                        </Link>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 font-medium text-sm">
                          {listing.status === "PUBLISHED" ? (
                            <form action={setListingStatus}>
                              <input type="hidden" name="listingId" value={listing.id} />
                              <input type="hidden" name="status" value="DRAFT" />
                              <DropdownMenuItem asChild>
                                <button type="submit" className="w-full cursor-pointer">Unpublish</button>
                              </DropdownMenuItem>
                            </form>
                          ) : (
                            <form action={setListingStatus}>
                              <input type="hidden" name="listingId" value={listing.id} />
                              <input type="hidden" name="status" value="PUBLISHED" />
                              <DropdownMenuItem asChild>
                                <button type="submit" className="w-full cursor-pointer text-[#0B4928]" disabled={business.verificationStatus !== "APPROVED"}>
                                  Publish
                                </button>
                              </DropdownMenuItem>
                            </form>
                          )}
                          <form action={setListingStatus}>
                            <input type="hidden" name="listingId" value={listing.id} />
                            <input type="hidden" name="status" value="DELETED" />
                            <DropdownMenuItem asChild>
                              <button type="submit" className="w-full cursor-pointer text-red-600">Archive</button>
                            </DropdownMenuItem>
                          </form>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-slate-200 bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-500">
                Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalFilteredCount)} of {totalFilteredCount} listings
              </p>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-500">10 per page</span>
                  <div className="border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-400">v</div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Link 
                    href={`/business/listings?${new URLSearchParams({ ...(activeType ? { type: activeType.toLowerCase() } : {}), page: String(Math.max(1, page - 1)) }).toString()}`}
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"
                  >
                    &lt;
                  </Link>
                  <span className="h-8 w-8 flex items-center justify-center rounded-full bg-[#0B4928] text-white font-bold text-sm shadow-sm">
                    {page}
                  </span>
                  {page < totalPages && (
                    <Link 
                      href={`/business/listings?${new URLSearchParams({ ...(activeType ? { type: activeType.toLowerCase() } : {}), page: String(page + 1) }).toString()}`}
                      className="h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                    >
                      {page + 1}
                    </Link>
                  )}
                  <Link 
                    href={`/business/listings?${new URLSearchParams({ ...(activeType ? { type: activeType.toLowerCase() } : {}), page: String(Math.min(totalPages, page + 1)) }).toString()}`}
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
