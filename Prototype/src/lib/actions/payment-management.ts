"use server";
import { revalidatePath } from "next/cache";
import { requireBusinessSession } from "@/lib/business";
import { requireAdminSession } from "@/lib/admin";
import { createBookingRefund, approveBookingRefund, rejectBookingRefund, verifyBookingPayment, escalateBookingPayment, remindBookingPayment, refundAmount, type PaymentActor } from "@/lib/payment-management";
export type PaymentActionState = { error?: string; message?: string };

export async function managePayment(surface: "BUSINESS" | "ADMIN", _state: PaymentActionState, form: FormData): Promise<PaymentActionState> {
  // Authentication stays outside recovery: framework redirects remain control flow.
  let actor: PaymentActor;
  if(surface==="BUSINESS") { const context=await requireBusinessSession();actor={surface,userId:context.session.user.id,email:context.session.user.email??undefined,businessId:context.businessId}; }
  else {const session=await requireAdminSession("payments.manage");actor={surface,userId:session.user.id,email:session.user.email??undefined};}
  // Refresh the pages only when the payment records changed: a refresh remounts the form and
  // wipes its message, so an error, a reminder or an escalation keeps its message on screen.
  let changed = false;
  try {
    const operation=String(form.get("operation")??"");const bookingId=String(form.get("bookingId")??"");const reason=String(form.get("reason")??"");
    let message="Changes saved.";
    if(operation==="request-refund") {await createBookingRefund(actor,bookingId,refundAmount(form.get("amount")),reason,String(form.get("requestId")??""));message="Refund request created. Review and approve it below to send it to the provider.";}
    else if(operation==="approve-refund") message=await approveBookingRefund(actor,String(form.get("refundId")??""));
    else if(operation==="reject-refund") {await rejectBookingRefund(actor,String(form.get("refundId")??""),reason);message="Refund declined; customer notified.";}
    else if(operation==="verify-payment") message=await verifyBookingPayment(actor,bookingId);
    else if(operation==="remind") {await remindBookingPayment(actor,bookingId);message="Payment reminder sent to the customer’s notifications.";}
    else if(operation==="escalate") {const support=await escalateBookingPayment(actor,bookingId,reason);message=`Support case ${support.caseRef} opened.`;}
    else throw new Error("Unknown payment operation.");
    changed = !["remind","escalate"].includes(operation);
    return {message};
  } catch(error) {return {error:error instanceof Error ? error.message : "Could not save changes. Please try again."};}
  finally {if(changed)for(const path of ["/business","/admin","/bookings","/payments"])revalidatePath(path,"layout");}
}
