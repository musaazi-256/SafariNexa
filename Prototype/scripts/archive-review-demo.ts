import {loadEnvConfig} from "@next/env";
loadEnvConfig(process.cwd());
import {db} from "../src/lib/db";
async function main(){
 const url=new URL(process.env.SAFARINEXA_PRISMA_DATABASE_URL!);if(url.hostname!=="localhost"||url.pathname!=="/safarinexa")throw new Error("Local demo database only.");
 const id=process.argv.find(arg=>arg.startsWith("--listing-id="))?.slice("--listing-id=".length);if(!id)throw new Error("Provide the exact synthetic listing ID.");
 const listing=await db.listing.findUniqueOrThrow({where:{id}});
 if(!listing.slug.startsWith("e2e-demo-review-")||!listing.title.startsWith("E2E DEMO"))throw new Error("Not a clearly labelled test listing.");
 if(await db.listingSubmission.count({where:{listingId:id,status:{in:["SUBMITTED","UNDER_REVIEW"]}}}))throw new Error("Finish the pending review before archiving.");
 await db.listing.update({where:{id},data:{status:"ARCHIVED"}});
 console.log("Synthetic listing archived; all submission/review history retained. No records deleted.");
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>db.$disconnect());
