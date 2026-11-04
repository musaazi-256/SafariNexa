import type {Prisma} from "@prisma/client";
import { completeRefund } from "./refund-service";
jest.mock("./booking-service",()=>({releaseAvailabilityForBooking:jest.fn()}));
jest.mock("./booking-lifecycle",()=>({syncOrderStatus:jest.fn()}));
function store(){return {refund:{findUnique:jest.fn(async()=>({id:"refund",bookingId:"booking",paymentId:"payment",status:"REQUESTED",amountMinor:50000,payment:{amountMinor:100000,currency:"UGX",providerReference:"DEMO-1"}})),updateMany:jest.fn(async()=>({count:1})),aggregate:jest.fn(async()=>({_sum:{amountMinor:50000}}))},payment:{update:jest.fn()},booking:{findUniqueOrThrow:jest.fn(async()=>({id:"booking",customerId:"traveller",businessId:"lodge",bookingRef:"SN-1",totalMinor:100000,status:"CONFIRMED"})),update:jest.fn()},notification:{create:jest.fn(),createMany:jest.fn()},businessUser:{findMany:jest.fn(async()=>[{userId:"owner"},{userId:"owner"},{userId:"traveller"}])}};}
it("notifies the customer and actual business members once, without duplicate recipients",async()=>{
 const tx=store();await completeRefund(tx as unknown as Prisma.TransactionClient,"refund");
 expect(tx.notification.create).toHaveBeenCalledWith({data:expect.objectContaining({userId:"traveller",type:"PAYMENT_UPDATE",relatedBookingId:"booking"})});
 expect(tx.notification.createMany).toHaveBeenCalledWith({data:[expect.objectContaining({userId:"owner",type:"PAYMENT_UPDATE",relatedBookingId:"booking"})]});
});
it("does not issue another notification if another worker already completed the refund",async()=>{
 const tx=store();tx.refund.updateMany.mockResolvedValue({count:0});await completeRefund(tx as unknown as Prisma.TransactionClient,"refund");
 expect(tx.notification.create).not.toHaveBeenCalled();expect(tx.notification.createMany).not.toHaveBeenCalled();
});
