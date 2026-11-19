import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, CircleDot, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { GettingStartedStep } from "@/lib/business-getting-started";
import { cn } from "@/lib/utils";

function StepIcon({ state, className }: { state: GettingStartedStep["state"]; className?: string }) {
  if (state === "done") return <CheckCircle2 aria-label="Done" className={cn("h-5 w-5 text-success", className)} />;
  if (state === "in_progress") return <CircleDot aria-label="In progress" className={cn("h-5 w-5 text-warning-foreground", className)} />;
  return <Circle aria-label="To do" className={cn("h-5 w-5 text-muted-foreground", className)} />;
}

export function gettingStartedProgress(steps: GettingStartedStep[]) {
  const done = steps.filter((s) => s.state === "done").length;
  return { done, total: steps.length, pct: Math.round((done / steps.length) * 100), next: steps.find((s) => s.state !== "done") };
}

/** Full step-by-step guide: every step expands to its how-to. */
export function GettingStartedGuide({ steps }: { steps: GettingStartedStep[] }) {
  const { next } = gettingStartedProgress(steps);
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={step.id}>
          <details open={step.id === next?.id} className="group rounded-2xl border border-border bg-card shadow-card">
            <summary className="flex cursor-pointer list-none items-start gap-4 rounded-2xl p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
              <StepIcon state={step.state} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Step {i + 1}</p>
                <h3 className={cn("type-card", step.state === "done" && "text-muted-foreground")}>{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.status}</p>
              </div>
              <ChevronDown aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border px-5 pb-5 pt-4 sm:pl-14">
              <p className="text-sm font-medium">{step.summary}</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                {step.guide.map((line) => <li key={line}>{line}</li>)}
              </ul>
              <Button asChild size="sm" variant={step.state === "done" ? "outline" : "default"} className="mt-4">
                <Link href={step.href}>{step.actionLabel}<ArrowRight /></Link>
              </Button>
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}

/** Dashboard card for businesses that haven't finished setting up. */
export function GettingStartedCard({ steps }: { steps: GettingStartedStep[] }) {
  const { done, total, pct, next } = gettingStartedProgress(steps);
  if (!next) return null;
  return (
    <section aria-labelledby="getting-started-heading" className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="type-eyebrow text-primary">Getting started</p>
            <h2 id="getting-started-heading" className="mt-1 type-card">Finish setting up your business</h2>
          </div>
          <Progress value={pct} className="max-w-md" aria-label={`${done} of ${total} setup steps done`} />
          <p className="text-sm text-muted-foreground">{done} of {total} steps done. Next: <span className="font-medium text-foreground">{next.title}</span>. {next.status}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button asChild><Link href={next.href}>{next.actionLabel}<ArrowRight /></Link></Button>
          <Button asChild variant="outline"><Link href="/business/getting-started">View setup guide</Link></Button>
        </div>
      </div>
    </section>
  );
}
