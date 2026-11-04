import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { ListingStatusBadge, ListingSubmissionStatusBadge } from "@/components/ui/status-badge";
import { RemoteImage } from "@/components/remote-image";
import Link from "next/link";
import { submitListing } from "@/lib/actions/listing-review";
import { redirect } from "next/navigation";
import type { ListingType } from "@prisma/client";
import { 
  Archive, List, Hourglass, Eye, Calendar, Utensils, Bed, Tent, Car,
  MapPin, Filter, ArrowUpDown, Pencil, MoreVertical, Plus 
} from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHero } from "@/components/page-hero";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export default async function BusinessListingsPage({ searchParams }: { searchParams: { type?: string; page?: string; q?: string } }) {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="space-y-6">
        <EmptyState title="No business linked" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const requestedType = searchParams.type?.toUpperCase();
  const activeType = requestedType && ["ACCOMMODATION", "TOUR", "RESTAURANT", "TRANSPORT"].includes(requestedType) ? requestedType as ListingType : undefined;
  const page = parsePage(searchParams.page);
  const where = { ...(searchParams.q ? { title: { contains: searchParams.q.trim(), mode: "insensitive" as const } } : {}), businessId, ...(activeType ? { type: activeType } : {}) };

  // Fetch data
  const [
    listings, 
    totalFilteredCount, 
    typeCountsResult,
    publishedCount,
    draftCount
  ] = await Promise.all([
    db.listing.findMany({ where, include: {submissions: {orderBy: {submittedAt: "desc"}, take: 1}}, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
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

  const totalListingsCount = typeCountsResult.reduce((sum,row)=>sum+row._count.type,0);
  const archivedCount = totalListingsCount - publishedCount - draftCount;
  const monthStart = new Date();monthStart.setUTCDate(1);monthStart.setUTCHours(0,0,0,0);
  const monthBookings = await db.booking.count({where:{businessId,createdAt:{gte:monthStart}}});

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

    if (!["PUBLISHED","DRAFT","DELETED"].includes(status)) throw new Error("Invalid listing status.");
    if (status === "PUBLISHED") throw new Error("Submit the listing for admin review instead. Only an admin can approve publication.");
    const listing = await db.listing.findUnique({ where: { id: listingId }, include: { business: true } });
    if (!listing || !activeSession.user.businessIds.includes(listing.businessId)) throw new Error("Listing not found.");
    if (!await db.businessUser.findFirst({where:{businessId:listing.businessId,userId:activeSession.user.id,role:{in:["OWNER","MANAGER"]}}})) throw new Error("Only owners and managers can change publication status.");

    if (status === "DELETED") {
      // In reality we might just archive or soft delete
      await db.listing.update({ where: { id: listing.id }, data: { status: "ARCHIVED" } });
    } else {
      await db.listing.update({
        where: { id: listing.id },
        data: { status }
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
        <PageHero
          variant="portal"
          eyebrow="Business portal"
          title="Listings"
          description="Create and manage your service offerings."
        />
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md h-10 px-5 font-medium shrink-0">
          <Link href="/business/listings/new"><Plus className="h-4 w-4 mr-2" /> Create listing</Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <StatGrid>
        <StatCard label="Total listings" value={totalListingsCount} description={String(publishedCount)+" currently published"} icon={List} />
        <StatCard label="Draft listings" value={draftCount} description="Not published; may include submitted drafts" icon={Hourglass} help="Listings whose publication status is Draft. Review progress is tracked separately in Submission & feedback." />
        <StatCard label="Archived listings" value={archivedCount} description="Archived and unavailable for new bookings" icon={Archive} />
        <StatCard label="Bookings this month" value={monthBookings} description="Bookings created this calendar month" icon={Calendar} href="/business/bookings" actionLabel="View bookings" />
      </StatGrid>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-4 mt-8">
        <FilterTabs
          activeValue={activeType ?? "ALL"}
          tabs={TABS.map((tab) => ({
            value: tab.value,
            label: tab.label,
            count: tab.count,
            href: tab.value === "ALL" ? "/business/listings" : `/business/listings?type=${tab.value.toLowerCase()}`
          }))}
        />

<PortalFilter />
      </div>

      {/* Main Table */}
      {listings.length === 0 ? (
        <EmptyState title="No listings found" description="You don't have any listings in this category yet." />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-2">Listing</div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">Type</div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">Location</div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">Price</div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">Status</div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">Updated</div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 overflow-hidden shadow-sm border border-border/60">
                        {listing.coverImageUrl ? (
                          <RemoteImage src={listing.coverImageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-slate-100" />
                        )}
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <p className="font-normal text-slate-700 truncate">{listing.title}</p>
                        <p className="text-xs text-slate-500 font-normal">
                          {listing.type.substring(0,3).toUpperCase()}-{listing.id.slice(-4).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 font-normal text-slate-700 capitalize">
                      {getTypeIcon(listing.type)}
                      {listing.type.toLowerCase()}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 font-normal text-slate-700">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-500" />
                      {listing.city ?? "—"}
                    </div>
                  </TableCell>
                  
                  <TableCell className="font-normal">
                    {formatUGX(listing.basePriceMinor)}
                  </TableCell>
                  
                  <TableCell>
                    <ListingStatusBadge status={listing.status} />
                    <Link href={`/business/listings/${listing.id}/review`} className="mt-2 block text-xs underline"><ListingSubmissionStatusBadge status={listing.submissions[0]?.status || "NOT_SUBMITTED"} /> <span className="ml-1">Submission & feedback</span></Link>
                  </TableCell>

                  <TableCell className="font-normal">
                    {getRelativeDate(listing.updatedAt)}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline" className="h-8 font-normal text-slate-700 bg-white">
                        <Link href={`/business/listings/${listing.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5 mr-2 text-slate-400" /> Edit
                        </Link>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label="Listing actions" variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 font-normal text-sm">
                          {listing.status === "PUBLISHED" ? (
                            <form action={setListingStatus}>
                              <input type="hidden" name="listingId" value={listing.id} />
                              <input type="hidden" name="status" value="DRAFT" />
                              <DropdownMenuItem asChild>
                                <Button variant="ghost" type="submit" className="w-full cursor-pointer">Unpublish</Button>
                              </DropdownMenuItem>
                            </form>
                          ) : (
                            <form action={submitListing}>
                              <input type="hidden" name="listingId" value={listing.id} />
                              <DropdownMenuItem asChild>
                                <Button variant="ghost" type="submit" className="w-full cursor-pointer text-primary" disabled={business.verificationStatus !== "APPROVED" || listing.status !== "DRAFT" || ["SUBMITTED", "UNDER_REVIEW"].includes(listing.submissions[0]?.status || "")}>
                                  Submit for review
                                </Button>
                              </DropdownMenuItem>
                            </form>
                          )}
                          <DropdownMenuItem asChild><Link href={`/business/listings/${listing.id}/review`}>Submission & feedback</Link></DropdownMenuItem>
                          <form action={setListingStatus}>
                            <input type="hidden" name="listingId" value={listing.id} />
                            <input type="hidden" name="status" value="DELETED" />
                            <DropdownMenuItem asChild>
                              <Button variant="ghost" type="submit" className="w-full cursor-pointer text-red-600">Archive</Button>
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
          <div className="border-t border-border bg-slate-50/30 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalFilteredCount)} of {totalFilteredCount} listings
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              buildHref={(p) => `/business/listings?${new URLSearchParams({ ...(activeType ? { type: activeType.toLowerCase() } : {}), page: String(p) }).toString()}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
import { ExportVisibleRows, PortalFilter } from "@/components/portal-tools";
