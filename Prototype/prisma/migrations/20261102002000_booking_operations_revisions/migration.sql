ALTER TABLE "Listing" ADD COLUMN "bookingMode" TEXT NOT NULL DEFAULT 'REQUEST', ADD COLUMN "draftForm" JSONB, ADD COLUMN "draftSnapshot" JSONB;
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_bookingMode_check" CHECK ("bookingMode" IN ('REQUEST','INSTANT'));
ALTER TABLE "ListingSubmission" ADD COLUMN "draftForm" JSONB, ADD COLUMN "baselineDigest" TEXT;
ALTER TABLE "Booking" ADD COLUMN "bookingMode" TEXT NOT NULL DEFAULT 'LEGACY', ADD COLUMN "responseDueAt" TIMESTAMP(3), ADD COLUMN "paymentDueAt" TIMESTAMP(3), ADD COLUMN "fulfilment" JSONB, ADD COLUMN "policySnapshot" JSONB;
CREATE INDEX "Booking_status_responseDueAt_idx" ON "Booking"("status", "responseDueAt");
