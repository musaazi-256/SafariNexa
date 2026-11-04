import { Prisma, type Surface } from "@prisma/client";
import { notifyAdmins } from "@/lib/admin-notifications";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { isDemoMode } from "@/lib/dev-mode";
import { stripeAmount } from "@/lib/payment-state";
import { completeRefund, finishCancelledRefund } from "@/lib/refund-service";
import { bookingPaymentSummary, RECEIVED_PAYMENT_STATUSES } from "@/lib/booking-payment-summary";
import { paymentDeadline } from "@/lib/booking-operations";
import { reconcileCheckout } from "@/lib/payment-reconciliation";
export type PaymentActor = { userId: string; email?: string; surface: "BUSINESS" | "ADMIN"; businessId?: string };

export async function authorizePaymentActor(tx: Prisma.TransactionClient, actor: PaymentActor, businessId: string) {
  if (actor.surface === "BUSINESS") {
    if (actor.businessId !== businessId || !await tx.businessUser.findFirst({where:{businessId,userId:actor.userId,role:{in:["OWNER","MANAGER"]}}})) throw new Error("Only owners and managers of the active business can manage this payment.");
  } else {
    const admin = await tx.adminUser.findUnique({where:{userId:actor.userId},include:{role:{include:{permissions:{include:{permission:true}}}}}});
    if (!admin || admin.status!=="ACTIVE" || (admin.role.name!=="Super Admin" && !admin.role.permissions.some(p=>p.permission.key==="payments.manage"))) throw new Error("Payment support permission required.");
  }
}
async function audit(tx: Prisma.TransactionClient, actor: PaymentActor, action: string, metadata: Prisma.InputJsonObject) {
  await tx.auditLog.create({data:{actorUserId:actor.userId,actorEmail:actor.email,surface:actor.surface as Surface,action,outcome:"SUCCESS",metadata}});
}
export function refundAmount(raw: unknown) {
  const text=String(raw??"").trim();
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text)) || Number(text)<=0) throw new Error("Enter a positive whole UGX refund amount.");
  return Number(text);
}
export async function createBookingRefund(actor: PaymentActor, bookingId: string, amountMinor: number, reason: string, requestId: string) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor<=0 || reason.trim().length<5 || reason.length>1000 || !/^[a-zA-Z0-9-]{10,100}$/.test(requestId)) throw new Error("Enter a valid refund amount and reason (5–1000 characters).");
  return db.$transaction(async tx=>{
    const booking=await tx.booking.findUnique({where:{id:bookingId},include:{payments:{include:{refunds:true}},order:{include:{payments:{include:{refunds:true}}}}}});
    if (!booking) throw new Error("Booking not found.");
    await authorizePaymentActor(tx,actor,booking.businessId);
    const existing=await tx.refund.findUnique({where:{id:`refund-${requestId}`}});
    if(existing){if(existing.bookingId!==booking.id)throw new Error("Refund reference mismatch.");return existing;}
    const summary=bookingPaymentSummary(booking);
    if(!summary.payment || amountMinor>summary.refundableMinor)throw new Error("Refund exceeds the available paid amount for this booking.");
    const reserved=await tx.refund.aggregate({where:{paymentId:summary.payment.id,status:{in:["REQUESTED","PROCESSING","COMPLETED"]}},_sum:{amountMinor:true}});
    if(amountMinor+(reserved._sum.amountMinor??0)>summary.payment.amountMinor)throw new Error("Refund exceeds the remaining payment balance.");
    const refund=await tx.refund.create({data:{id:`refund-${requestId}`,bookingId,paymentId:summary.payment.id,amountMinor,reason:reason.trim(),requestedByUserId:actor.userId}});
    await audit(tx,actor,"refund_requested",{bookingId,refundId:refund.id,amountMinor,reason:reason.trim()});
    await tx.notification.create({data:{userId:booking.customerId,type:"PAYMENT_UPDATE",title:"Refund requested",body:`A refund of UGX ${amountMinor.toLocaleString("en-UG")} was requested for ${booking.bookingRef}. It is not yet completed.`,relatedBookingId:bookingId}});
    return refund;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
export async function approveBookingRefund(actor: PaymentActor, refundId: string) {
  const target=await db.$transaction(async tx=>{
    const refund=await tx.refund.findUnique({where:{id:refundId},include:{payment:true,booking:true}});
    if(!refund)throw new Error("Refund not found.");
    await authorizePaymentActor(tx,actor,refund.booking.businessId);
    if(refund.status==="COMPLETED")return refund;
    if(!["REQUESTED","PROCESSING"].includes(refund.status) || !RECEIVED_PAYMENT_STATUSES.includes(refund.payment.status))throw new Error("This refund cannot be processed.");
    const allocated=await tx.refund.aggregate({where:{paymentId:refund.paymentId,status:{in:["REQUESTED","PROCESSING","COMPLETED"]}},_sum:{amountMinor:true}});
    const bookingAllocated=await tx.refund.aggregate({where:{bookingId:refund.bookingId,status:{in:["REQUESTED","PROCESSING","COMPLETED"]}},_sum:{amountMinor:true}});
    if((allocated._sum.amountMinor??0)>refund.payment.amountMinor || (bookingAllocated._sum.amountMinor??0)>refund.booking.totalMinor)throw new Error("Refund allocations exceed the paid balance. Escalate to support.");
    const demo=isDemoMode()&&refund.payment.providerReference?.startsWith("DEMO-");
    if(!demo && (refund.payment.provider!=="STRIPE" || !refund.payment.providerReference?.startsWith("cs_") || !process.env.STRIPE_SECRET_KEY)) throw new Error("This provider needs reconciliation. Use Escalate to support; no refund has been marked completed.");
    await tx.refund.updateMany({where:{id:refund.id,status:{in:["REQUESTED","PROCESSING"]}},data:{status:"PROCESSING",...(actor.surface==="ADMIN"?{reviewedByAdminId:actor.userId}:{})}});
    await audit(tx,actor,"refund_processing",{bookingId:refund.bookingId,refundId,amountMinor:refund.amountMinor});
    return refund;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  if(target.status==="COMPLETED")return "Refund already completed.";
  if(isDemoMode()&&target.payment.providerReference?.startsWith("DEMO-")) {
    await db.$transaction(async tx=>{await completeRefund(tx,refundId);await audit(tx,actor,"demo_refund_completed",{refundId,bookingId:target.bookingId});},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return "Demo refund completed. No funds moved.";
  }
  const checkout=await stripe.checkout.sessions.retrieve(target.payment.providerReference!);
  const intent=typeof checkout.payment_intent==="string"?checkout.payment_intent:checkout.payment_intent?.id;
  if(!intent||checkout.payment_status!=="paid"||checkout.amount_total!==stripeAmount(target.payment.amountMinor,target.payment.currency)||checkout.currency?.toUpperCase()!==target.payment.currency)throw new Error("Provider payment does not match the recorded amount. Escalate to support.");
  const priorResult=await db.auditLog.findFirst({where:{action:"refund_provider_result",metadata:{path:["refundId"],equals:refundId}},orderBy:{createdAt:"desc"}});
  const priorProviderId=(priorResult?.metadata as {providerRefundId?:string}|null)?.providerRefundId;
  if(!priorProviderId && target.status==="PROCESSING") {
    const firstAttempt=await db.auditLog.findFirst({where:{action:"refund_processing",metadata:{path:["refundId"],equals:refundId}},orderBy:{createdAt:"asc"}});
    if(!firstAttempt || firstAttempt.createdAt.getTime()<Date.now()-23*3600000) throw new Error("This older refund needs provider reconciliation by support before another submission.");
  }
  const providerRefund=priorProviderId ? await stripe.refunds.retrieve(priorProviderId) : await stripe.refunds.create({payment_intent:intent,amount:stripeAmount(target.amountMinor,target.payment.currency),metadata:{refundId}},{idempotencyKey:`refund:${refundId}`});
  if(providerRefund.amount!==stripeAmount(target.amountMinor,target.payment.currency)||providerRefund.currency.toUpperCase()!==target.payment.currency||providerRefund.metadata?.refundId!==refundId)throw new Error("Provider refund does not match this request. Escalate to support.");
  await db.$transaction(async tx=>{
    if(providerRefund.status==="succeeded")await completeRefund(tx,refundId);
    else if(["failed","canceled"].includes(providerRefund.status??"")){await tx.refund.updateMany({where:{id:refundId,status:"PROCESSING"},data:{status:"REJECTED"}});await finishCancelledRefund(tx,target.bookingId);}
    await audit(tx,actor,"refund_provider_result",{refundId,bookingId:target.bookingId,status:providerRefund.status??"pending",providerRefundId:providerRefund.id});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return providerRefund.status==="succeeded"?"Refund confirmed by provider.": ["failed","canceled"].includes(providerRefund.status??"")?"Provider could not complete the refund. Escalate to support.":"Refund submitted; awaiting provider confirmation.";
}
export async function rejectBookingRefund(actor: PaymentActor, refundId: string, reason: string) {
  if(reason.trim().length<5||reason.length>1000)throw new Error("Explain why the refund is declined (5–1000 characters).");
  await db.$transaction(async tx=>{
    const refund=await tx.refund.findUnique({where:{id:refundId},include:{booking:true}});
    if(!refund)throw new Error("Refund not found.");
    await authorizePaymentActor(tx,actor,refund.booking.businessId);
    const changed=await tx.refund.updateMany({where:{id:refundId,status:"REQUESTED"},data:{status:"REJECTED",...(actor.surface==="ADMIN"?{reviewedByAdminId:actor.userId}:{})}});
    if(!changed.count)throw new Error("Only a refund that has not reached the provider can be declined.");
    await finishCancelledRefund(tx,refund.bookingId);
    await audit(tx,actor,"refund_rejected",{refundId,bookingId:refund.bookingId,reason:reason.trim()});
    await tx.notification.create({data:{userId:refund.booking.customerId,type:"PAYMENT_UPDATE",title:"Refund declined",body:`Refund for ${refund.booking.bookingRef}: ${reason.trim()}`,relatedBookingId:refund.bookingId}});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
export async function verifyBookingPayment(actor: PaymentActor, bookingId: string) {
  const payment=await db.$transaction(async tx=>{
    const booking=await tx.booking.findUnique({where:{id:bookingId},include:{payments:{include:{refunds:true}},order:{include:{payments:{include:{refunds:true}}}}}});
    if(!booking)throw new Error("Booking not found.");await authorizePaymentActor(tx,actor,booking.businessId);
    return bookingPaymentSummary(booking).payment;
  });
  if(!payment||payment.provider!=="STRIPE"||!payment.providerReference?.startsWith("cs_")||!process.env.STRIPE_SECRET_KEY)throw new Error("Provider verification is unavailable for this payment. Escalate to support.");
  const checkout=await stripe.checkout.sessions.retrieve(payment.providerReference);
  await db.$transaction(async tx=>{await reconcileCheckout(tx,payment.id,checkout,checkout.status==="expired");await audit(tx,actor,"payment_verified",{bookingId,paymentId:payment.id,providerStatus:checkout.payment_status});},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return checkout.payment_status==="paid"?"Provider payment verified.":checkout.status==="expired"?"Payment session expired; customer can retry within the payment window.":"Provider has not confirmed payment yet.";
}
export async function escalateBookingPayment(actor: PaymentActor, bookingId: string, reason: string) {
  if(reason.trim().length<5||reason.length>1000)throw new Error("Describe the issue (5–1000 characters).");
  return db.$transaction(async tx=>{
    const booking=await tx.booking.findUnique({where:{id:bookingId}});if(!booking)throw new Error("Booking not found.");await authorizePaymentActor(tx,actor,booking.businessId);
    const id=`payment-support-${bookingId}`;
    const support=await tx.supportCase.upsert({where:{id},update:{status:"OPEN",closedAt:null},create:{id,caseRef:`PAY-${booking.bookingRef}`,openedByUserId:actor.userId,surface:actor.surface,relatedBookingId:bookingId,subject:`Payment help: ${booking.bookingRef}`,category:"Payments"}});
    await tx.supportMessage.create({data:{supportCaseId:support.id,authorUserId:actor.userId,authorRole:actor.surface,body:reason.trim()}});
    await audit(tx,actor,"payment_escalated",{bookingId,supportCaseId:id});
    await notifyAdmins(tx,"payments.manage",{type:"SUPPORT_UPDATE",title:"Business needs payment support",body:`${booking.bookingRef}: ${reason.trim()}`,relatedBookingId:bookingId,relatedSupportCaseId:support.id},actor.userId);return support;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}

export async function remindBookingPayment(actor: PaymentActor, bookingId: string) {
  await db.$transaction(async tx=>{
    const booking=await tx.booking.findUnique({where:{id:bookingId},include:{payments:{include:{refunds:true}},order:{include:{payments:{include:{refunds:true}}}}}});
    if(!booking)throw new Error("Booking not found.");await authorizePaymentActor(tx,actor,booking.businessId);
    if(!["PENDING_PAYMENT","PAYMENT_FAILED"].includes(booking.status) || bookingPaymentSummary(booking).paidMinor>0 || paymentDeadline(booking)<=new Date())throw new Error("Only unpaid bookings within their payment window can receive a reminder.");
    if(booking.order?.status==="AWAITING_BUSINESS_CONFIRMATION")throw new Error("Other requests in this order still need acceptance before payment is available.");
    const recent=await tx.auditLog.findFirst({where:{action:"payment_reminder_sent",metadata:{path:["bookingId"],equals:bookingId},createdAt:{gte:new Date(Date.now()-15*60000)}}});
    if(recent)throw new Error("A reminder was already sent in the last 15 minutes.");
    await tx.notification.create({data:{userId:booking.customerId,type:"PAYMENT_UPDATE",title:"Payment reminder",body:`Payment is still needed for ${booking.bookingRef}. Open your booking to pay before the displayed deadline.`,relatedBookingId:bookingId}});
    await audit(tx,actor,"payment_reminder_sent",{bookingId});
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
}
