/** No Payout/commission model exists in the schema — this is one documented, flat
 * assumed platform commission rate, applied at render time to real Payment sums.
 * Not a fabricated ledger: every amount it operates on is a real Payment.amountMinor. */
export const PLATFORM_COMMISSION_RATE = 0.12;

export function summarizePayments(payments: Array<{ status: string; amountMinor: number }>) {
  const successful = payments.filter((payment) => payment.status === "SUCCESSFUL");
  const refunded = payments.filter((payment) => payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED");

  const grossMinor = successful.reduce((sum, payment) => sum + payment.amountMinor, 0);
  const refundedMinor = refunded.reduce((sum, payment) => sum + payment.amountMinor, 0);
  const commissionMinor = Math.round(grossMinor * PLATFORM_COMMISSION_RATE);
  const netMinor = grossMinor - commissionMinor;

  return { grossMinor, commissionMinor, netMinor, refundedMinor };
}
