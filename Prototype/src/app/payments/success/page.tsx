import { redirect } from "next/navigation";
export default function PaymentSuccessPage({ searchParams }: { searchParams: { bookingId?: string; orderId?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.orderId) params.set("orderId", searchParams.orderId);
  else if (searchParams.bookingId) params.set("bookingId", searchParams.bookingId);
  if (!params.size) redirect("/bookings");
  redirect(`/payments/receipt?${params}`);
}
