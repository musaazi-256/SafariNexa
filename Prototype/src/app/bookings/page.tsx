import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CalendarClock, CalendarX, ChevronRight, User } from "lucide-react";

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
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#1e613c]">
                      {booking.listing.city || listingTypeLabel(booking.listing.type)}
                    </p>
                    <div className="shrink-0">
                       <BookingStatusBadge status={toBookingStatus(booking.status)} />
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-extrabold line-clamp-1 text-slate-900">{booking.listing.title}</h2>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                      <CalendarClock className="h-4 w-4" />
                      {booking.startDate ? new Date(booking.startDate).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" }) : "TBD"}
                    </div>
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-500">
                      <User className="h-4 w-4" />
                      2 Adults
                    </div>
                  </div>
                  
                  <div className="flex-1" />
                  
                  <div className="mt-6 pt-5 flex justify-between items-center relative">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                      <strong className="text-[19px] font-extrabold text-slate-900">{formatUGX(booking.totalMinor)}</strong>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2" />
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
