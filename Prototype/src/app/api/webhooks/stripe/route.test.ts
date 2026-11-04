/** @jest-environment node */
import {POST} from "./route";
import {stripe} from "@/lib/stripe";
import {db} from "@/lib/db";
jest.mock("@/lib/stripe",()=>({stripe:{webhooks:{constructEvent:jest.fn()}}}));
jest.mock("@/lib/db",()=>({db:{$transaction:jest.fn()}}));
jest.mock("@/lib/refund-service",()=>({completeRefund:jest.fn()}));
describe("Signed payment webhook regressions",()=>{
 let payment:any,booking:any,event:any,tx:any;
 beforeEach(()=>{
  jest.clearAllMocks();process.env.STRIPE_WEBHOOK_SECRET="test-webhook-only";
  payment={id:"payment-1",orderId:"order-1",provider:"STRIPE",providerReference:"cs_test",status:"PENDING_PROVIDER_CONFIRMATION",amountMinor:420000,currency:"UGX"};
  booking={id:"booking-1",orderId:"order-1",businessId:"business-1",customerId:"customer-1",bookingRef:"BK-TEST",status:"PENDING_PAYMENT",totalMinor:420000};
  event={id:"evt_test",type:"checkout.session.completed",data:{object:{id:"cs_test",metadata:{paymentId:"payment-1"},currency:"ugx",amount_total:42000000,payment_status:"paid"}}};
  (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(()=>event);
  tx={payment:{findFirst:jest.fn(async()=>payment),findUnique:jest.fn(async()=>payment),update:jest.fn(async({data})=>{Object.assign(payment,data);return payment;})},
      booking:{findMany:jest.fn(async()=>[booking]),update:jest.fn(async({data})=>{Object.assign(booking,data);return booking;})},
      order:{update:jest.fn()},businessUser:{findMany:jest.fn(async()=>[{userId:"business-owner-user"}])},notification:{createMany:jest.fn()}};
  (db.$transaction as jest.Mock).mockImplementation(fn=>fn(tx));
 });
 function request(){return new Request("http://localhost/api/webhooks/stripe",{method:"POST",headers:{"Stripe-Signature":"test"},body:"{}"});}
 afterAll(()=>{delete process.env.STRIPE_WEBHOOK_SECRET;});
 it("rejects invalid signatures without touching data",async()=>{(stripe.webhooks.constructEvent as jest.Mock).mockImplementation(()=>{throw new Error("Bad signature");});expect((await POST(request())).status).toBe(400);expect(db.$transaction).not.toHaveBeenCalled();});
 it("moves a paid booking into business acceptance, not automatic confirmation",async()=>{expect((await POST(request())).status).toBe(200);expect(booking.status).toBe("AWAITING_BUSINESS_CONFIRMATION");expect(payment.status).toBe("SUCCESSFUL");});
 it("confirms an already accepted request after verified provider payment",async()=>{booking.bookingMode="REQUEST";expect((await POST(request())).status).toBe(200);expect(booking.status).toBe("CONFIRMED");expect(booking.confirmedAt).toBeInstanceOf(Date);});
 it("confirms instant bookings after verified provider payment",async()=>{booking.bookingMode="INSTANT";await POST(request());expect(booking.status).toBe("CONFIRMED");});
 it("uses actual user IDs for business notifications",async()=>{await POST(request());const ids=tx.notification.createMany.mock.calls[0][0].data.map((n:any)=>n.userId);expect(ids).toContain("business-owner-user");expect(ids).toContain("customer-1");expect(ids).not.toContain("business-1");});
 it("does not duplicate notifications on replay",async()=>{await POST(request());await POST(request());expect(tx.notification.createMany).toHaveBeenCalledTimes(1);});
 it("keeps the checkout-session reference immutable",async()=>{await POST(request());expect(payment.providerReference).toBe("cs_test");});
 it("does not settle unpaid asynchronous checkouts",async()=>{event.data.object.payment_status="unpaid";expect((await POST(request())).status).toBe(200);expect(tx.payment.update).not.toHaveBeenCalled();});
 it("rejects mismatched amounts",async()=>{event.data.object.amount_total=420000;expect((await POST(request())).status).toBe(500);expect(tx.booking.update).not.toHaveBeenCalled();});
 it("rejects mismatched currencies",async()=>{event.data.object.currency="usd";expect((await POST(request())).status).toBe(500);expect(tx.booking.update).not.toHaveBeenCalled();});
 it("cannot resurrect cancelled bookings",async()=>{booking.status="CANCELLED_BY_CUSTOMER";expect((await POST(request())).status).toBe(500);expect(tx.booking.update).not.toHaveBeenCalled();});
 it("does not confirm an unknown payment",async()=>{payment=null;expect((await POST(request())).status).toBe(500);expect(tx.booking.update).not.toHaveBeenCalled();});
 it("ignores unrelated event types",async()=>{event.type="customer.created";expect((await POST(request())).status).toBe(200);expect(db.$transaction).not.toHaveBeenCalled();});
 it("records failed provider payments on the booking and notifies the business",async()=>{event.type="checkout.session.async_payment_failed";event.data.object.payment_status="unpaid";expect((await POST(request())).status).toBe(200);expect(booking.status).toBe("PAYMENT_FAILED");expect(payment.status).toBe("FAILED");expect(tx.notification.createMany).toHaveBeenCalledWith({data:expect.arrayContaining([expect.objectContaining({userId:"business-owner-user",title:"Payment not completed"})])});});

});
