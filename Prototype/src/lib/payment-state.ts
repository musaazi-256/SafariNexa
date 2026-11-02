/** Amounts in this prototype are whole UGX, despite the legacy "Minor" field names.
 * Stripe requires UGX amounts multiplied by 100: https://docs.stripe.com/currencies#special-cases */
export function stripeAmount(amount: number, currency: string) {
  if (currency.toUpperCase() !== "UGX" || !Number.isSafeInteger(amount) || amount < 0 || !Number.isSafeInteger(amount * 100)) throw new Error("Invalid UGX amount");
  return amount * 100;
}

export function receiptState(status?: string) {
  if (status === "SUCCESSFUL") return { title: "Payment received", description: "The provider confirmed payment. Check the booking status below for business acceptance.", amountLabel: "Amount paid", paid: true, pending: false };
  if (status === "REFUNDED" || status === "PARTIALLY_REFUNDED") return { title: status === "REFUNDED" ? "Payment refunded" : "Payment partially refunded", description: "See your booking or contact support for the refund breakdown.", amountLabel: "Original booking amount", paid: true, pending: false };
  const pending = status === "PROCESSING" || status === "PENDING_PROVIDER_CONFIRMATION";
  return { title: pending ? "Payment confirmation pending" : "Payment not completed", description: pending ? "We have not received confirmation yet. Do not pay again; refresh this page or contact support." : "There is no confirmed payment for this booking.", amountLabel: "Booking amount — not a receipt", paid: false, pending };
}

export function paymentStatusFilter(raw?: string): string[] | undefined {
  const value = raw?.toUpperCase();
  if (value === "PENDING") return ["NOT_STARTED", "METHOD_SELECTED", "PROCESSING", "PENDING_PROVIDER_CONFIRMATION"];
  if (value && ["SUCCESSFUL", "FAILED", "CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(value)) return [value];
  return undefined;
}
