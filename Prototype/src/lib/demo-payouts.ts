import type { Prisma } from "@prisma/client";
import { PLATFORM_COMMISSION_RATE } from "@/lib/revenue";

type AllocationInput = {
  amountMinor: number;
  bookings: Array<{ id: string; businessId: string; totalMinor: number; verificationStatus: string }>;
  refunds: Array<{ bookingId: string; amountMinor: number; status: string }>;
};

export function demoPayoutAllocations({ amountMinor, bookings, refunds }: AllocationInput) {
  if (bookings.reduce((sum, booking) => sum + booking.totalMinor, 0) !== amountMinor ||
      bookings.some(booking => booking.totalMinor > 0 && booking.verificationStatus !== "APPROVED") ||
      refunds.some(refund => ["REQUESTED", "PROCESSING"].includes(refund.status))) return [];
  const totals = new Map<string, number>();
  for (const booking of bookings) {
    const refunded = refunds.filter(refund => refund.bookingId === booking.id && refund.status === "COMPLETED").reduce((sum, refund) => sum + refund.amountMinor, 0);
    const retained = Math.max(0, booking.totalMinor - refunded);
    totals.set(booking.businessId, (totals.get(booking.businessId) ?? 0) + retained);
  }
  return [...totals].map(([businessId, gross]) => ({ businessId, amountMinor: gross - Math.round(gross * PLATFORM_COMMISSION_RATE) })).filter(allocation => allocation.amountMinor > 0);
}

export async function demoPayoutCandidates(tx: Prisma.TransactionClient) {
  const payments = await tx.payment.findMany({
    where: { providerReference: { startsWith: "DEMO-" }, payoutId: null, status: { in: ["SUCCESSFUL", "PARTIALLY_REFUNDED"] } },
    include: { booking: { include: { business: true } }, order: { include: { bookings: { include: { business: true } } } }, refunds: true }
  });
  return payments.map(payment => ({
    payment,
    allocations: demoPayoutAllocations({ amountMinor: payment.amountMinor, bookings: (payment.booking ? [payment.booking] : payment.order?.bookings ?? []).map(booking => ({ ...booking, verificationStatus: booking.business.verificationStatus })), refunds: payment.refunds })
  })).filter(candidate => candidate.allocations.length);
}

/** Call only after the demo flag and admin permission have been checked. */
export async function settleDemoPayouts(tx: Prisma.TransactionClient) {
  const candidates = await demoPayoutCandidates(tx);
  const payoutIds: string[] = [];
  for (const { payment, allocations } of candidates) {
    let firstPayoutId: string | undefined;
    for (const allocation of allocations) {
      const payout = await tx.payout.create({ data: { ...allocation, currency: payment.currency, status: "COMPLETED", providerReference: `DEMO-PAYOUT-${payment.id}-${allocation.businessId}`, notes: `Simulated settlement of payment ${payment.id}. No money transferred.` } });
      firstPayoutId ??= payout.id;
      payoutIds.push(payout.id);
      const business=payment.booking?.business.id===allocation.businessId?payment.booking.business:payment.order?.bookings.find(booking=>booking.businessId===allocation.businessId)?.business;
      const members=await tx.businessUser.findMany({where:{businessId:allocation.businessId},select:{userId:true}});
      const recipients=[...new Set(members.map(member=>member.userId))];
      if(recipients.length)await tx.notification.createMany({data:recipients.map(userId=>({userId,type:"PAYMENT_UPDATE" as const,title:"Payout completed",body:`A payout of ${payment.currency} ${allocation.amountMinor.toLocaleString("en-UG")} was recorded for ${business?.name??"your business"}. Open Earnings to view the payout ledger.`}))});
    }
    // One payment may fund several businesses. Link it once to mark the whole
    // allocation batch settled; each business has its own payout record above.
    await tx.payment.update({ where: { id: payment.id }, data: { payoutId: firstPayoutId } });
  }
  return payoutIds;
}
