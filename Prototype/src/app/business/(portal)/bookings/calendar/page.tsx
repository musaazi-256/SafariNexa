import { PageHero } from "@/components/page-hero";
import { PortalToolbar } from "@/components/portal-toolbar";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { toBookingStatus } from "@/lib/status";
import Link from "next/link";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
export default async function BookingCalendar() {
  const { businessId } = await requireBusinessSession();
  const bookings = businessId ? await db.booking.findMany({ where: { businessId, startDate: { gte: new Date(new Date().setUTCHours(0,0,0,0)) } }, include: { listing: true }, orderBy: { startDate: "asc" }, take: 100 }) : [];
  return <div className="space-y-6"><PageHero variant="portal" back={{href:"/business/bookings",label:"Back to bookings"}} title="Upcoming booking calendar" description="Next 100 scheduled bookings, ordered by service date."/><PortalToolbar tableId="business-booking-calendar" />
  <Table externalTools tableId="business-booking-calendar" aria-label="Upcoming bookings"><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Listing</TableHead><TableHead>Booking</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{bookings.map(b => <TableRow key={b.id}><TableCell>{b.startDate?.toLocaleDateString("en-UG")}</TableCell><TableCell>{b.listing.title}</TableCell><TableCell><Link className="underline" href={`/business/bookings/${b.id}`}>{b.bookingRef}</Link></TableCell><TableCell><BookingStatusBadge status={toBookingStatus(b.status)} perspective="staff" /></TableCell></TableRow>)}</TableBody></Table>
  {!bookings.length && <p>No upcoming bookings.</p>}</div>;
}
