/** Shared commission assumption used by revenue summaries and demo settlements. */
export const PLATFORM_COMMISSION_RATE = 0.12;

export function summarizePayments(payments: Array<{ status: string; amountMinor: number; payoutId?: string | null; refunds?: Array<{ amountMinor: number; status?: string }> }>) {
  const successful = payments.filter((payment) => ["SUCCESSFUL", "PARTIALLY_REFUNDED", "REFUNDED"].includes(payment.status));
  const refunded = payments.filter((payment) => payment.status === "REFUNDED" || payment.status === "PARTIALLY_REFUNDED");
  const unsettled = successful.filter((payment) => !payment.payoutId);

  const grossMinor = successful.reduce((sum, payment) => sum + payment.amountMinor, 0);
  const refundedMinor = refunded.reduce((sum, payment) => sum + (payment.refunds ? payment.refunds.filter(r => !r.status || r.status === "COMPLETED").reduce((total,r) => total+r.amountMinor,0) : payment.status === "REFUNDED" ? payment.amountMinor : 0), 0);
  const retainedMinor = grossMinor - refundedMinor;
  const commissionMinor = Math.round(retainedMinor * PLATFORM_COMMISSION_RATE);
  const netMinor = retainedMinor - commissionMinor;

  const unsettledRetainedMinor = unsettled.reduce((sum, payment) => {
    const refunded = payment.refunds
      ? payment.refunds.filter(refund => !refund.status || refund.status === "COMPLETED").reduce((total, refund) => total + refund.amountMinor, 0)
      : payment.status === "REFUNDED" ? payment.amountMinor : 0;
    return sum + Math.max(0, payment.amountMinor - refunded);
  }, 0);
  const unsettledNetMinor = unsettledRetainedMinor - Math.round(unsettledRetainedMinor * PLATFORM_COMMISSION_RATE);

  return { grossMinor, commissionMinor, netMinor, refundedMinor, unsettledNetMinor };
}
