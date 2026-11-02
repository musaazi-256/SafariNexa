/** No Payout/commission model exists in the schema — this is one documented, flat
 * assumed platform commission rate, applied at render time to real Payment sums.
 * Not a fabricated ledger: every amount it operates on is a real Payment.amountMinor. */
export const PLATFORM_COMMISSION_RATE = 0.12;

export function summarizePayments(payments: Array<{ status: string; amountMinor: number; payoutId?: string | null; refunds?: Array<{ amountMinor: number; status?: string }> }>) {
  const successful = payments.filter((payment) => ["SUCCESSFUL", "PARTIALLY_REFUNDED", "REFUNDED"].includes(payment.status));
  const refunded = payments.filter((payment) => payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED");
  const unsettled = payments.filter((payment) => payment.status === "SUCCESSFUL" && !payment.payoutId);

  const grossMinor = successful.reduce((sum, payment) => sum + payment.amountMinor, 0);
  const refundedMinor = refunded.reduce((sum, payment) => sum + (payment.refunds ? payment.refunds.filter(r => !r.status || r.status === "COMPLETED").reduce((total,r) => total+r.amountMinor,0) : payment.status === "REFUNDED" ? payment.amountMinor : 0), 0);
  const retainedMinor = grossMinor - refundedMinor;
  const commissionMinor = Math.round(retainedMinor * PLATFORM_COMMISSION_RATE);
  const netMinor = retainedMinor - commissionMinor;

  const unsettledGrossMinor = unsettled.reduce((sum, payment) => sum + payment.amountMinor, 0);
  const unsettledNetMinor = unsettledGrossMinor - Math.round(unsettledGrossMinor * PLATFORM_COMMISSION_RATE);

  return { grossMinor, commissionMinor, netMinor, refundedMinor, unsettledNetMinor };
}
