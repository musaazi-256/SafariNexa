import type { BadgeProps } from "@/components/ui/badge";

export type BookingStatus =
  | "draft"
  | "auth_required"
  | "pending_traveller_details"
  | "pending_payment"
  | "payment_processing"
  | "payment_failed"
  | "payment_successful"
  | "booking_created"
  | "awaiting_business_confirmation"
  | "confirmed"
  | "cancelled_by_customer"
  | "cancelled_by_business"
  | "cancelled_by_admin"
  | "refund_requested"
  | "refund_processing"
  | "refunded"
  | "completed"
  | "review_pending"
  | "reviewed"
  | "support_case_open";

export type PaymentStatus =
  | "not_started"
  | "method_selected"
  | "processing"
  | "pending_provider_confirmation"
  | "successful"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type VerificationStatus =
  | "not_started"
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_changes"
  | "approved"
  | "rejected"
  | "suspended";

export type AdminAccessStatus = "active" | "invited" | "suspended" | "inactive" | "access_denied" | "role_missing";

export type ReviewStatus = "pending" | "published" | "hidden" | "flagged";

export type SupportCaseStatus = "open" | "in_progress" | "waiting_on_customer" | "resolved" | "closed";

export type RefundStatus = "requested" | "processing" | "completed" | "rejected";

type StatusMeta = { label: string; variant: NonNullable<BadgeProps["variant"]> };

const bookingStatusMeta: Record<BookingStatus, StatusMeta> = {
  draft: { label: "Draft", variant: "secondary" },
  auth_required: { label: "Sign in required", variant: "warning" },
  pending_traveller_details: { label: "Traveller details needed", variant: "warning" },
  pending_payment: { label: "Payment required", variant: "warning" },
  payment_processing: { label: "Processing payment", variant: "warning" },
  payment_failed: { label: "Payment failed", variant: "destructive" },
  payment_successful: { label: "Payment successful", variant: "success" },
  booking_created: { label: "Booking created", variant: "default" },
  awaiting_business_confirmation: { label: "Awaiting confirmation", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  cancelled_by_customer: { label: "Cancelled by you", variant: "secondary" },
  cancelled_by_business: { label: "Cancelled by business", variant: "destructive" },
  cancelled_by_admin: { label: "Cancelled by admin", variant: "destructive" },
  refund_requested: { label: "Refund requested", variant: "warning" },
  refund_processing: { label: "Refund processing", variant: "warning" },
  refunded: { label: "Refunded", variant: "secondary" },
  completed: { label: "Completed", variant: "success" },
  review_pending: { label: "Review pending", variant: "accent" },
  reviewed: { label: "Reviewed", variant: "secondary" },
  support_case_open: { label: "Support case open", variant: "destructive" }
};

const paymentStatusMeta: Record<PaymentStatus, StatusMeta> = {
  not_started: { label: "Not started", variant: "secondary" },
  method_selected: { label: "Method selected", variant: "secondary" },
  processing: { label: "Processing", variant: "warning" },
  pending_provider_confirmation: { label: "Awaiting provider", variant: "warning" },
  successful: { label: "Successful", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  refunded: { label: "Refunded", variant: "secondary" },
  partially_refunded: { label: "Partially refunded", variant: "warning" }
};

const verificationStatusMeta: Record<VerificationStatus, StatusMeta> = {
  not_started: { label: "Not started", variant: "secondary" },
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "warning" },
  under_review: { label: "Under review", variant: "warning" },
  needs_changes: { label: "Needs changes", variant: "destructive" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  suspended: { label: "Suspended", variant: "destructive" }
};

const adminAccessStatusMeta: Record<AdminAccessStatus, StatusMeta> = {
  active: { label: "Active", variant: "success" },
  invited: { label: "Invited", variant: "warning" },
  suspended: { label: "Suspended", variant: "destructive" },
  inactive: { label: "Inactive", variant: "secondary" },
  access_denied: { label: "Access denied", variant: "destructive" },
  role_missing: { label: "Role missing", variant: "destructive" }
};

const reviewStatusMeta: Record<ReviewStatus, StatusMeta> = {
  pending: { label: "Pending", variant: "secondary" },
  published: { label: "Published", variant: "success" },
  hidden: { label: "Hidden", variant: "secondary" },
  flagged: { label: "Flagged", variant: "destructive" }
};

const supportCaseStatusMeta: Record<SupportCaseStatus, StatusMeta> = {
  open: { label: "Open", variant: "warning" },
  in_progress: { label: "In progress", variant: "warning" },
  waiting_on_customer: { label: "Waiting on you", variant: "accent" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "secondary" }
};

const refundStatusMeta: Record<RefundStatus, StatusMeta> = {
  requested: { label: "Requested", variant: "warning" },
  processing: { label: "Processing", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" }
};

export function bookingStatusMetaOf(status: BookingStatus): StatusMeta {
  return bookingStatusMeta[status];
}

/** Prisma's BookingStatus enum is UPPER_SNAKE; this UI layer's type is
 * lower_snake with identical member names, so a lowercase cast round-trips
 * safely. Centralized here so call sites don't reach for `as never`. */
export function toBookingStatus(prismaStatus: string): BookingStatus {
  return prismaStatus.toLowerCase() as BookingStatus;
}

export function paymentStatusMetaOf(status: PaymentStatus): StatusMeta {
  return paymentStatusMeta[status];
}

/** Prisma's PaymentStatus enum is UPPER_SNAKE; this UI layer's type is
 * lower_snake with identical member names, same convention as toBookingStatus. */
export function toPaymentStatus(prismaStatus: string): PaymentStatus {
  return prismaStatus.toLowerCase() as PaymentStatus;
}

export function verificationStatusMetaOf(status: VerificationStatus): StatusMeta {
  return verificationStatusMeta[status];
}

/** Prisma's VerificationStatus enum is UPPER_SNAKE; this UI layer's type is
 * lower_snake with identical member names, same convention as toBookingStatus. */
export function toVerificationStatus(prismaStatus: string): VerificationStatus {
  return prismaStatus.toLowerCase() as VerificationStatus;
}

export function adminAccessStatusMetaOf(status: AdminAccessStatus): StatusMeta {
  return adminAccessStatusMeta[status];
}

/** Prisma's AdminUserStatus enum (ACTIVE/INVITED/SUSPENDED/INACTIVE) is a subset of the
 * lower_snake AdminAccessStatus union — the extra access_denied/role_missing values come
 * from sign-in attempts, not a stored AdminUser row, so they're never produced here. */
export function toAdminAccessStatus(prismaStatus: string): AdminAccessStatus {
  return prismaStatus.toLowerCase() as AdminAccessStatus;
}

export function reviewStatusMetaOf(status: ReviewStatus): StatusMeta {
  return reviewStatusMeta[status];
}

/** Prisma's ReviewStatus enum is UPPER_SNAKE; this UI layer's type is
 * lower_snake with identical member names, so a lowercase cast round-trips
 * safely — same convention as toBookingStatus. */
export function toReviewStatus(prismaStatus: string): ReviewStatus {
  return prismaStatus.toLowerCase() as ReviewStatus;
}

export function supportCaseStatusMetaOf(status: SupportCaseStatus): StatusMeta {
  return supportCaseStatusMeta[status];
}

/** Prisma's SupportCaseStatus enum is UPPER_SNAKE; this UI layer's type is
 * lower_snake with identical member names, same convention as toBookingStatus. */
export function toSupportCaseStatus(prismaStatus: string): SupportCaseStatus {
  return prismaStatus.toLowerCase() as SupportCaseStatus;
}

export function refundStatusMetaOf(status: RefundStatus): StatusMeta {
  return refundStatusMeta[status];
}

/** Prisma's RefundStatus enum is UPPER_SNAKE; this UI layer's type is
 * lower_snake with identical member names, same convention as toBookingStatus. */
export function toRefundStatus(prismaStatus: string): RefundStatus {
  return prismaStatus.toLowerCase() as RefundStatus;
}
