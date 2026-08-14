import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CalendarX } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatUGX } from "@/lib/booking";
import { listingTypeLabel } from "@/lib/listings";
import { toBookingStatus } from "@/lib/status";
import { AccountLayout } from "@/components/account-layout";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { BookingStatusBadge } from "@/components/ui/status-badge";
import { PAGE_SIZE, parsePage, totalPagesFor } from "@/lib/pagination";

export default async function BookingsPage({ searchParams }: { searchParams: { page?: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fbookings");

  const page = parsePage(searchParams.page);
  const where = { customerId: session.user.id };

  const [bookings, totalCount] = await Promise.all([
    db.booking.findMany({
      where,
      include: { listing: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    db.booking.count({ where })
  ]);

  return (
    <AccountLayout
      eyebrow="Protected"
      title="My bookings"
      description="Every booking you've started or confirmed, in one place."
    >
      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="No bookings yet"
          description="Once you book a stay, tour, table, or ride, it'll show up here."
        />
      ) : (
        <div className="grid gap-8">
          {bookings.map((booking) => (
            <Link key={booking.id} href={`/bookings/${booking.id}`}>
              <div className="group flex flex-col sm:flex-row gap-6 transition-all hover:-translate-y-1">
                {/* Image */}
                <div className="relative w-full sm:w-48 sm:h-56 shrink-0 h-48 overflow-hidden rounded-2xl bg-secondary">
                  {booking.listing.coverImageUrl ? (
                    <Image 
                      src={booking.listing.coverImageUrl} 
                      alt={booking.listing.title} 
                      fill
                      sizes="(max-width: 640px) 100vw, 192px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="h-full w-full bg-muted flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                      <CalendarX className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex flex-col flex-1 py-1 sm:py-2">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-green">
                      {booking.listing.city || listingTypeLabel(booking.listing.type)}
                    </p>
                    <div className="shrink-0">
                       <BookingStatusBadge status={toBookingStatus(booking.status)} />
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-extrabold line-clamp-1">{booking.listing.title}</h2>
                  <p className="text-sm font-medium text-muted-foreground mt-1.5">
                    {booking.startDate ? new Date(booking.startDate).toLocaleDateString("en-UG", { dateStyle: "long" }) : "Date to be confirmed"}
                  </p>
                  
                  <div className="flex-1" />
                  
                  <div className="mt-6 pt-5 border-t border-border flex justify-between items-end">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total</span>
                    <strong className="text-2xl font-extrabold">{formatUGX(booking.totalMinor)}</strong>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-8">
        <Pagination currentPage={page} totalPages={totalPagesFor(totalCount)} buildHref={(p) => `/bookings?page=${p}`} />
      </div>
    </AccountLayout>
  );
}
