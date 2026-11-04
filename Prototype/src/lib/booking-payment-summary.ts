import type { Payment, Refund } from "@prisma/client";
export type PaymentWithRefunds = Payment & { refunds: Refund[] };
export const RECEIVED_PAYMENT_STATUSES = ["SUCCESSFUL", "PARTIALLY_REFUNDED", "REFUNDED"];

/** A combined payment is allocated to this booking, never exposed as business revenue in full. */
export function bookingPaymentSummary(booking: {
  id: string; totalMinor: number; status: string;
  payments: PaymentWithRefunds[];
  order?: { payments: PaymentWithRefunds[]; status?: string } | null;
}) {
  const history = [...booking.payments, ...(booking.order?.payments ?? [])].filter((payment, i, all) => all.findIndex(p => p.id === payment.id) === i).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
  const payment = history.find(p => RECEIVED_PAYMENT_STATUSES.includes(p.status)) ?? history[0];
  const received = !!payment && RECEIVED_PAYMENT_STATUSES.includes(payment.status);
  const refunds = history.flatMap(p => p.refunds).filter(r => r.bookingId === booking.id);
  const refundedMinor = refunds.filter(r => r.status === "COMPLETED").reduce((sum,r) => sum+r.amountMinor,0);
  const heldMinor = refunds.filter(r => ["REQUESTED","PROCESSING"].includes(r.status)).reduce((sum,r) => sum+r.amountMinor,0);
  const paidMinor = received ? Math.min(booking.totalMinor, payment.amountMinor) : 0;
  const closed = booking.status.startsWith("CANCELLED") || booking.status === "REFUNDED";
  const paymentNotDue = booking.order?.status === "AWAITING_BUSINESS_CONFIRMATION" || ["DRAFT","AUTH_REQUIRED","PENDING_TRAVELLER_DETAILS","AWAITING_BUSINESS_CONFIRMATION","BOOKING_CREATED"].includes(booking.status);
  const status = refundedMinor >= paidMinor && paidMinor > 0 ? "REFUNDED" : refundedMinor > 0 ? "PARTIALLY_REFUNDED" : payment?.status ?? "NOT_STARTED";
  return { history, payment, status, refunds, paidMinor, refundedMinor, heldMinor,
    refundableMinor: received ? Math.max(0,paidMinor-refundedMinor-heldMinor) : 0,
    outstandingMinor: closed || paymentNotDue ? 0 : Math.max(0,booking.totalMinor-paidMinor),
    category: booking.totalMinor === 0 ? "NOT_REQUIRED" : refunds.length ? "REFUNDS" : received ? "PAID" : ["PROCESSING","PENDING_PROVIDER_CONFIRMATION"].includes(status) ? "PROCESSING" : status === "FAILED" ? "FAILED" : "UNPAID"
  };
}
