import { Badge } from "@/components/ui/badge";
import {
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

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = bookingStatusMetaOf(status);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = paymentStatusMetaOf(status);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  const meta = verificationStatusMetaOf(status);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function AdminAccessStatusBadge({ status }: { status: AdminAccessStatus }) {
  const meta = adminAccessStatusMetaOf(status);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const meta = reviewStatusMetaOf(status);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function SupportCaseStatusBadge({ status }: { status: SupportCaseStatus }) {
  const meta = supportCaseStatusMetaOf(status);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const meta = refundStatusMetaOf(status);
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
