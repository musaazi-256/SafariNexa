import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Search, Scale, CalendarCheck } from "lucide-react";

import { auth } from "@/auth";
import { ListingCard } from "@/components/listing-card";
import { AccountLayout } from "@/components/account-layout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { formatListingPrice, listingTypeLabel, ratingSummary } from "@/lib/listings";

export default async function SavedItemsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fprofile%2Fsaved");

  const savedItems = await db.savedItem.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: {
          restaurant: true,
          reviews: { where: { status: "PUBLISHED" }, select: { rating: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AccountLayout
      eyebrow="Account"
      title="Saved items"
      description="Stays, tours, restaurants, and transport options you've saved for later."
    >
      {savedItems.length === 0 ? (
        <>
          <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          description="Tap the heart on any listing to save it here for later."
          action={
            <Button asChild variant="default" className="bg-[#1e613c] hover:bg-[#164a2e] text-white">
              <Link href="/explore">Explore listings</Link>
            </Button>
          }
        />
        <div className="grid sm:grid-cols-3 gap-6 mt-12 pt-12 border-t border-slate-100">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center mb-1">
              <Heart className="h-5 w-5 text-slate-400" />
            </div>
            <h4 className="font-bold text-[13px] text-slate-900">Save your favorites</h4>
            <p className="text-[12px] font-medium text-slate-500">Quickly find places you love.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center mb-1">
              <Scale className="h-5 w-5 text-slate-400" />
            </div>
            <h4 className="font-bold text-[13px] text-slate-900">Compare easily</h4>
            <p className="text-[12px] font-medium text-slate-500">Review saved items anytime.</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center mb-1">
              <CalendarCheck className="h-5 w-5 text-slate-400" />
            </div>
            <h4 className="font-bold text-[13px] text-slate-900">Book when ready</h4>
            <p className="text-[12px] font-medium text-slate-500">Come back and book later.</p>
          </div>
        </div>
      </>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {savedItems.map(({ listing }) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              type={listingTypeLabel(listing.type)}
              title={listing.title}
              location={listing.city ?? ""}
              price={formatListingPrice(listing)}
              description={listing.description}
              rating={ratingSummary(listing.reviews).average}
              imageUrl={listing.coverImageUrl}
              showWishlist
              isSaved
              savedPath="/profile/saved"
            />
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
