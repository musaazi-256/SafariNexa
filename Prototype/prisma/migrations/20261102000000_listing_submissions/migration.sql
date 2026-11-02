CREATE TABLE "ListingSubmission" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "submittedBy" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "snapshot" JSONB NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "notes" TEXT,
  CONSTRAINT "ListingSubmission_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ListingSubmission_status_check" CHECK ("status" IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'NEEDS_CHANGES', 'REJECTED', 'WITHDRAWN'))
);
CREATE INDEX "ListingSubmission_listingId_submittedAt_idx" ON "ListingSubmission"("listingId", "submittedAt");
CREATE INDEX "ListingSubmission_status_submittedAt_idx" ON "ListingSubmission"("status", "submittedAt");
CREATE UNIQUE INDEX "ListingSubmission_one_pending_idx" ON "ListingSubmission"("listingId") WHERE "status" IN ('SUBMITTED', 'UNDER_REVIEW');
ALTER TABLE "ListingSubmission" ADD CONSTRAINT "ListingSubmission_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "ListingImageUpload" (
  "filename" TEXT NOT NULL PRIMARY KEY,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "BookingParticipant" ADD COLUMN "nationality" TEXT, ADD COLUMN "emergencyContact" TEXT;
