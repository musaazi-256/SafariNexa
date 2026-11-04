import { BookingStatus, PaymentStatus, VerificationStatus, AdminUserStatus, ReviewStatus, SupportCaseStatus, RefundStatus, ListingStatus } from "@prisma/client";
import { bookingStatusMetaOf, paymentStatusMetaOf, verificationStatusMetaOf, adminAccessStatusMetaOf, reviewStatusMetaOf, supportCaseStatusMetaOf, refundStatusMetaOf, listingStatusMetaOf, listingSubmissionStatusMetaOf } from "./status";

it.each([
  ["booking", BookingStatus, bookingStatusMetaOf], ["payment", PaymentStatus, paymentStatusMetaOf],
  ["verification", VerificationStatus, verificationStatusMetaOf], ["admin access", AdminUserStatus, adminAccessStatusMetaOf],
  ["review", ReviewStatus, reviewStatusMetaOf], ["support", SupportCaseStatus, supportCaseStatusMetaOf],
  ["refund", RefundStatus, refundStatusMetaOf], ["listing", ListingStatus, listingStatusMetaOf]
] as const)("has a known label and tone for every stored %s state", (_name, values, lookup) => {
  for (const value of Object.values(values)) {
    const meta = (lookup as (status: string) => {label: string; variant: string})(value.toLowerCase());
    expect(meta.label).toBeTruthy(); expect(meta.label).not.toBe("Unknown status"); expect(meta.variant).toBeTruthy();
  }
});
it("uses viewer-appropriate language for staff", () => {
  expect(bookingStatusMetaOf("cancelled_by_customer", "staff").label).toBe("Cancelled by customer");
  expect(supportCaseStatusMetaOf("waiting_on_customer", "staff").label).toBe("Waiting on customer");
  expect(supportCaseStatusMetaOf("waiting_on_customer").label).toBe("Waiting on you");
});
it("represents a withdrawn listing submission separately from publication", () => {
  expect(listingSubmissionStatusMetaOf("WITHDRAWN").label).toBe("Withdrawn");
  expect(listingStatusMetaOf("PUBLISHED").label).toBe("Published");
});
it("never invents a successful state for an unrecognized value", () => {
  expect(paymentStatusMetaOf("new_provider_state" as never)).toEqual({label: "Unknown status", variant: "secondary"});
});
