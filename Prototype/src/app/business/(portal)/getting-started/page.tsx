import Link from "next/link";
import { LifeBuoy, PartyPopper } from "lucide-react";

import { GettingStartedGuide, gettingStartedProgress } from "@/components/business/getting-started";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { requireBusinessSession } from "@/lib/business";
import { gettingStartedSteps } from "@/lib/business-getting-started";

export const metadata = { title: "Getting started - SafariNexa Business" };

export default async function GettingStartedPage() {
  const { businessId, business } = await requireBusinessSession();
  if (!business || !businessId) return <EmptyState title="No business linked" description="Your account isn't attached to a business yet." />;

  const steps = await gettingStartedSteps(businessId);
  const { done, total, pct, next } = gettingStartedProgress(steps);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <PageHero variant="portal" eyebrow="Setup guide" title="Getting started" description={`Follow these steps to get ${business.name} verified and taking bookings on SafariNexa. Each step updates as you go.`} />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <Progress value={pct}>
          <ProgressLabel>{done} of {total} steps done</ProgressLabel>
          <ProgressValue />
        </Progress>
        {next ? (
          <p className="mt-3 text-sm text-muted-foreground">Up next: <span className="font-medium text-foreground">{next.title}</span></p>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-success"><PartyPopper className="h-4 w-4" />You&apos;re all set up. Your listings are live.</p>
        )}
      </section>

      <GettingStartedGuide steps={steps} />

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary"><LifeBuoy className="h-5 w-5 text-muted-foreground" /></span>
          <div>
            <h2 className="text-sm font-semibold">Stuck on a step?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Our support team can help with documents, listings and payments.</p>
          </div>
        </div>
        <Button asChild variant="outline"><Link href="/business/support?new=1">Contact support</Link></Button>
      </section>
    </div>
  );
}
