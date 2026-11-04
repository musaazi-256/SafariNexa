/** @jest-environment node */
import { processPaymentAction } from "./actions";
import { db } from "@/lib/db";
jest.mock("@/auth",()=>({auth:jest.fn(async()=>({user:{id:"customer",email:"guest@example.test"}}))}));
jest.mock("next/navigation",()=>({redirect:(path:string)=>{throw new Error(`REDIRECT:${path}`);}}));
jest.mock("next/headers",()=>({headers:()=>new Map()}));
jest.mock("@/lib/stripe",()=>({stripe:{}}));
jest.mock("@/lib/db",()=>({db:{$transaction:jest.fn()}}));
jest.mock("@/lib/dev-mode",()=>({isDemoMode:()=>true}));
let tx:any,booking:any;
beforeEach(()=>{jest.clearAllMocks();booking={id:"b",customerId:"customer",businessId:"biz",bookingRef:"BK",status:"PENDING_PAYMENT",bookingMode:"REQUEST",totalMinor:200000,currency:"UGX",createdAt:new Date(),paymentDueAt:new Date(Date.now()+3600000)};
 tx={booking:{findUnique:jest.fn(async()=>booking),update:jest.fn(async({data})=>Object.assign(booking,data))},payment:{findFirst:jest.fn(async()=>null),create:jest.fn(async({data})=>({id:"p",...data}))},notification:{create:jest.fn(),createMany:jest.fn()},businessUser:{findMany:jest.fn(async()=>[{userId:"owner"}])}};
 (db.$transaction as jest.Mock).mockImplementation(fn=>fn(tx));
});
function form(failed=false){const fd=new FormData();fd.set("bookingId","b");fd.set("method","stripe");if(failed)fd.set("outcome","failed");return fd;}
test("customer demo payment records the server total, confirms booking, and notifies owner",async()=>{await expect(processPaymentAction(form())).rejects.toThrow("REDIRECT:/payments/receipt");expect(tx.payment.create).toHaveBeenCalledWith({data:expect.objectContaining({amountMinor:200000,status:"SUCCESSFUL"})});expect(booking.status).toBe("CONFIRMED");expect(tx.notification.createMany).toHaveBeenCalledWith({data:[expect.objectContaining({userId:"owner",type:"PAYMENT_UPDATE"})]});});
test("failed customer payments remain retryable and notify the business",async()=>{await expect(processPaymentAction(form(true))).rejects.toThrow("REDIRECT:/payments/receipt");expect(booking.status).toBe("PAYMENT_FAILED");expect(tx.notification.createMany).toHaveBeenCalledWith({data:[expect.objectContaining({userId:"owner",title:"Customer payment failed"})]});});
test("a customer cannot pay another customer's booking",async()=>{booking.customerId="another";await expect(processPaymentAction(form())).rejects.toThrow("Booking not found");expect(tx.payment.create).not.toHaveBeenCalled();});
test("an in-flight attempt cannot be charged again",async()=>{tx.payment.findFirst.mockResolvedValue({id:"existing",status:"PROCESSING"});await expect(processPaymentAction(form())).rejects.toThrow("existing%20payment");expect(tx.payment.create).not.toHaveBeenCalled();});
