import { demoPayoutAllocations } from "./demo-payouts";

const bookings = [{ id: "stay", businessId: "lodge", totalMinor: 100000, verificationStatus: "APPROVED" }, { id: "tour", businessId: "operator", totalMinor: 50000, verificationStatus: "APPROVED" }];

test("combined demo payments allocate net settlement to each business", () => {
  expect(demoPayoutAllocations({ amountMinor: 150000, bookings, refunds: [] })).toEqual([{ businessId: "lodge", amountMinor: 88000 }, { businessId: "operator", amountMinor: 44000 }]);
});
test("completed refunds reduce only their booking's allocation", () => {
  expect(demoPayoutAllocations({ amountMinor: 150000, bookings, refunds: [{ bookingId: "stay", amountMinor: 25000, status: "COMPLETED" }] })[0].amountMinor).toBe(66000);
});
test("pending refunds, unverified businesses and inconsistent totals block settlement", () => {
  expect(demoPayoutAllocations({ amountMinor: 150000, bookings, refunds: [{ bookingId: "stay", amountMinor: 25000, status: "REQUESTED" }] })).toEqual([]);
  expect(demoPayoutAllocations({ amountMinor: 1, bookings, refunds: [] })).toEqual([]);
  expect(demoPayoutAllocations({ amountMinor: 150000, bookings: bookings.map(booking => ({ ...booking, verificationStatus: "SUBMITTED" })), refunds: [] })).toEqual([]);
});

test("settlement notifications come from the completed payout and do not repeat on replay",async()=>{
 const {settleDemoPayouts}=await import("./demo-payouts");
 let settled=false;
 const payment={id:"payment",amountMinor:100000,currency:"UGX",booking:{id:"booking",businessId:"lodge",totalMinor:100000,business:{id:"lodge",name:"Test Lodge",verificationStatus:"APPROVED"}},order:null,refunds:[]};
 const tx={payment:{findMany:jest.fn(async()=>settled?[]:[payment]),update:jest.fn(async()=>{settled=true;})},payout:{create:jest.fn(async()=>({id:"payout"}))},businessUser:{findMany:jest.fn(async()=>[{userId:"owner"},{userId:"owner"}])},notification:{createMany:jest.fn()}};
 await settleDemoPayouts(tx as unknown as import("@prisma/client").Prisma.TransactionClient);
 await settleDemoPayouts(tx as unknown as import("@prisma/client").Prisma.TransactionClient);
 expect(tx.notification.createMany).toHaveBeenCalledTimes(1);
 expect(tx.notification.createMany).toHaveBeenCalledWith({data:[expect.objectContaining({userId:"owner",type:"PAYMENT_UPDATE",title:"Payout completed",body:expect.stringContaining("UGX 88,000")})]});
});
