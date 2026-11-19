import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, ExternalLink, History, Star } from "lucide-react";

import { ListingPreview, type PreviewListing } from "@/components/business/listing-preview";
import { ListingSubmissionContent } from "@/components/listing-submission-content";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListingStatusBadge, ListingSubmissionStatusBadge } from "@/components/ui/status-badge";
import { requireAdminSession } from "@/lib/admin";
import { formatUGX } from "@/lib/booking";
import { publicListingHref } from "@/lib/business-getting-started";
import { db } from "@/lib/db";
import { listingSnapshot, reviewInclude } from "@/lib/listing-review";
import { ratingSummary } from "@/lib/listings";

const fmt = (d?: Date | null) => d ? d.toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "Africa/Kampala" }) : "—";

export default async function AdminBusinessListingPage({ params }: { params: { id: string; listingId: string } }) {
  await requireAdminSession();
  const listing = await db.listing.findUnique({
    where: { id: params.listingId },
    include: {
      ...reviewInclude,
      business: { select: { id: true, name: true } },
      submissions: { orderBy: { submittedAt: "desc" } },
      reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
      bookings: { select: { status: true, totalMinor: true } }
    }
  });
  if (!listing || listing.businessId !== params.id) notFound();

  const { average, count } = ratingSummary(listing.reviews);
  const confirmed = listing.bookings.filter((b) => ["CONFIRMED", "COMPLETED", "REVIEW_PENDING", "REVIEWED"].includes(b.status));
  const pending = listing.submissions.find((s) => ["SUBMITTED", "UNDER_REVIEW"].includes(s.status));
  const { submissions, reviews, bookings, business, ...content } = listing;
  void reviews; void bookings;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      <Button asChild variant="ghost" size="sm" className="-ml-3"><Link href={`/admin/businesses/${business.id}`}><ArrowLeft />Back to {business.name}</Link></Button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHero variant="portal" eyebrow={`${business.name} · ${listing.type.toLowerCase()}`} title={listing.title} description="The listing's current saved content, review history and booking activity." />
        <div className="flex flex-wrap items-center gap-2">
          <ListingStatusBadge status={listing.status} />
          <ListingSubmissionStatusBadge status={submissions[0]?.status ?? "NOT_SUBMITTED"} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {pending && <Button asChild><Link href={`/admin/listings/${pending.id}`}>Review pending submission</Link></Button>}
        {listing.status === "PUBLISHED" && <Button asChild variant="outline"><a href={publicListingHref(listing)} target="_blank" rel="noreferrer">Open public page<ExternalLink /></a></Button>}
      </div>

      <StatGrid>
        <StatCard compact label="Base price" value={formatUGX(listing.basePriceMinor)} description={listing.accommodation ? `${listing.accommodation.roomTypes.length} room types` : "Per booking unit"} />
        <StatCard compact label="Confirmed bookings" value={confirmed.length} icon={CalendarCheck} description={`${formatUGX(confirmed.reduce((s, b) => s + b.totalMinor, 0))} booking value`} />
        <StatCard compact label="Rating" value={average ? average.toFixed(1) : "—"} icon={Star} description={`${count} published ${count === 1 ? "review" : "reviews"}`} />
        <StatCard compact label="Published" value={fmt(listing.publishedAt)} description={`Last updated ${fmt(listing.updatedAt)}`} />
      </StatGrid>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0">
          <Tabs defaultValue="preview">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle>Listing content</CardTitle>
              <TabsList aria-label="Content view">
                <TabsTrigger value="preview">As travellers see it</TabsTrigger>
                <TabsTrigger value="fields">All fields</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="preview" className="mt-0"><ListingPreview narrow listing={content as unknown as PreviewListing} businessName={business.name} ratingText={average ? `${average.toFixed(1)} from ${count} ${count === 1 ? "review" : "reviews"}` : "No reviews yet"} /></TabsContent>
              <TabsContent value="fields" className="mt-0"><ListingSubmissionContent value={listingSnapshot(content as unknown as Record<string, unknown>)} /></TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <aside className="min-w-0">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-primary" />Review history</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {submissions.length === 0 && <p className="text-sm text-muted-foreground">Never submitted for approval.</p>}
              {submissions.map((s) => (
                <Link key={s.id} href={`/admin/listings/${s.id}`} className="block rounded-xl border border-border p-3 text-sm hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">Submitted {fmt(s.submittedAt)}</span><ListingSubmissionStatusBadge status={s.status} /></div>
                  {s.notes && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-muted-foreground">{s.notes}</p>}
                </Link>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
