import { RemoteImage } from "@/components/remote-image";
import Link from "next/link";
import { Star, Clock, Database, Plus, MessageSquare, Download, ArrowRight, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatUGX } from "@/lib/booking";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { OperationsTasks } from "@/components/operations-tasks";
import { ratingSummary } from "@/lib/listings";
import { summarizePayments } from "@/lib/revenue";
import { RevenueOverviewChart } from "@/components/business/revenue-charts";
import { DashboardQuickActions } from "@/components/business/dashboard-quick-actions";
import { VerificationWelcomeModal } from "@/components/business/verification-modals";
import { EmptyState } from "@/components/ui/empty-state";

export default async function BusinessDashboardPage() {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="space-y-6">
        <EmptyState title="No business linked" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [publishedCount, draftCount, awaitingCount, monthPayments, monthPayouts, publishedReviews, recentReviews] = await Promise.all([
    db.listing.count({ where: { businessId, status: "PUBLISHED" } }),
    db.listing.count({ where: { businessId, status: "DRAFT" } }),
    db.booking.count({ where: { businessId, status: "AWAITING_BUSINESS_CONFIRMATION" } }),
    db.booking.findMany({
      where: { businessId },
      select: { id:true,totalMinor:true,
        payments: { where:{completedAt:{gte:startOfMonth}}, include:{refunds:true}, orderBy:{createdAt:"desc"} },
        order: { include:{payments:{where:{completedAt:{gte:startOfMonth}},include:{refunds:true},orderBy:{createdAt:"desc"}}} }
      }
    }),
    db.payout.findMany({
      where: { businessId, createdAt: { gte: startOfMonth }, status: "COMPLETED" },
      select: { amountMinor: true }
    }),
    db.review.findMany({ where: { businessId, status: "PUBLISHED" }, select: { rating: true } }),
    db.review.findMany({
      where: { businessId, status: "PUBLISHED" },
      include: { listing: true, author: { select: { name: true, image: true } } },
      orderBy: { createdAt: "desc" },
      take: 3
    })
  ]);

  const allocationRows = monthPayments.map(booking => {
    const candidates = booking.payments.length ? booking.payments : booking.order?.payments ?? [];
    const payment = candidates.find(p => ["SUCCESSFUL","PARTIALLY_REFUNDED","REFUNDED"].includes(p.status)) ?? candidates[0];
    const refunds = payment?.refunds.filter(r=>r.bookingId===booking.id&&r.status==="COMPLETED") ?? [];
    const refunded = refunds.reduce((sum,r)=>sum+r.amountMinor,0);
    const status = payment && ["REFUNDED","PARTIALLY_REFUNDED"].includes(payment.status) ? refunded>=booking.totalMinor?"REFUNDED":refunded?"PARTIALLY_REFUNDED":"SUCCESSFUL" : payment?.status ?? "NOT_STARTED";
    return { status,amountMinor:booking.totalMinor,refunds,payoutId:payment?.payoutId,payment };
  });
  const { grossMinor, unsettledNetMinor } = summarizePayments(allocationRows);
  const daily = new Map<string,{date:string;gross:number;net:number}>();
  for(const row of allocationRows.filter(r=>["SUCCESSFUL","REFUNDED","PARTIALLY_REFUNDED"].includes(r.status)&&r.payment)){
    const date=(row.payment!.completedAt??row.payment!.createdAt).toISOString().slice(0,10);
    const item=daily.get(date)??{date,gross:0,net:0};
    item.gross+=row.amountMinor;item.net+=Math.round((row.amountMinor-row.refunds.reduce((s,r)=>s+r.amountMinor,0))*0.88);daily.set(date,item);
  }
  const settledMinor = monthPayouts.reduce((sum, p) => sum + p.amountMinor, 0);
  const { average, count } = ratingSummary(publishedReviews);

  const metrics = [
    { label: "Published listings", value: String(publishedCount), detail: `${draftCount} drafts in your workspace`, icon: Database, href: "/business/listings", action: "Manage listings" },
    { label: "Booking requests", value: String(awaitingCount), detail: "Waiting for your response", icon: Clock, href: "/business/bookings", action: "Review requests" },
    { label: "Recorded payouts", value: formatUGX(settledMinor), detail: "Completed records this month", icon: Download, href: "/business/revenue", action: "View earnings" },
    { label: "Guest rating", value: average ? average.toFixed(1) : "—", detail: `${count} published reviews`, icon: Star, href: "/business/reviews", action: "Read reviews" }
  ];
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 lg:space-y-8">
      <VerificationWelcomeModal verificationStatus={business.verificationStatus} />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Your workspace</p>
          <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{business.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">A clear view of your business. A simpler way to manage your day.</p>
        </div>
        <Button asChild className="self-start sm:shrink-0"><Link href="/business/listings/new"><Plus />Create listing</Link></Button>
      </div>
      {business.verificationStatus !== "APPROVED" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <div><p className="text-sm font-medium">Verification: {business.verificationStatus.replaceAll("_", " ").toLowerCase()}</p><p className="mt-1 text-sm text-muted-foreground">Complete verification before publishing listings.</p></div>
          <Button asChild size="sm" variant="outline"><Link href="/business/verification">View application<ArrowRight /></Link></Button>
        </div>
      )}
      <section aria-label="Business performance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => <Card key={metric.label}>
          <CardContent className="flex h-full flex-col p-5">
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{metric.label}</p><metric.icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /></div>
            <p className="mt-4 break-words text-3xl font-semibold tracking-tight tabular-nums">{metric.value}</p>
            <p className="mb-5 mt-1 text-xs leading-relaxed text-muted-foreground">{metric.detail}</p>
            <Link href={metric.href} className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs font-medium text-primary hover:underline">{metric.action}<ArrowRight className="size-3.5" /></Link>
          </CardContent>
        </Card>)}
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <OperationsTasks businessId={businessId} />
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Quick actions</CardTitle><CardDescription>Keep your business moving.</CardDescription></CardHeader><CardContent><DashboardQuickActions verificationStatus={business.verificationStatus} /></CardContent></Card>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>Collections overview</CardTitle><span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">{now.toLocaleDateString("en-GB", {month:"long",year:"numeric",timeZone:"UTC"})}</span></div><CardDescription>Recorded collections and estimated net earnings.</CardDescription></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-10 gap-y-4 border-b pb-5">
              <div><p className="text-xs text-muted-foreground">Gross collections</p><p className="mt-1 text-2xl font-semibold tabular-nums">{formatUGX(grossMinor)}</p></div>
              <div><p className="text-xs text-muted-foreground">Estimated unsettled net</p><p className="mt-1 text-2xl font-semibold tabular-nums">{formatUGX(unsettledNetMinor)}</p></div>
            </div>
            {daily.size ? <RevenueOverviewChart data={[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date))} /> : <div className="my-5 flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 text-center"><Database className="mb-3 size-6 text-muted-foreground" /><p className="text-sm font-medium">Your collections will appear here</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">Completed booking payments will build your monthly overview. No confirmed payment history yet.</p></div>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="max-w-xs text-xs leading-relaxed text-muted-foreground">Demo records are not proof of provider settlement.</p><Button asChild size="sm" variant="ghost"><Link href="/business/revenue">View earnings<ArrowRight /></Link></Button></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div className="flex items-center justify-between gap-2"><CardTitle>Guest feedback</CardTitle><Button asChild size="sm" variant="ghost"><Link href="/business/reviews">View all<ArrowRight /></Link></Button></div><CardDescription>Latest published experiences from your guests.</CardDescription></CardHeader>
          <CardContent>
            {recentReviews.length ? <div className="divide-y">{recentReviews.map(review => <div key={review.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">{review.author.image ? <RemoteImage src={review.author.image} alt="" className="size-full object-cover" /> : <User className="size-4 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium">{review.author.name ?? "Guest"}</p><span className="flex items-center gap-1 text-xs font-medium"><Star aria-hidden="true" className="size-3.5 fill-brand-gold text-brand-gold" />{review.rating}<span className="sr-only">out of 5</span></span></div><p className="mt-1 text-xs text-muted-foreground">{review.createdAt.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"Africa/Kampala"})}</p></div></div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed">{review.body}</p><p className="mt-2 truncate text-xs text-muted-foreground">{review.listing.title}</p>
            </div>)}</div> : <EmptyState title="Your first review is ahead" description="Published guest feedback will appear after completed bookings." />}
            <Link href="/business/reviews" className="mt-5 flex items-center gap-2 border-t pt-4 text-xs font-medium text-primary hover:underline"><MessageSquare className="size-4" />Manage guest feedback<ArrowRight className="ml-auto size-3.5" /></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
