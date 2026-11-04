import type { BookingStatus } from "@prisma/client";

export const BUSINESS_BOOKING_FILTERS: Array<{ value: string; label: string; statuses: BookingStatus[] }> = [
  { value: "AWAITING_BUSINESS_CONFIRMATION", label: "Needs your confirmation", statuses: ["AWAITING_BUSINESS_CONFIRMATION"] },
  { value: "CONFIRMED", label: "Confirmed", statuses: ["CONFIRMED"] },
  { value: "PENDING_PAYMENT", label: "Awaiting customer payment", statuses: ["PENDING_PAYMENT"] },
  { value: "PAYMENT_PROCESSING", label: "Payment processing", statuses: ["PAYMENT_PROCESSING"] },
  { value: "PAYMENT_FAILED", label: "Payment failed", statuses: ["PAYMENT_FAILED"] },
  { value: "COMPLETED", label: "Completed", statuses: ["COMPLETED", "REVIEW_PENDING", "REVIEWED"] },
  { value: "CANCELLED", label: "Cancelled", statuses: ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN"] },
  { value: "REFUNDS", label: "Refunds", statuses: ["REFUND_REQUESTED", "REFUND_PROCESSING", "REFUNDED"] },
  { value: "SUPPORT_CASE_OPEN", label: "Support needed", statuses: ["SUPPORT_CASE_OPEN"] },
  { value: "IN_PROGRESS", label: "Other booking stages", statuses: ["DRAFT", "AUTH_REQUIRED", "PENDING_TRAVELLER_DETAILS", "PAYMENT_SUCCESSFUL", "BOOKING_CREATED"] }
];

export function businessBookingFilter(value?: string) {
  return BUSINESS_BOOKING_FILTERS.find(filter => filter.value === value?.toUpperCase());
}
