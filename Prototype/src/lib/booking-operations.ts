export const RESPONSE_HOURS = 24;
export const PAYMENT_MINUTES = 60;
export type FulfilmentDetails = {pickup?:string;dropoff?:string;flightNumber?:string;luggage?:string;childSeats?:string;notes?:string;driverName?:string;driverPhone?:string;vehicleRegistration?:string};
export function fulfilmentFromForm(form:FormData,prefix:string): FulfilmentDetails {return Object.fromEntries(["pickup","dropoff","flightNumber","luggage","childSeats","notes"].map(key=>[key,String(form.get(`${prefix}_${key}`)||"")]));}
export function parseFulfilment(input: unknown, type: string): FulfilmentDetails {
  const raw = input && typeof input === "object" ? input as Record<string,unknown> : {};
  const details: FulfilmentDetails = {};
  for (const key of ["pickup","dropoff","flightNumber","luggage","childSeats","notes"] as const) {
    const value = String(raw[key] ?? "").trim();
    if (value.length > (key === "notes" ? 2000 : 250)) throw new Error("Service details are too long.");
    if (value) details[key] = value;
  }
  if (type === "TRANSPORT" && (!details.pickup || !details.dropoff || details.pickup.toLowerCase() === details.dropoff.toLowerCase())) throw new Error("Enter different pickup and drop-off locations for your transfer.");
  return details;
}
export function paymentDeadline(booking: {paymentDueAt?: Date | null;createdAt: Date}) {
  return booking.paymentDueAt ?? new Date(booking.createdAt.getTime()+PAYMENT_MINUTES*60000);
}
export function nextAfterAcceptance(booking: {bookingMode: string;totalMinor: number;hasConfirmedPayment?:boolean}) {
  return booking.totalMinor > 0 && !booking.hasConfirmedPayment ? "PENDING_PAYMENT" as const : "CONFIRMED" as const;
}
