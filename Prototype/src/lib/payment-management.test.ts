import type { Prisma } from "@prisma/client";
import { authorizePaymentActor, createBookingRefund, approveBookingRefund, refundAmount, rejectBookingRefund, remindBookingPayment } from "./payment-management";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
jest.mock("@/lib/db",()=>({db:{$transaction:jest.fn(),auditLog:{findFirst:jest.fn()}}}));
jest.mock("@/lib/stripe",()=>({stripe:{checkout:{sessions:{retrieve:jest.fn()}},refunds:{create:jest.fn(),retrieve:jest.fn()}}}));
jest.mock("@/lib/refund-service",()=>({completeRefund:jest.fn(),finishCancelledRefund:jest.fn()}));
const actor={userId:"owner",surface:"BUSINESS" as const,businessId:"biz"};
let tx:any,booking:any,payment:any;
beforeEach(()=>{jest.clearAllMocks();
 payment={id:"p",provider:"STRIPE",providerReference:"cs_test",status:"SUCCESSFUL",amountMinor:900000,currency:"UGX",createdAt:new Date(),refunds:[]};
 booking={id:"b",businessId:"biz",customerId:"customer",totalMinor:300000,bookingRef:"BK",status:"CONFIRMED",payments:[],order:{payments:[payment]}};
 tx={businessUser:{findFirst:jest.fn(async()=>({role:"OWNER"}))},adminUser:{findUnique:jest.fn()},booking:{findUnique:jest.fn(async()=>booking)},refund:{findUnique:jest.fn(async()=>null),aggregate:jest.fn(async()=>({_sum:{amountMinor:0}})),create:jest.fn(async({data})=>data),updateMany:jest.fn(async()=>({count:1}))},auditLog:{create:jest.fn(),findFirst:jest.fn(async()=>null)},notification:{create:jest.fn()}};
 (db.$transaction as jest.Mock).mockImplementation(fn=>fn(tx));
 (db.auditLog.findFirst as jest.Mock).mockResolvedValue({createdAt:new Date(),metadata:{}});
 process.env.STRIPE_SECRET_KEY="test";
});
afterAll(()=>{delete process.env.STRIPE_SECRET_KEY;});
test("cross-workspace requests fail even for a manager elsewhere",async()=>{await expect(authorizePaymentActor(tx,{...actor,businessId:"other"},"biz")).rejects.toThrow("active business");expect(tx.businessUser.findFirst).not.toHaveBeenCalled();});
test("staff cannot perform financial operations",async()=>{tx.businessUser.findFirst.mockResolvedValue(null);await expect(authorizePaymentActor(tx,actor,"biz")).rejects.toThrow("owners and managers");});
test("admin support requires an active payments capability",async()=>{tx.adminUser.findUnique.mockResolvedValue({status:"ACTIVE",role:{name:"Support Agent",permissions:[]}});await expect(authorizePaymentActor(tx,{userId:"admin",surface:"ADMIN"},"biz")).rejects.toThrow("permission");});
test("a business cannot refund another business's combined-order allocation",async()=>{await expect(createBookingRefund(actor,"b",300001,"Guest requested a refund","request-id-12345")).rejects.toThrow("available paid amount");expect(tx.refund.create).not.toHaveBeenCalled();});
test("pending refunds across the combined payment reserve its remaining balance",async()=>{tx.refund.aggregate.mockResolvedValue({_sum:{amountMinor:850000}});await expect(createBookingRefund(actor,"b",100000,"Guest requested a refund","request-id-12345")).rejects.toThrow("remaining payment balance");});
test("a valid partial refund is scoped, audited, and notifies the customer",async()=>{await createBookingRefund(actor,"b",100000,"Guest requested a refund","request-id-12345");expect(tx.refund.create).toHaveBeenCalledWith({data:expect.objectContaining({bookingId:"b",paymentId:"p",amountMinor:100000,requestedByUserId:"owner"})});expect(tx.auditLog.create).toHaveBeenCalled();expect(tx.notification.create).toHaveBeenCalled();});
test("repeating a request token returns the existing refund",async()=>{tx.refund.findUnique.mockResolvedValue({id:"refund-request-id-12345",bookingId:"b"});await createBookingRefund(actor,"b",100000,"Guest requested a refund","request-id-12345");expect(tx.refund.create).not.toHaveBeenCalled();});
test("provider refund retries use the same idempotency key",async()=>{tx.refund.findUnique.mockResolvedValue({id:"r",status:"PROCESSING",amountMinor:100000,bookingId:"b",paymentId:"p",booking,payment});(stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({payment_intent:"pi_test",payment_status:"paid",amount_total:90000000,currency:"ugx"});(stripe.refunds.create as jest.Mock).mockResolvedValue({id:"re_test",status:"pending",amount:10000000,currency:"ugx",metadata:{refundId:"r"}});await approveBookingRefund(actor,"r");expect(stripe.refunds.create).toHaveBeenCalledWith(expect.objectContaining({amount:10000000}),{idempotencyKey:"refund:r"});});
test("cannot decline a refund already sent to the provider",async()=>{tx.refund.findUnique.mockResolvedValue({id:"r",bookingId:"b",booking});tx.refund.updateMany.mockResolvedValue({count:0});await expect(rejectBookingRefund(actor,"r","Request is outside the policy")).rejects.toThrow("not reached the provider");});
test.each(["-1","0","1.2","1e3","", "9007199254740992"])("rejects invalid refund amount %s",value=>{expect(()=>refundAmount(value)).toThrow();});
test("existing provider refunds are checked rather than submitted again",async()=>{
 tx.refund.findUnique.mockResolvedValue({id:"r",status:"PROCESSING",amountMinor:100000,bookingId:"b",paymentId:"p",booking,payment});
 (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({payment_intent:"pi_test",payment_status:"paid",amount_total:90000000,currency:"ugx"});
 (db.auditLog.findFirst as jest.Mock).mockResolvedValue({metadata:{providerRefundId:"re_existing"}});
 (stripe.refunds.retrieve as jest.Mock).mockResolvedValue({id:"re_existing",status:"pending",amount:10000000,currency:"ugx",metadata:{refundId:"r"}});
 await approveBookingRefund(actor,"r");expect(stripe.refunds.retrieve).toHaveBeenCalledWith("re_existing");expect(stripe.refunds.create).not.toHaveBeenCalled();
});
test("old processing requests without a provider result cannot create a second refund",async()=>{
 tx.refund.findUnique.mockResolvedValue({id:"r",status:"PROCESSING",amountMinor:100000,bookingId:"b",paymentId:"p",booking,payment});
 (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({payment_intent:"pi_test",payment_status:"paid",amount_total:90000000,currency:"ugx"});
 (db.auditLog.findFirst as jest.Mock).mockResolvedValue(null);
 await expect(approveBookingRefund(actor,"r")).rejects.toThrow("older refund");expect(stripe.refunds.create).not.toHaveBeenCalled();
});

test("unpaid booking reminders notify the customer without changing payment records",async()=>{
 booking.status="PENDING_PAYMENT";booking.order=null;booking.createdAt=new Date();booking.paymentDueAt=new Date(Date.now()+60000);
 await remindBookingPayment(actor,"b");expect(tx.notification.create).toHaveBeenCalledWith({data:expect.objectContaining({userId:"customer",title:"Payment reminder"})});
});
test("payment reminders cannot be spammed repeatedly",async()=>{
 booking.status="PENDING_PAYMENT";booking.order=null;booking.createdAt=new Date();booking.paymentDueAt=new Date(Date.now()+60000);tx.auditLog.findFirst.mockResolvedValue({id:"recent"});
 await expect(remindBookingPayment(actor,"b")).rejects.toThrow("15 minutes");expect(tx.notification.create).not.toHaveBeenCalled();
});
test("unsupported providers cannot be silently marked refunded",async()=>{
 payment.provider="MTN_MOBILE_MONEY";payment.providerReference="provider-manual-reference";
 tx.refund.findUnique.mockResolvedValue({id:"r",status:"REQUESTED",amountMinor:100000,bookingId:"b",paymentId:"p",booking,payment});
 await expect(approveBookingRefund(actor,"r")).rejects.toThrow("reconciliation");expect(tx.refund.updateMany).not.toHaveBeenCalled();expect(stripe.refunds.create).not.toHaveBeenCalled();
});
