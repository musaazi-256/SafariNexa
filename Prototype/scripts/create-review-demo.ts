import {loadEnvConfig} from "@next/env";
loadEnvConfig(process.cwd());
import {db} from "../src/lib/db";
async function main(){
 const url=new URL(process.env.SAFARINEXA_PRISMA_DATABASE_URL!);if(url.hostname!=="localhost")throw new Error("Local demo only.");
 const source=await db.listing.findUniqueOrThrow({where:{id:"bunyonyi-canoe-day-trip"}});
 const listing=await db.listing.create({data:{businessId:source.businessId,type:"TOUR",title:"E2E DEMO — listing revision test",slug:`e2e-demo-review-${Date.now()}`,status:"DRAFT",bookingMode:"REQUEST",description:"Synthetic local demo listing for end-to-end approval and revision tests. Not a real travel offering.",city:"Jinja",address:"Synthetic demo meeting point",basePriceMinor:100000,coverImageUrl:source.coverImageUrl||source.images[0],images:source.images.slice(0,2),tour:{create:{tourType:"Demo day tour",durationDays:1,groupSizeMin:1,groupSizeMax:6,inclusions:["Synthetic demo only"],exclusions:[],itinerary:["No real travel arranged"]}}}});
 console.log({id:listing.id,slug:listing.slug,businessReview:`/business/listings/${listing.id}/review`,customer:`/tours/${listing.id}`});
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>db.$disconnect());
