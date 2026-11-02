import {loadEnvConfig} from "@next/env";
loadEnvConfig(process.cwd());
import assert from "node:assert/strict";
import {db} from "../src/lib/db";
import {validateAndReserveBookings} from "../src/lib/booking-service";
import {acceptBookingRequest,cancelReservedBooking} from "../src/lib/booking-lifecycle";
import {revisionPreview,applyListingRevision} from "../src/lib/listing-revisions";
import {reviewInclude,listingSnapshot,snapshotDigest} from "../src/lib/listing-review";
import {Prisma} from "@prisma/client";
const marker="ROLLBACK_MARKETPLACE_LOOP";
async function main(){
 const url=new URL(process.env.SAFARINEXA_PRISMA_DATABASE_URL!);if(!["localhost","127.0.0.1","[::1]"].includes(url.hostname))throw new Error("Local demo database only.");
 let passed=false;
 try{await db.$transaction(async tx=>{
  const owner=await tx.businessUser.findFirstOrThrow({where:{role:"OWNER",business:{verificationStatus:"APPROVED"}}});
  const customer=await tx.user.findUniqueOrThrow({where:{email:"customer@safarinexa.test"}});
  const listing=await tx.listing.create({data:{businessId:owner.businessId,type:"TOUR",title:"ROLLBACK ONLY — tour",slug:`loop-${Date.now()}`,status:"PUBLISHED",bookingMode:"REQUEST",description:"A synthetic tour for rollback-only integration testing.",city:"Jinja",address:"Synthetic test location",coverImageUrl:"https://images.unsplash.com/photo-1547471080-7cc2caa01a7e",images:[],basePriceMinor:100000,tour:{create:{tourType:"Day tour",durationDays:1,groupSizeMin:1,groupSizeMax:6,inclusions:[],exclusions:[],itinerary:[]}}},include:reviewInclude});
  const item={id:"test",listingId:listing.id,type:"tour",title:"ignored",startDate:"2099-12-05",participants:2,addOnIds:[],totalMinor:1,fulfilment:{notes:"Synthetic special request"}};
  const details={fullName:"ROLLBACK Traveller",email:"rollback@example.test",phone:"+256700000000"};
  const created=await validateAndReserveBookings(customer.id,[item],details,true,tx);
  const booking=created.bookings[0];assert.equal(booking.status,"AWAITING_BUSINESS_CONFIRMATION");assert.equal(booking.totalMinor,200000);assert.equal(await tx.payment.count({where:{bookingId:booking.id}}),0);
  assert.equal((booking.fulfilment as {notes:string}).notes,"Synthetic special request");
  assert.ok(await tx.notification.findFirst({where:{userId:owner.userId,relatedBookingId:booking.id}}));
  await assert.rejects(acceptBookingRequest(tx,booking.id,customer.id),/denied/);
  await acceptBookingRequest(tx,booking.id,owner.userId);
  const accepted=await tx.booking.findUniqueOrThrow({where:{id:booking.id}});assert.equal(accepted.status,"PENDING_PAYMENT");assert.ok(accepted.paymentDueAt);assert.equal((await tx.order.findUniqueOrThrow({where:{id:created.orderId!}})).status,"PENDING_PAYMENT");
  await tx.listing.update({where:{id:listing.id},data:{basePriceMinor:300000}});
  assert.equal((await tx.booking.findUniqueOrThrow({where:{id:booking.id}})).totalMinor,200000);
  await cancelReservedBooking(tx,booking.id,customer.id,"customer");
  assert.equal((await tx.booking.findUniqueOrThrow({where:{id:booking.id}})).status,"CANCELLED_BY_CUSTOMER");
  assert.equal((await tx.availability.findFirstOrThrow({where:{listingId:listing.id}})).remaining,6);
  assert.ok(await tx.notification.findFirst({where:{userId:owner.userId,relatedBookingId:booking.id,title:"Booking cancelled"}}));
  const restaurant=await tx.listing.create({data:{businessId:owner.businessId,type:"RESTAURANT",title:"ROLLBACK restaurant",slug:`restaurant-loop-${Date.now()}`,description:"Synthetic restaurant",status:"PUBLISHED",basePriceMinor:50000,images:[],restaurant:{create:{seatingCapacity:20,openingHours:{summary:"Daily · 08:00 - 22:00",reservationDurationMinutes:90},acceptsReservationRequests:true}}}});
  const reservation=(await validateAndReserveBookings(customer.id,[{...item,listingId:restaurant.id,type:"restaurant",time:"12:00"}],details,false,tx)).bookings[0];
  assert.equal(reservation.totalMinor,0);await acceptBookingRequest(tx,reservation.id,owner.userId);assert.equal((await tx.booking.findUniqueOrThrow({where:{id:reservation.id}})).status,"CONFIRMED");
  const live=await tx.listing.findUniqueOrThrow({where:{id:listing.id},include:reviewInclude});const form=new FormData();
  for(const [key,value] of Object.entries({title:"Approved revision title",description:live.description,basePriceMinor:"120000",city:"Jinja",address:"Synthetic test location",bookingMode:"REQUEST",coverImageUrl:live.coverImageUrl!,tourType:"Day tour",durationDays:"1",groupSizeMin:"1",groupSizeMax:"6"}))form.set(key,value);
  const proposed=await revisionPreview(tx,live,form);assert.equal(proposed.title,"Approved revision title");assert.equal((await tx.listing.findUniqueOrThrow({where:{id:listing.id}})).title,live.title);
  assert.equal(snapshotDigest(listingSnapshot({...live,draftSnapshot:proposed})),snapshotDigest(listingSnapshot(live)));
  await applyListingRevision(tx,live,form);assert.equal((await tx.listing.findUniqueOrThrow({where:{id:listing.id}})).title,"Approved revision title");
  passed=true;throw new Error(marker);
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:30000});}catch(error){if(!(error instanceof Error)||error.message!==marker)throw error;}
 if(!passed)throw new Error("Checks did not complete.");console.log("PASS: real database customer request → business acceptance → customer payment-required state → cancellation → restored inventory/business notification; zero-charge restaurant confirmation; unpublished draft preview → approved revision. All test records rolled back.");
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>db.$disconnect());
