/** Why and when a booking was cancelled, shown under its status badge.
 * Expired bookings are cancelled by the system, so the badge alone ("Cancelled by admin") doesn't explain them. */
export function CancellationNote({ booking }: { booking: { cancelledAt: Date | null; cancelReason: string | null } }) {
  if (!booking.cancelledAt || !booking.cancelReason) return null;
  const when = booking.cancelledAt.toLocaleDateString("en-GB", { timeZone: "Africa/Kampala", day: "numeric", month: "short", year: "numeric" });
  return <p className="mt-2 text-sm text-muted-foreground">{booking.cancelReason} · {when}</p>;
}
