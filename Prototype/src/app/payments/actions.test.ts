/** @jest-environment node */
import { processPaymentAction } from "./actions";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
jest.mock("@/auth",()=>({auth:jest.fn(async()=>({user:{id:"customer-1",email:"test@example.test"}}))}));
jest.mock("next/navigation",()=>({redirect:jest.fn((url)=>{throw new Error(`REDIRECT:${url}`);})}));
jest.mock("@/lib/db",()=>({db:{$transaction:jest.fn()}}));
jest.mock("@/lib/stripe",()=>({stripe:{checkout:{sessions:{create:jest.fn()}}}}));
const tx={order:{findUnique:jest.fn(),update:jest.fn()},booking:{findUnique:jest.fn(),update:jest.fn()},payment:{findFirst:jest.fn(),create:jest.fn()},businessUser:{findMany:jest.fn().mockResolvedValue([{userId:"owner-1"}])},notification:{create:jest.fn(),createMany:jest.fn()}};
const booking={id:"booking-1",bookingRef:"SN-TEST",customerId:"customer-1",businessId:"business-1",status:"PENDING_PAYMENT",totalMinor:200000,currency:"UGX",createdAt:new Date(),paymentDueAt:new Date(Date.now()+3600000)};
function form(method="mtn",outcome="success") {const f=new FormData();f.set("bookingId","booking-1");f.set("method",method);f.set("outcome",outcome);return f;}
describe("Demo checkout",()=>{
 beforeEach(()=>{jest.clearAllMocks();process.env.SAFARINEXA_DEMO_MODE="true";(db.$transaction as jest.Mock).mockImplementation(fn=>fn(tx));tx.booking.findUnique.mockResolvedValue(booking);tx.payment.findFirst.mockResolvedValue(null);tx.payment.create.mockImplementation(async({data})=>({id:"payment-1",...data}));});
 afterAll(()=>{delete process.env.SAFARINEXA_DEMO_MODE;});
 it.each(["mtn","airtel","card","stripe"])("settles %s without a provider and confirms the booking",async(method)=>{
  await expect(processPaymentAction(form(method))).rejects.toThrow("REDIRECT:/payments/receipt?bookingId=booking-1");
  expect(tx.payment.create).toHaveBeenCalledWith({data:expect.objectContaining({status:"SUCCESSFUL",providerReference:expect.stringMatching(/^DEMO-/),amountMinor:200000})});
  expect(tx.booking.update).toHaveBeenCalledWith({where:{id:"booking-1"},data:expect.objectContaining({status:"CONFIRMED"})});
  expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
 });
 it("records a declined attempt and permits retry",async()=>{
  await expect(processPaymentAction(form("mtn","failed"))).rejects.toThrow("REDIRECT:");
  expect(tx.booking.update).toHaveBeenCalledWith({where:{id:"booking-1"},data:{status:"PAYMENT_FAILED"}});
  tx.booking.findUnique.mockResolvedValue({...booking,status:"PAYMENT_FAILED"});
  await expect(processPaymentAction(form())).rejects.toThrow("REDIRECT:");
  expect(tx.payment.create).toHaveBeenLastCalledWith({data:expect.objectContaining({status:"SUCCESSFUL"})});
 });
 it("refuses another customer's booking",async()=>{tx.booking.findUnique.mockResolvedValue({...booking,customerId:"other"});await expect(processPaymentAction(form())).rejects.toThrow("Booking not found");expect(tx.payment.create).not.toHaveBeenCalled();});
 it("does not duplicate payment for a confirmed booking",async()=>{tx.booking.findUnique.mockResolvedValue({...booking,status:"CONFIRMED"});await expect(processPaymentAction(form())).rejects.toThrow("REDIRECT:");expect(tx.payment.create).not.toHaveBeenCalled();});
 it("keeps live mobile money unavailable when demo mode is disabled",async()=>{process.env.SAFARINEXA_DEMO_MODE="false";await expect(processPaymentAction(form())).rejects.toThrow("error=unavailable");expect(tx.payment.create).not.toHaveBeenCalled();});
 it("does not charge zero-value restaurant requests",async()=>{tx.booking.findUnique.mockResolvedValue({...booking,totalMinor:0,status:"AWAITING_BUSINESS_CONFIRMATION"});await expect(processPaymentAction(form())).rejects.toThrow("REDIRECT:");expect(tx.payment.create).not.toHaveBeenCalled();});
 it("notifies the actual business team after successful payment and keeps failures customer-only",async()=>{
  await expect(processPaymentAction(form())).rejects.toThrow("REDIRECT:");
  expect(tx.notification.create).toHaveBeenCalledWith({data:expect.objectContaining({userId:"customer-1",type:"PAYMENT_UPDATE"})});
  expect(tx.notification.createMany).toHaveBeenCalledWith({data:[expect.objectContaining({userId:"owner-1",type:"PAYMENT_UPDATE",relatedBookingId:"booking-1"})]});
  tx.notification.createMany.mockClear();
  await expect(processPaymentAction(form("mtn","failed"))).rejects.toThrow("REDIRECT:");
  expect(tx.notification.createMany).not.toHaveBeenCalled();
 });

});
