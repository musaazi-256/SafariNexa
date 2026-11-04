import { summarizePayments } from "./revenue";

test("pending settlement includes retained value after a partial refund", () => {
  expect(summarizePayments([{ status: "PARTIALLY_REFUNDED", amountMinor: 100000, refunds: [{ amountMinor: 25000, status: "COMPLETED" }] }]).unsettledNetMinor).toBe(66000);
});

test("fully refunded and already settled payments do not inflate pending payouts", () => {
  expect(summarizePayments([{ status: "REFUNDED", amountMinor: 100000 }, { status: "SUCCESSFUL", amountMinor: 100000, payoutId: "demo-payout" }]).unsettledNetMinor).toBe(0);
});
