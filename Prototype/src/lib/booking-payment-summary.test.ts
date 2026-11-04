import { bookingPaymentSummary } from "./booking-payment-summary";
const payment:any={id:"p",status:"SUCCESSFUL",amountMinor:900000,createdAt:new Date(),refunds:[]};
const booking:any={id:"b",totalMinor:300000,status:"CONFIRMED",payments:[],order:{payments:[payment]}};
test("allocates a shared order payment only to this booking",()=>{expect(bookingPaymentSummary(booking)).toMatchObject({paidMinor:300000,outstandingMinor:0,refundableMinor:300000});});
test("refunds for other businesses do not reduce this booking's balance",()=>{expect(bookingPaymentSummary({...booking,order:{payments:[{...payment,refunds:[{bookingId:"other",status:"COMPLETED",amountMinor:200000}]}]}})).toMatchObject({refundedMinor:0,refundableMinor:300000});});
test("pending refunds reserve balance and partial refunds stay paid",()=>{expect(bookingPaymentSummary({...booking,order:{payments:[{...payment,refunds:[{bookingId:"b",status:"COMPLETED",amountMinor:50000},{bookingId:"b",status:"REQUESTED",amountMinor:100000}]}]}})).toMatchObject({refundedMinor:50000,heldMinor:100000,refundableMinor:150000,status:"PARTIALLY_REFUNDED",outstandingMinor:0});});
test("a failed retry does not erase an earlier confirmed payment",()=>{expect(bookingPaymentSummary({...booking,payments:[{...payment,id:"failed",status:"FAILED",createdAt:new Date(Date.now()+1000)}]}).paidMinor).toBe(300000);});
test("unpaid cancelled bookings have no outstanding debt",()=>{expect(bookingPaymentSummary({id:"b",totalMinor:300000,status:"CANCELLED_BY_BUSINESS",payments:[]})).toMatchObject({paidMinor:0,outstandingMinor:0,refundableMinor:0});});

test("unaccepted requests do not count as money due from the customer",()=>{expect(bookingPaymentSummary({id:"request",totalMinor:300000,status:"AWAITING_BUSINESS_CONFIRMATION",payments:[]}).outstandingMinor).toBe(0);});

test("free reservations are not labelled as unpaid customers",()=>{expect(bookingPaymentSummary({id:"table",totalMinor:0,status:"CONFIRMED",payments:[]})).toMatchObject({category:"NOT_REQUIRED",outstandingMinor:0});});
test("a mixed order still awaiting another business is not due for payment",()=>{expect(bookingPaymentSummary({id:"accepted",totalMinor:300000,status:"PENDING_PAYMENT",payments:[],order:{payments:[],status:"AWAITING_BUSINESS_CONFIRMATION"}}).outstandingMinor).toBe(0);});
