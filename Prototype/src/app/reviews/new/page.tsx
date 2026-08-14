import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ReviewForm } from "@/components/reviews/review-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";

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
    const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 0));
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();

    const targetBooking = await db.booking.findUnique({ where: { id: submittedBookingId }, include: { review: true } });
    if (!targetBooking || targetBooking.customerId !== activeSession.user.id) throw new Error("Booking not found.");
    if (!ELIGIBLE_STATUSES.includes(targetBooking.status) || targetBooking.review) {
      throw new Error("This booking isn't eligible for a review.");
    }
    if (!rating || !body) throw new Error("A rating and review body are required.");

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
          <h1 className="mb-6 text-3xl font-extrabold">Leave a verified review</h1>

          {isEligible ? (
            <div className="max-w-lg">
              <ReviewForm bookingId={booking.id} listingTitle={booking.listing.title} action={submitReview} />
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
