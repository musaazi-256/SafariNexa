/** Local integration check. Creates clearly labelled fixtures and archives its
 * listing afterwards. Provider responses below are fixtures; no API is called. */
import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
loadEnvConfig(process.cwd());
async function main() {
 const host=new URL(process.env.SAFARINEXA_PRISMA_DATABASE_URL??"").hostname;
 if(!["localhost","127.0.0.1","[::1]"].includes(host)||process.env.SAFARINEXA_DEMO_MODE==="false")throw new Error("Run this check only against a local demo database.");
 const {db}=await import("../src/lib/db");
 const {validateAndReserveBookings}=await import("../src/lib/booking-service");
 const {acceptBookingRequest,cancelReservedBooking}=await import("../src/lib/booking-lifecycle");
 const {reconcileCheckout}=await import("../src/lib/payment-reconciliation");
 const {createBookingRefund,approveBookingRefund}=await import("../src/lib/payment-management");
 const {bookingPaymentSummary}=await import("../src/lib/booking-payment-summary");
 const {Prisma}=await import("@prisma/client");
 const run=randomUUID();let listingId:string|undefined;
 try {
  const business=await db.businessProfile.findUniqueOrThrow({where:{slug:"nile-crater-lodges"}});
  const owner=await db.businessUser.findFirstOrThrow({where:{businessId:business.id,role:"OWNER"}});
  const actor={surface:"BUSINESS" as const,businessId:business.id,userId:owner.userId};
  const customer=await db.user.create({data:{name:"[TEST] Payment flow guest",email:`flow-${run}@demo.test`}});
  const listing=await db.listing.create({data:{slug:`flow-test-${run}`,businessId:business.id,title:"[TEST] Payment workflow fixture",type:"ACCOMMODATION",description:"Local integration fixture. Not a real property.",basePriceMinor:120000,status:"PUBLISHED",bookingMode:"REQUEST",images:[],accommodation:{create:{propertyType:"Lodge",amenities:[],roomTypes:{create:{name:"Test room",priceMinor:120000,maxOccupancy:2,totalRooms:1,images:[]}}}}},include:{accommodation:{include:{roomTypes:true}}}});listingId=listing.id;
  const start=new Date(Date.now()+120*86400000);start.setUTCHours(0,0,0,0);const end=new Date(start.getTime()+86400000);
  const item={id:run,listingId:listing.id,type:"ACCOMMODATION",title:listing.title,startDate:start.toISOString(),endDate:end.toISOString(),participants:1,roomTypeId:listing.accommodation!.roomTypes[0].id,addOnIds:[],totalMinor:1};
  const details={fullName:"Test Guest",email:customer.email,phone:"+256700000000"};
  process.env.SAFARINEXA_DEMO_MODE="true"; // Demo now follows the same request-before-payment path.
  const result=await validateAndReserveBookings(customer.id,[item],details);
  const booking=result.bookings[0];assert.equal(booking.status,"AWAITING_BUSINESS_CONFIRMATION");assert.equal(booking.totalMinor,120000);
  await db.$transaction(tx=>acceptBookingRequest(tx,booking.id,owner.userId),{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  assert.equal((await db.booking.findUniqueOrThrow({where:{id:booking.id}})).status,"PENDING_PAYMENT");
  const attempt=await db.payment.create({data:{bookingId:booking.id,provider:"STRIPE",status:"PENDING_PROVIDER_CONFIRMATION",providerReference:`cs_local_${run}`,amountMinor:120000}});
  const checkout={id:attempt.providerReference,amount_total:12000000,currency:"ugx",payment_status:"unpaid",status:"complete"} as Stripe.Checkout.Session;
  await db.$transaction(tx=>reconcileCheckout(tx,attempt.id,checkout,true),{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  assert.equal((await db.booking.findUniqueOrThrow({where:{id:booking.id}})).status,"PAYMENT_FAILED");
  await assert.rejects(validateAndReserveBookings(customer.id,[item],details),/fully booked/);
  const retry=await db.payment.create({data:{bookingId:booking.id,provider:"STRIPE",status:"PENDING_PROVIDER_CONFIRMATION",providerReference:`cs_retry_${run}`,amountMinor:120000}});
  await db.$transaction(tx=>reconcileCheckout(tx,retry.id,{...checkout,id:retry.providerReference!,payment_status:"paid"}),{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  assert.equal((await db.booking.findUniqueOrThrow({where:{id:booking.id}})).status,"CONFIRMED");
  // Tag this synthetic payment for the existing demo-only refund executor.
  process.env.SAFARINEXA_DEMO_MODE="true";
  await db.payment.update({where:{id:retry.id},data:{providerReference:`DEMO-FLOW-${run}`}});
  await assert.rejects(createBookingRefund({...actor,businessId:"another-workspace"},booking.id,30000,"Test partial refund",randomUUID()),/active business/);
  const partial=await createBookingRefund(actor,booking.id,30000,"Test partial goodwill refund",randomUUID());await approveBookingRefund(actor,partial.id);
  assert.equal((await db.payment.findUniqueOrThrow({where:{id:retry.id}})).status,"PARTIALLY_REFUNDED");
  await db.$transaction(tx=>cancelReservedBooking(tx,booking.id,owner.userId,"business"),{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  const cancellation=await db.refund.findFirstOrThrow({where:{bookingId:booking.id,status:"REQUESTED"}});assert.equal(cancellation.amountMinor,90000);
  const availability=await db.availability.findFirstOrThrow({where:{listingId:listing.id}});assert.equal(availability.remaining,1);
  await approveBookingRefund(actor,cancellation.id);const notifications=await db.notification.count({where:{relatedBookingId:booking.id}});await approveBookingRefund(actor,cancellation.id);assert.equal(await db.notification.count({where:{relatedBookingId:booking.id}}),notifications);
  const final=await db.booking.findUniqueOrThrow({where:{id:booking.id},include:{payments:{include:{refunds:true}}}});
  assert.equal(final.status,"REFUNDED");assert.equal(bookingPaymentSummary(final).refundedMinor,120000);assert.equal(bookingPaymentSummary(final).outstandingMinor,0);
  await assert.rejects(createBookingRefund(actor,booking.id,1,"Excess refund test",randomUUID()),/available paid amount/);
  console.log(JSON.stringify({result:"PASS",bookingRef:booking.bookingRef,checks:["Server-side pricing","Request before payment","Business acceptance","Payment failure recorded","Inventory held for retry","Verified payment confirms booking","Workspace isolation","Partial refund","Cancellation refunds only remaining balance","Inventory released immediately","Full refund","Idempotent replay","Over-refund blocked"]},null,2));
 } finally {if(listingId)await db.listing.update({where:{id:listingId},data:{status:"ARCHIVED"}});await db.$disconnect();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
