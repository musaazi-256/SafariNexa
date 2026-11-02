import Link from "next/link";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { ExportVisibleRows } from "@/components/portal-tools";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
export default async function BookingCalendar() {
  const { businessId } = await requireBusinessSession();
  const bookings = businessId ? await db.booking.findMany({ where: { businessId, startDate: { gte: new Date(new Date().setUTCHours(0,0,0,0)) } }, include: { listing: true }, orderBy: { startDate: "asc" }, take: 100 }) : [];
  return <div className="space-y-5"><Link href="/business/bookings" className="underline">Back to bookings</Link><h1 className="text-2xl font-bold">Upcoming booking calendar</h1><p>Next 100 scheduled bookings, ordered by service date.</p><ExportVisibleRows/>
  <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Listing</TableHead><TableHead>Booking</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{bookings.map(b => <TableRow key={b.id}><TableCell>{b.startDate?.toLocaleDateString("en-UG")}</TableCell><TableCell>{b.listing.title}</TableCell><TableCell><Link className="underline" href={`/business/bookings/${b.id}`}>{b.bookingRef}</Link></TableCell><TableCell>{b.status.replaceAll("_"," ")}</TableCell></TableRow>)}</TableBody></Table>
  {!bookings.length && <p>No upcoming bookings.</p>}</div>;
}
