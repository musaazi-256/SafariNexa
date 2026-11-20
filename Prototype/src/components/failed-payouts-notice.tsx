import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { formatUGX } from "@/lib/booking";

type FailedPayout = { id: string; amountMinor: number; notes: string | null; providerReference: string | null; updatedAt: Date; business?: { id: string; name: string } };

/** Payouts the payment provider or bank rejected. The money stays with SafariNexa (shown as
 * "On hold" in the breakdown) until the problem is fixed and the payout is sent again. */
export function FailedPayoutsNotice({ payouts, surface }: { payouts: FailedPayout[]; surface: "BUSINESS" | "ADMIN" }) {
  if (!payouts.length) return null;
  const total = payouts.reduce((sum, p) => sum + p.amountMinor, 0);
  return (
    <section role="alert" aria-labelledby="failed-payouts-title" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 id="failed-payouts-title" className="text-sm font-semibold text-foreground">
              {payouts.length === 1 ? "A payout failed" : `${payouts.length} payouts failed`} · {formatUGX(total)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {surface === "BUSINESS"
                ? "The money hasn't left SafariNexa and is shown as On hold. Contact support with the correct account details so the payout can be sent again."
                : "These payouts were rejected by the provider or bank. The amounts stay on hold until the business fixes the problem and the payout is sent again."}
            </p>
          </div>
          <ul className="space-y-2">
            {payouts.map((p) => (
              <li key={p.id} className="rounded-lg border bg-card p-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{surface === "ADMIN" && p.business ? <Link className="text-primary hover:underline" href={`/admin/businesses/${p.business.id}`}>{p.business.name}</Link> : "Payout"} · {formatUGX(p.amountMinor)}</span>
                  <time className="text-xs text-muted-foreground">{p.updatedAt.toLocaleDateString("en-GB", { timeZone: "Africa/Kampala", day: "numeric", month: "short", year: "numeric" })}</time>
                </div>
                {p.notes && <p className="mt-1 text-muted-foreground">{p.notes}</p>}
                {p.providerReference && <p className="mt-1 break-all text-xs text-muted-foreground">Reference: {p.providerReference}</p>}
              </li>
            ))}
          </ul>
          {surface === "BUSINESS" && <Link className="inline-block text-sm font-medium text-primary underline" href="/business/support">Contact support</Link>}
        </div>
      </div>
    </section>
  );
}
