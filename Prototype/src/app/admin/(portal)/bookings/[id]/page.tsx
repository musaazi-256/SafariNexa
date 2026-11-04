import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookingTravellerSummary } from "@/components/booking-traveller-summary";
import { BookingOperationsSummary } from "@/components/booking-operations-summary";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookingStatusBadge, PaymentStatusBadge, RefundStatusBadge } from "@/components/ui/status-badge";
import { toBookingStatus, toPaymentStatus, toRefundStatus } from "@/lib/status";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin";
import { formatUGX, formatBookingDate } from "@/lib/booking";

export default async function BookingAdmin({params}:{params:{id:string}}) {
  await requireAdminSession();
  const booking = await db.booking.findUnique({where:{id:params.id},include:{listing:true,business:true,customer:{select:{name:true,email:true}},participants:true,payments:{orderBy:{createdAt:"desc"}},order:{include:{payments:{orderBy:{createdAt:"desc"}}}},refunds:true}});
  if (!booking) notFound();
  const payments = booking.payments.length ? booking.payments : booking.order?.payments ?? [];
  return <div className="mx-auto max-w-6xl space-y-6 pb-16">
    <Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/admin/bookings"><ArrowLeft />Back to bookings</Link></Button>
    <div className="flex flex-wrap items-start justify-between gap-4"><PageHero variant="portal" eyebrow={booking.bookingRef} title={booking.listing.title} description="Review the booking, traveller information and payment history." /><BookingStatusBadge status={toBookingStatus(booking.status)}  perspective="staff" /></div>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0"><Card><CardHeader><CardTitle>Booking details</CardTitle></CardHeader><CardContent><dl className="grid gap-5 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Customer</dt><dd className="mt-1 font-semibold">{booking.customer.name || "Not provided"}</dd><dd className="mt-1 break-words text-muted-foreground">{booking.customer.email}</dd></div><div><dt className="text-xs text-muted-foreground">Business</dt><dd className="mt-1 font-semibold"><Link className="text-primary hover:underline" href={`/admin/businesses/${booking.businessId}`}>{booking.business.name}</Link></dd></div><div><dt className="text-xs text-muted-foreground">Start</dt><dd className="mt-1">{booking.startDate ? formatBookingDate(booking.startDate, booking.listing.type) : "Not set"}</dd></div><div><dt className="text-xs text-muted-foreground">End</dt><dd className="mt-1">{booking.endDate ? formatBookingDate(booking.endDate, booking.listing.type) : "Not applicable"}</dd></div></dl></CardContent></Card><BookingTravellerSummary participants={booking.participants} /><BookingOperationsSummary booking={booking} business /></div>
      <aside className="min-w-0 space-y-6"><Card><CardHeader><CardTitle>Booking summary</CardTitle></CardHeader><CardContent><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Booking amount</span><strong className="text-xl">{formatUGX(booking.totalMinor)}</strong></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Payment history</CardTitle></CardHeader><CardContent className="space-y-4">{booking.orderId && <p className="text-xs leading-relaxed text-muted-foreground">These payments cover a combined order. This booking’s share is {formatUGX(booking.totalMinor)}.</p>}{payments.map(payment => <div key={payment.id} className="space-y-2 rounded-xl border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><PaymentStatusBadge status={toPaymentStatus(payment.status)} /><strong className="text-sm">{formatUGX(payment.amountMinor)}</strong></div><p className="text-xs capitalize text-muted-foreground">{payment.provider.replaceAll("_", " ").toLowerCase()}</p>{payment.providerReference && <p className="break-all text-xs text-muted-foreground">{payment.providerReference}</p>}</div>)}{!payments.length && <p className="text-sm text-muted-foreground leading-relaxed">No payments recorded.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Refunds</CardTitle></CardHeader><CardContent className="space-y-4">{booking.refunds.map(refund => <div key={refund.id} className="space-y-2 rounded-xl border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><RefundStatusBadge status={toRefundStatus(refund.status)} /><strong className="text-sm">{formatUGX(refund.amountMinor)}</strong></div><p className="break-words text-sm text-muted-foreground leading-relaxed">{refund.reason}</p></div>)}{!booking.refunds.length && <p className="text-sm text-muted-foreground leading-relaxed">No refund requests.</p>}<Button asChild variant="outline" size="sm"><Link href="/admin/payments">Manage payments and refunds</Link></Button></CardContent></Card>
      </aside>
    </div>
  </div>;
}
