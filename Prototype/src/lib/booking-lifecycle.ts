import { notifyAdmins } from "@/lib/admin-notifications";
import type { Prisma } from "@prisma/client";
export const CANCELLABLE = ["AUTH_REQUIRED", "PENDING_TRAVELLER_DETAILS", "PENDING_PAYMENT", "PAYMENT_FAILED", "AWAITING_BUSINESS_CONFIRMATION", "CONFIRMED"];
import { releaseAvailabilityForBooking } from "@/lib/booking-service";
import { PAYMENT_MINUTES, RESPONSE_HOURS, nextAfterAcceptance } from "@/lib/booking-operations";

export async function syncOrderStatus(tx: Prisma.TransactionClient, orderId: string | null) {
  if (!orderId) return;
  const bookings = await tx.booking.findMany({ where: { orderId }, select: { status: true, totalMinor: true } });
  const cancelled = ["CANCELLED_BY_CUSTOMER", "CANCELLED_BY_BUSINESS", "CANCELLED_BY_ADMIN", "REFUNDED"];
  const statuses = bookings.map(b => b.status);
  const status = statuses.every(s => s === "REFUNDED") ? "REFUNDED"
    : statuses.every(s => cancelled.includes(s)) ? "CANCELLED_BY_CUSTOMER"
    : statuses.some(s => s === "REFUND_REQUESTED" || s === "REFUND_PROCESSING") ? "REFUND_REQUESTED"
    : statuses.every(s => ["COMPLETED", "REVIEW_PENDING", "REVIEWED", ...cancelled].includes(s)) ? "COMPLETED"
    : statuses.every(s => ["CONFIRMED", "COMPLETED", "REVIEW_PENDING", "REVIEWED", ...cancelled].includes(s)) ? "CONFIRMED"
    : statuses.some(s => ["PENDING_PAYMENT", "PAYMENT_FAILED"].includes(s)) ? "PENDING_PAYMENT"
    : statuses.some(s => s === "AWAITING_BUSINESS_CONFIRMATION") ? "AWAITING_BUSINESS_CONFIRMATION"
    : "PENDING_PAYMENT";
  const payment = await tx.payment.findFirst({where:{orderId,status:{in:["SUCCESSFUL","PARTIALLY_REFUNDED","REFUNDED","PROCESSING","PENDING_PROVIDER_CONFIRMATION"]}}});
  const totalMinor = payment ? undefined : bookings.filter(b => !cancelled.includes(b.status)).reduce((sum,b)=>sum+b.totalMinor,0);
  await tx.order.update({ where: { id: orderId }, data: { status, ...(totalMinor === undefined ? {} : {totalMinor}) } });
}

export async function cancelReservedBooking(tx: Prisma.TransactionClient, bookingId: string, actorId: string, surface: "customer" | "business") {
  const booking = await tx.booking.findUnique({ where: { id: bookingId }, include: { roomType: true } });
  if (!booking) throw new Error("Booking not found.");
  if (surface === "customer" && booking.customerId !== actorId) throw new Error("Unauthorized");
  if (surface === "business" && !await tx.businessUser.findFirst({ where: { businessId: booking.businessId, userId: actorId, role: { in: ["OWNER", "MANAGER"] } } })) throw new Error("Unauthorized");
  if (!CANCELLABLE.includes(booking.status)) return;
  const paymentWhere = { OR: [{ bookingId }, ...(booking.orderId ? [{ orderId: booking.orderId }] : [])] };
  const active = booking.totalMinor > 0 ? await tx.payment.findFirst({ where: { ...paymentWhere, status: { in: ["PROCESSING", "PENDING_PROVIDER_CONFIRMATION"] } } }) : null;
  if (active) throw new Error("Payment is still in progress. Contact support or wait for provider confirmation before cancelling.");
  const payment = booking.totalMinor > 0 ? await tx.payment.findFirst({ where: { ...paymentWhere, status: { in: ["SUCCESSFUL", "PARTIALLY_REFUNDED"] } }, orderBy: { createdAt: "desc" } }) : null;
  const policy = booking.policySnapshot as {isRefundable?:boolean} | null;
  if (payment && surface === "customer" && (policy?.isRefundable === false || !policy && booking.roomType && !booking.roomType.isRefundable)) throw new Error("This room has a non-refundable policy. Please contact support.");
  const cancelledStatus = surface === "customer" ? "CANCELLED_BY_CUSTOMER" : "CANCELLED_BY_BUSINESS";
  const claimed = await tx.booking.updateMany({ where: { id: booking.id, status: booking.status }, data: {
    status: payment ? "REFUND_REQUESTED" : cancelledStatus,
    cancelledAt: new Date(), responseDueAt:null,paymentDueAt:null, cancelReason: surface === "customer" ? "Cancelled by customer" : "Declined by business"
  } });
  if (!claimed.count) return;
  if (payment) {
    await tx.refund.create({ data: {
      paymentId: payment.id, bookingId, amountMinor: booking.totalMinor,
      reason: surface === "customer" ? "Customer cancellation" : "Business declined booking",
      status: "REQUESTED", requestedByUserId: actorId
    } });
  } else await releaseAvailabilityForBooking(tx, bookingId);
  await syncOrderStatus(tx, booking.orderId);
  if(payment) await notifyAdmins(tx,"payments.manage",{type:"PAYMENT_UPDATE",title:"Refund request needs review",body:`Booking ${booking.bookingRef} was cancelled and has a refund request awaiting review.`,relatedBookingId:bookingId},actorId);
  await tx.notification.create({ data: { userId: booking.customerId, type: "BOOKING_UPDATE",
    title: payment ? "Refund requested" : "Booking cancelled",
    body: `Booking ${booking.bookingRef}: ${payment ? "a refund has been requested; it is not yet completed" : "reservation cancelled"}.`, relatedBookingId: bookingId } });
  const members=await tx.businessUser.findMany({where:{businessId:booking.businessId,role:{in:["OWNER","MANAGER"]}},select:{userId:true}});
  await tx.notification.createMany({data:members.map(member=>({userId:member.userId,type:"BOOKING_UPDATE" as const,title:payment?"Booking cancellation — refund requested":"Booking cancelled",body:`Booking ${booking.bookingRef}: ${surface === "customer" ? "cancelled by customer" : "declined by business"}. Check the updated booking and inventory.`,relatedBookingId:bookingId}))});
}

export async function acceptBookingRequest(tx: Prisma.TransactionClient, bookingId: string, actorId: string) {
  const booking = await tx.booking.findUnique({where:{id:bookingId}});
  if (!booking || !await tx.businessUser.findFirst({where:{businessId:booking.businessId,userId:actorId,role:{in:["OWNER","MANAGER"]}}})) throw new Error("Booking not found or access denied.");
  if (booking.status !== "AWAITING_BUSINESS_CONFIRMATION") throw new Error("This booking no longer needs a response.");
  if (booking.responseDueAt && booking.responseDueAt <= new Date()) throw new Error("This request has expired. Ask the customer to submit a new request.");
  const status = nextAfterAcceptance(booking);
  const updated = await tx.booking.updateMany({where:{id:booking.id,status:"AWAITING_BUSINESS_CONFIRMATION"},data:{status,responseDueAt:null,confirmedAt:status === "CONFIRMED" ? new Date():null,paymentDueAt:status === "PENDING_PAYMENT" ? new Date(Math.min(Date.now()+(booking.orderId?RESPONSE_HOURS*60:PAYMENT_MINUTES)*60000,booking.startDate?.getTime() ?? Infinity)):null}});
  if (!updated.count) throw new Error("Booking changed; refresh before responding.");
  if(booking.orderId && !await tx.booking.count({where:{orderId:booking.orderId,status:"AWAITING_BUSINESS_CONFIRMATION"}})) {
    const pending=await tx.booking.findMany({where:{orderId:booking.orderId,status:"PENDING_PAYMENT",bookingMode:"REQUEST"}});
    for(const child of pending)await tx.booking.update({where:{id:child.id},data:{paymentDueAt:new Date(Math.min(Date.now()+PAYMENT_MINUTES*60000,child.startDate?.getTime() ?? Infinity))}});
  }
  await syncOrderStatus(tx,booking.orderId);
  await tx.notification.create({data:{userId:booking.customerId,type:"BOOKING_UPDATE",title:status === "PENDING_PAYMENT" ? "Request accepted — payment needed" : "Booking confirmed",body:`Booking ${booking.bookingRef}: ${status === "PENDING_PAYMENT" ? "the business accepted your request. Pay within the displayed payment window to confirm" : "confirmed by the business"}.`,relatedBookingId:booking.id}});
  return status;
}
