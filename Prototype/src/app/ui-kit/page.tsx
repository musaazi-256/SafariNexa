import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PhoneInputReadOnly } from "@/components/examples/c-phone-input-8";
import { ProgressWithStatus } from "@/components/examples/c-progress-4";
import { SetupProgress } from "@/components/examples/c-progress-7";
import { RatingSummary } from "@/components/examples/c-rating-6";
import { EmojiRating } from "@/components/examples/c-rating-8";
import { WriteReviewCard } from "@/components/examples/c-rating-9";
import { DescribedSelect } from "@/components/examples/c-select-6";
import { SearchWithSelect } from "@/components/examples/c-select-13";
import { SpinnerBadges } from "@/components/examples/c-spinner-3";
import { LoadingEmptyState } from "@/components/examples/c-spinner-5";
import { CheckoutStepper } from "@/components/examples/c-stepper-7";
import { TeamTable } from "@/components/examples/c-table-6";
import { ChatMessages } from "@/components/examples/chat-messages";
import { CheckboxFields } from "@/components/examples/checkbox-fields";
import { ReportProblemForm } from "@/components/examples/report-form";
import { SkeletonRow } from "@/components/examples/skeleton-demo";
import { ToastDemo } from "@/components/examples/toast-demo";
import { Toaster } from "@/components/ui/toast";
import { isDemoMode } from "@/lib/dev-mode";

export const metadata: Metadata = { title: "UI kit · SafariNexa", robots: { index: false } };

const SECTIONS: Array<[string, string, React.ReactNode]> = [
  ["Phone input", "ReUI c-phone-input-8 · ui/phone-input", <PhoneInputReadOnly key="a" />],
  ["Progress with status", "ReUI c-progress-4 · ui/progress", <ProgressWithStatus key="b" />],
  ["Multi-step progress", "ReUI c-progress-7 · ui/progress", <SetupProgress key="c" />],
  ["Rating summary", "ReUI c-rating-6 · ui/star-rating", <RatingSummary key="d" />],
  ["Emoji rating", "ReUI c-rating-8", <EmojiRating key="e" />],
  ["Write a review", "ReUI c-rating-9 · ui/star-rating", <WriteReviewCard key="f" />],
  ["Described select", "ReUI c-select-6 · ui/item + ui/select", <DescribedSelect key="g" />],
  ["Select with input", "ReUI c-select-13", <SearchWithSelect key="h" />],
  ["Spinners in badges", "ReUI c-spinner-3 · ui/spinner", <SpinnerBadges key="i" />],
  ["Loading empty state", "ReUI c-spinner-5 · ui/empty", <LoadingEmptyState key="j" />],
  ["Stepper", "ReUI c-stepper-7 · ui/stepper", <CheckoutStepper key="k" />],
  ["Team table", "ReUI c-table-6 · ui/frame", <TeamTable key="l" />],
  ["Checkbox fields", "shadcn checkbox + ui/field", <CheckboxFields key="m" />],
  ["Chat messages", "shadcn ui/message + ui/bubble + ui/marker", <ChatMessages key="n" />],
  ["Skeleton", "shadcn ui/skeleton", <SkeletonRow key="o" />],
  ["Toast", "ui/toast (toast.add / toast.close)", <ToastDemo key="p" />],
  ["Form layout", "ui/field + ui/input-group, native validation", <ReportProblemForm key="q" />]
];

/** Component library preview (demo mode only). Not linked from the product. */
export default function UiKitPage() {
  if (!isDemoMode()) notFound();
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Design system</p>
        <h1 className="type-page">UI kit</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">ReUI and shadcn components adapted to SafariNexa (Tailwind 3, Radix, brand tokens). Source: <code>src/components/ui</code> and <code>src/components/examples</code>.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {SECTIONS.map(([title, source, node]) => (
          <section key={title} className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div><h2 className="text-base font-semibold">{title}</h2><p className="font-mono text-xs text-muted-foreground">{source}</p></div>
            <div className="flex flex-1 items-center justify-center">{node}</div>
          </section>
        ))}
      </div>
      <Toaster />
    </main>
  );
}
