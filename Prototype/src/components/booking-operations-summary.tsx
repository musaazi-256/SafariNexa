import Link from "next/link";
import type { Prisma } from "@prisma/client";
import type { FulfilmentDetails } from "@/lib/booking-operations";
export function BookingOperationsSummary({booking,business=false}: {business?:boolean;booking:{id:string;status:string;bookingMode:string;responseDueAt:Date|null;paymentDueAt:Date|null;fulfilment:Prisma.JsonValue;policySnapshot:Prisma.JsonValue;orderId?:string|null}}) {
 const info=booking.fulfilment as FulfilmentDetails|null;
 const policy=booking.policySnapshot as Record<string,unknown>|null;
 const deadline=["AWAITING_BUSINESS_CONFIRMATION","PENDING_PAYMENT","PAYMENT_FAILED"].includes(booking.status) ? booking.responseDueAt||booking.paymentDueAt : null;
 return <section className="my-5 space-y-3 rounded border bg-muted/20 p-4">
  <h2 className="text-lg font-bold">Booking progress & service details</h2>
  <p>{booking.status === "AWAITING_BUSINESS_CONFIRMATION" && booking.bookingMode === "RESERVATION" ? "Table request sent. The restaurant must confirm availability; no online meal charge is collected." : booking.status === "AWAITING_BUSINESS_CONFIRMATION" && booking.bookingMode !== "LEGACY" ? "Request sent. No payment collected; the business must accept before payment." : booking.status === "PENDING_PAYMENT" && booking.bookingMode === "REQUEST" ? "The business accepted your request. Payment is still required to confirm it." : booking.bookingMode === "RESERVATION" && booking.status === "CONFIRMED" ? "Table reservation confirmed. Meals are paid separately at the restaurant." : `Status: ${booking.status.replaceAll("_"," ").toLowerCase()}.`}</p>
  {deadline && <p>{booking.responseDueAt ? "Business response due" : "Payment due"}: {deadline.toLocaleString("en-GB",{timeZone:"Africa/Kampala"})} EAT</p>}
  {!business && booking.status === "PENDING_PAYMENT" && <Link href={`/payments?${booking.orderId?`orderId=${booking.orderId}`:`bookingId=${booking.id}`}`} className="block underline">Continue to payment</Link>}
  {info && <dl className="grid gap-2 text-sm">{Object.entries(info).filter(([,value])=>value).map(([key,value])=><div key={key} className="break-words"><dt className="font-semibold capitalize">{key.replace(/([a-z])([A-Z])/g,"$1 $2")}</dt><dd>{String(value)}</dd></div>)}</dl>}
  {policy && <details><summary className="cursor-pointer underline">Terms saved when this booking was requested</summary><dl className="mt-3 space-y-2 text-sm">{Object.entries(policy).map(([key,value])=><div key={key}><dt className="font-semibold">{key.replace(/([a-z])([A-Z])/g,"$1 $2")}</dt><dd className="break-words">{value === null ? "Not provided" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd></div>)}</dl></details>}
 </section>;
}
