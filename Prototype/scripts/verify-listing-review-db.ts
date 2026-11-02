import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { PrismaClient } from "@prisma/client";
import { listingSnapshot, reviewInclude } from "../src/lib/listing-review";
const db = new PrismaClient();
const rollback = "ROLLBACK_LISTING_REVIEW_TEST";
async function run() {
  const url = new URL(process.env.SAFARINEXA_PRISMA_DATABASE_URL!);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("This test is restricted to the local demo database.");
  let checked = false;
  try {
    await db.$transaction(async tx => {
      const business = await tx.businessProfile.findFirst({where: {verificationStatus: "APPROVED"}});
      if (!business) throw new Error("An approved local demo business is required.");
      const listing = await tx.listing.create({data: {businessId: business.id,type: "TOUR",title:"ROLLBACK-ONLY REVIEW TEST",slug:`rollback-review-${Date.now()}`,description:"A synthetic listing used only inside a rolled-back test transaction.",basePriceMinor:100000,images:["/api/images/synthetic.png"],tour:{create:{tourType:"Safari",durationDays:1,groupSizeMin:1,groupSizeMax:6,inclusions:[],exclusions:[],itinerary:[]}}},include: reviewInclude});
      const submission = await tx.listingSubmission.create({data:{listingId:listing.id,submittedBy:"synthetic-test",snapshot:listingSnapshot(listing)}});
      const fetched = await tx.listingSubmission.findUniqueOrThrow({where:{id:submission.id},include:{listing:true}});
      if (fetched.status !== "SUBMITTED" || fetched.listing.status !== "DRAFT") throw new Error("Submission incorrectly publishes listing.");
      await tx.listingSubmission.update({where:{id:submission.id},data:{status:"NEEDS_CHANGES",notes:"Synthetic review feedback"}});
      await tx.listingSubmission.create({data:{listingId:listing.id,submittedBy:"synthetic-test",snapshot:listingSnapshot(listing)}});
      if (await tx.listingSubmission.count({where:{listingId:listing.id}}) !== 2) throw new Error("Resubmission history missing.");
      await tx.listingImageUpload.create({data:{filename:`rollback-${listing.id}.png`,uploadedBy:"synthetic-test"}});
      await tx.bookingParticipant.findFirst({select:{nationality:true,emergencyContact:true}});
      await tx.businessVerification.findFirst({select:{submittedProfile:true}});
      checked = true;
      throw new Error(rollback);
    });
  } catch (error) {
    if (!(error instanceof Error) || error.message !== rollback) throw error;
  }
  if (!checked) throw new Error("Database checks did not complete.");
  console.log("PASS: local submission snapshot, draft visibility, review feedback, resubmission history, image ownership and traveller/profile columns. Synthetic records rolled back.");
}
run().catch(error => {console.error(error);process.exitCode=1;}).finally(()=>db.$disconnect());
