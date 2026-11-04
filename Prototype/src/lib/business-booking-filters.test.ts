import { BookingStatus } from "@prisma/client";
import { BUSINESS_BOOKING_FILTERS, businessBookingFilter } from "./business-booking-filters";

test("each booking stage belongs to exactly one filter", () => {
  const statuses = BUSINESS_BOOKING_FILTERS.flatMap(filter => filter.statuses);
  expect([...statuses].sort()).toEqual(Object.values(BookingStatus).sort());
  expect(new Set(statuses).size).toBe(statuses.length);
});

test("awaiting payment excludes failed and processing payments", () => {
  expect(businessBookingFilter("pending_payment")?.statuses).toEqual(["PENDING_PAYMENT"]);
  expect(businessBookingFilter("payment_failed")?.statuses).toEqual(["PAYMENT_FAILED"]);
  expect(businessBookingFilter("payment_processing")?.statuses).toEqual(["PAYMENT_PROCESSING"]);
});

test("refunds include requested, processing and completed refunds", () => {
  expect(businessBookingFilter("refunds")?.statuses).toEqual(["REFUND_REQUESTED", "REFUND_PROCESSING", "REFUNDED"]);
});

test("existing status links work and unknown values fall back to All", () => {
  expect(businessBookingFilter("AWAITING_BUSINESS_CONFIRMATION")?.value).toBe("AWAITING_BUSINESS_CONFIRMATION");
  expect(businessBookingFilter("not-a-status")).toBeUndefined();
  expect(businessBookingFilter("all")).toBeUndefined();
});
