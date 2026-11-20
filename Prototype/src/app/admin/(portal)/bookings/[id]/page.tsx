import { BookingPaymentManagement } from "@/components/business/booking-payment-management";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookingTravellerSummary } from "@/components/booking-traveller-summary";
import { BookingOperationsSummary } from "@/components/booking-operations-summary";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookingStatusBadge, PaymentStatusBadge, RefundStatusBadge } from "@/components/ui/status-badge";
import { CancellationNote } from "@/components/cancellation-note";
import { toBookingStatus, toPaymentStatus, toRefundStatus } from "@/lib/status";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin";
import { formatUGX, formatBookingDate } from "@/lib/booking";

export default async function BookingAdmin({params}:{params:{id:string}}) {
  const session=await requireAdminSession();
  const admin=await db.adminUser.findUnique({where:{userId:session.user.id},include:{role:{include:{permissions:{include:{permission:true}}}}}});
  const canManage=!!admin && (admin.role.name==="Super Admin" || admin.role.permissions.some(p=>p.permission.key==="payments.manage"));
  const booking = await db.booking.findUnique({where:{id:params.id},include:{listing:true,business:true,customer:{select:{name:true,email:true}},participants:true,payments:{orderBy:{createdAt:"desc"}},order:{include:{payments:{orderBy:{createdAt:"desc"}}}},refunds:true}});
  if (!booking) notFound();
  const payments = booking.payments.length ? booking.payments : booking.order?.payments ?? [];
  return <div className="mx-auto max-w-6xl space-y-6 pb-16">
    <Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/admin/bookings"><ArrowLeft />Back to bookings</Link></Button>
    <div className="flex flex-wrap items-start justify-between gap-4"><PageHero variant="portal" eyebrow={booking.bookingRef} title={booking.listing.title} description="Review the booking, traveller information and payment history." /><div className="text-right"><BookingStatusBadge status={toBookingStatus(booking.status)}  perspective="staff" /><CancellationNote booking={booking} /></div></div>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0"><Card><CardHeader><CardTitle>Booking details</CardTitle></CardHeader><CardContent><dl className="grid gap-5 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Customer</dt><dd className="mt-1 font-semibold">{booking.customer.name || "Not provided"}</dd><dd className="mt-1 break-words text-muted-foreground">{booking.customer.email}</dd></div><div><dt className="text-xs text-muted-foreground">Business</dt><dd className="mt-1 font-semibold"><Link className="text-primary hover:underline" href={`/admin/businesses/${booking.businessId}`}>{booking.business.name}</Link></dd></div><div><dt className="text-xs text-muted-foreground">Start</dt><dd className="mt-1">{booking.startDate ? formatBookingDate(booking.startDate, booking.listing.type) : "Not set"}</dd></div><div><dt className="text-xs text-muted-foreground">End</dt><dd className="mt-1">{booking.endDate ? formatBookingDate(booking.endDate, booking.listing.type) : "Not applicable"}</dd></div></dl></CardContent></Card><BookingTravellerSummary participants={booking.participants} /><BookingOperationsSummary booking={booking} business /></div>
      <aside className="min-w-0 space-y-6"><Card><CardHeader><CardTitle>Booking summary</CardTitle></CardHeader><CardContent><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Booking amount</span><strong className="text-xl">{formatUGX(booking.totalMinor)}</strong></div></CardContent></Card>
        <BookingPaymentManagement bookingId={booking.id} surface="ADMIN" canManage={canManage}/>

      </aside>
    </div>
  </div>;
}
