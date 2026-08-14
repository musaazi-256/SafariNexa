import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";

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
        <EmptyState
          icon={Heart}
          title="Nothing saved yet"
          description="Tap the heart on any listing to save it here for later."
          action={
            <Button asChild variant="secondary">
              <Link href="/explore">Explore listings</Link>
            </Button>
          }
        />
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
