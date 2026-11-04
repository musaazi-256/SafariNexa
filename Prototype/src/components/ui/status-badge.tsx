import { Badge } from "@/components/ui/badge";
import {
  listingStatusMetaOf,
  listingSubmissionStatusMetaOf,
  adminAccessStatusMetaOf,
  bookingStatusMetaOf,
  paymentStatusMetaOf,
  refundStatusMetaOf,
  reviewStatusMetaOf,
  supportCaseStatusMetaOf,
  verificationStatusMetaOf,
  type AdminAccessStatus,
  type BookingStatus,
  type PaymentStatus,
  type RefundStatus,
  type ReviewStatus,
  type SupportCaseStatus,
  type VerificationStatus
} from "@/lib/status";

export function BookingStatusBadge({ status, perspective = "customer" }: { status: BookingStatus; perspective?: "customer" | "staff" }) {
  const meta = bookingStatusMetaOf(status, perspective);
  return <Badge data-status-tone={meta.variant} variant={meta.variant}>{meta.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = paymentStatusMetaOf(status);
  return <Badge data-status-tone={meta.variant} variant={meta.variant}>{meta.label}</Badge>;
}

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  const meta = verificationStatusMetaOf(status);
  return <Badge data-status-tone={meta.variant} variant={meta.variant}>{meta.label}</Badge>;
}

export function AdminAccessStatusBadge({ status }: { status: AdminAccessStatus }) {
  const meta = adminAccessStatusMetaOf(status);
  return <Badge data-status-tone={meta.variant} variant={meta.variant}>{meta.label}</Badge>;
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const meta = reviewStatusMetaOf(status);
  return <Badge data-status-tone={meta.variant} variant={meta.variant}>{meta.label}</Badge>;
}

export function SupportCaseStatusBadge({ status, perspective = "customer" }: { status: SupportCaseStatus; perspective?: "customer" | "staff" }) {
  const meta = supportCaseStatusMetaOf(status, perspective);
  return <Badge data-status-tone={meta.variant} variant={meta.variant}>{meta.label}</Badge>;
}

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const meta = refundStatusMetaOf(status);
  return <Badge data-status-tone={meta.variant} variant={meta.variant}>{meta.label}</Badge>;
}

export function ListingStatusBadge({ status }: { status: string }) {
  const meta = listingStatusMetaOf(status);
  return <Badge data-status-tone={meta.variant} variant={meta.variant}>{meta.label}</Badge>;
}
export function ListingSubmissionStatusBadge({ status }: { status: string }) {
  const meta = listingSubmissionStatusMetaOf(status);
  return <Badge data-status-tone={meta.variant} variant={meta.variant}>{meta.label}</Badge>;
}
