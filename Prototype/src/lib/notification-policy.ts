export type NotificationSurface = "customer" | "business" | "admin";
export const NOTIFICATION_PATHS: Record<NotificationSurface, string> = {
  customer: "/notifications", business: "/business/notifications", admin: "/admin/notifications"
};
export function notificationDestination(notification: {
  userId: string;
  relatedBooking?: { id: string; customerId: string; businessId: string } | null;
  supportCase?: { id: string; openedByUserId: string } | null;
}, context: { userId: string; surface: NotificationSurface; businessIds: string[] }) {
  if (notification.userId !== context.userId) return null;
  const booking = notification.relatedBooking;
  if (booking) {
    if (context.surface === "admin") return { href: `/admin/bookings/${booking.id}`, label: "View booking" };
    if (booking.customerId === context.userId) return { href: `/bookings/${booking.id}`, label: "View booking" };
    if (context.businessIds.includes(booking.businessId)) return { href: `/business/bookings/${booking.id}`, label: "View booking", businessId: booking.businessId };
  }
  const support = notification.supportCase;
  if (support) {
    if (context.surface === "admin") return { href: `/admin/support/${support.id}`, label: "View support case" };
    if (support.openedByUserId === context.userId) return { href: `/support/${support.id}`, label: "View support case" };
  }
  return null;
}
