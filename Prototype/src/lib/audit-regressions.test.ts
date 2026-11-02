import { nightsBetween } from "./booking";
import { parseRoomTypeRows } from "./business-listing-form";
import { paymentStatusFilter, receiptState, stripeAmount } from "./payment-state";
import { summarizePayments } from "./revenue";
describe("Audit regression guards", () => {
  test.each([["2026-12-05","2026-12-05"],["2026-12-06","2026-12-05"],["invalid","invalid"]])("rejects invalid stay %s to %s",(start,end)=>expect(nightsBetween(start,end)).toBe(0));
  it("counts valid nights",()=>expect(nightsBetween("2026-12-05","2026-12-08")).toBe(3));
  it("saves an unchecked refund checkbox as false",()=>{const f=new FormData();f.set("roomTypeCount","1");f.set("roomTypeName_0","Room");expect(parseRoomTypeRows(f)[0].isRefundable).toBe(false);});
  it("saves checked refund policy",()=>{const f=new FormData();f.set("roomTypeCount","1");f.set("roomTypeName_0","Room");f.set("roomTypeIsRefundable_0","on");expect(parseRoomTypeRows(f)[0].isRefundable).toBe(true);});
  it("never calls an unpaid receipt paid",()=>expect(receiptState(undefined).paid).toBe(false));
  it("represents asynchronous confirmation as pending",()=>expect(receiptState("PENDING_PROVIDER_CONFIRMATION").pending).toBe(true));
  it("does not call refunded payments successful",()=>expect(receiptState("REFUNDED").title).toBe("Payment refunded"));
  it("maps the pending UI filter to valid statuses",()=>expect(paymentStatusFilter("pending")).toContain("PROCESSING"));
  it("ignores unknown enum inputs",()=>expect(paymentStatusFilter("bogus")).toBeUndefined());
  it("uses Stripe special-case UGX units",()=>expect(stripeAmount(420000,"UGX")).toBe(42000000));
  it("rejects fractional/unsupported amounts",()=>{expect(()=>stripeAmount(0.1,"UGX")).toThrow();expect(()=>stripeAmount(100,"USD")).toThrow();});
  it("accounts for actual partial refunds, not the whole payment",()=>{const result=summarizePayments([{status:"PARTIALLY_REFUNDED",amountMinor:100000,refunds:[{amountMinor:25000,status:"COMPLETED"}]}]);expect(result.grossMinor).toBe(100000);expect(result.refundedMinor).toBe(25000);expect(result.netMinor).toBe(66000);});
});
