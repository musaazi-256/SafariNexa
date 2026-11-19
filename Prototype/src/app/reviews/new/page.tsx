import { PageHeader } from "@/components/page-header";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ReviewForm } from "@/components/reviews/review-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { RemoteImage } from "@/components/remote-image";
import { Card } from "@/components/ui/card";
import { BadgeCheck } from "lucide-react";

const ELIGIBLE_STATUSES = ["COMPLETED", "REVIEW_PENDING"];

export default async function NewReviewPage({ searchParams }: { searchParams: { bookingId?: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/reviews/new?bookingId=${searchParams.bookingId ?? ""}`)}`);
  }

  const bookingId = searchParams.bookingId;
  const booking = bookingId
    ? await db.booking.findUnique({ where: { id: bookingId }, include: { listing: true, review: true } })
    : null;

  const isEligible =
    booking && booking.customerId === session.user.id && ELIGIBLE_STATUSES.includes(booking.status) && !booking.review;

  async function submitReview(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in");

    const submittedBookingId = String(formData.get("bookingId"));
    const rawRating = Number(formData.get("rating"));
    const rating = Number.isInteger(rawRating) && rawRating >= 1 && rawRating <= 5 ? rawRating : 0;
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();

    const targetBooking = await db.booking.findUnique({ where: { id: submittedBookingId }, include: { review: true } });
    if (!targetBooking || targetBooking.customerId !== activeSession.user.id) throw new Error("Booking not found.");
    if (!ELIGIBLE_STATUSES.includes(targetBooking.status) || targetBooking.review) {
      throw new Error("This booking isn't eligible for a review.");
    }
    if (!rating || body.length < 20) throw new Error("Choose a star rating and write at least 20 characters.");

    await db.review.create({
      data: {
        bookingId: targetBooking.id,
        authorUserId: activeSession.user.id,
        listingId: targetBooking.listingId,
        businessId: targetBooking.businessId,
        rating,
        title: title || null,
        body
      }
    });

    await db.booking.update({ where: { id: targetBooking.id }, data: { status: "REVIEWED" } });

    redirect(`/bookings/${targetBooking.id}`);
  }

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20 pt-6">
          <Breadcrumbs items={[{ label: "My bookings", href: "/bookings" }, { label: "Write a review" }]} />
          <PageHeader className="mb-6" title={<>Leave a verified review</>} />

          {isEligible ? (
            <div className="grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <ReviewForm bookingId={booking.id} listingTitle={booking.listing.title} action={submitReview} />
              <Card className="order-first p-4 lg:order-none lg:self-start" role="complementary" aria-label="Your booking">
                <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                  {booking.listing.coverImageUrl && <RemoteImage src={booking.listing.coverImageUrl} alt={booking.listing.title} width={600} height={375} className="h-full w-full object-cover" />}
                </div>
                <p className="mt-4 type-eyebrow text-muted-foreground">Your booking</p>
                <h2 className="mt-1 type-card">{booking.listing.title}</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Reference</dt><dd className="font-medium">{booking.bookingRef}</dd></div>
                  {booking.startDate && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Dates</dt><dd className="text-right font-medium">{[booking.startDate, booking.endDate].filter(Boolean).map((d) => d!.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Kampala" })).join(" – ")}</dd></div>}
                  {booking.roomTypeName && <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Room</dt><dd className="text-right font-medium">{booking.roomTypeName}</dd></div>}
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Guests</dt><dd className="font-medium">{booking.participantsCount}</dd></div>
                </dl>
                <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success"><BadgeCheck className="h-4 w-4" />Verified stay: only guests who booked can review</p>
              </Card>
            </div>
          ) : (
            <EmptyState
              title="This booking can't be reviewed"
              description={
                !booking
                  ? "We couldn't find that booking, or it doesn't belong to your account."
                  : booking.review
                    ? "You've already reviewed this booking."
                    : "Reviews open up once a booking is marked completed."
              }
            />
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
