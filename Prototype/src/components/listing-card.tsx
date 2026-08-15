import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { RoomPreviewModal } from "@/components/rooms/room-preview-modal";
import { SaveButton } from "@/components/save-button";

const TYPE_HREF: Record<string, (id: string) => string> = {
  Accommodation: (id) => `/accommodation/${id}`,
  Tour: (id) => `/tours/${id}`,
  Restaurant: (id) => `/restaurants/${id}`,
  Transport: (id) => `/transport/${id}`
};

export function ListingCard({
  id,
  type,
  title,
  location,
  price,
  description,
  rating,
  featureBadge,
  isVerified = true,
  availability,
  imageUrl,
  showWishlist,
  /** Signed-in save state — when set, the wishlist heart becomes a real save/unsave toggle
   * instead of the guest sign-in link. */
  isSaved,
  savedPath,
  className
}: {
  id: string;
  type: string;
  title: string;
  location: string;
  price: string;
  description: string;
  rating?: number;
  /** Solid-gold highlight tag at the bottom-left of the photo — falls back to the listing type. */
  featureBadge?: string;
  /** Every business on this platform is verification-gated before publishing, so this defaults true. */
  isVerified?: boolean;
  availability?: string;
  imageUrl?: string | null;
  showWishlist?: boolean;
  isSaved?: boolean;
  savedPath?: string;
  className?: string;
}) {
  const href = (TYPE_HREF[type] ?? (() => "/explore"))(id);
  const returnTo = href;

  return (
    <Card className={`relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-card-hover ${className ?? ""}`}>
      <Link href={href} className="absolute inset-0 z-10" aria-label={title} />
      <div className={`relative h-40 ${imageUrl ? "" : "bg-gradient-to-br from-brand-green to-[#062617]"}`}>
        {imageUrl ? <Image src={imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /> : null}
        {isVerified ? (
          <Badge variant="success-soft" className="absolute left-3 top-3 border-transparent">
            Verified
          </Badge>
        ) : null}
        <Badge variant="accent" className="absolute bottom-3 left-3 border-transparent">
          {featureBadge ?? type}
        </Badge>
        {showWishlist && isSaved !== undefined ? (
          <SaveButton listingId={id} initialSaved={isSaved} path={savedPath} className="absolute right-3 top-3 z-20" />
        ) : showWishlist ? (
          <Link
            href={`/auth/sign-in?reason=${encodeURIComponent("Save")}&returnTo=${encodeURIComponent(returnTo)}`}
            aria-label="Save to wishlist"
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground transition-colors hover:text-destructive"
          >
            <Heart className="h-4 w-4" />
          </Link>
        ) : rating ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1">
            <Rating value={rating} />
          </span>
        ) : null}
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 pt-5">
        <h3 className="text-lg font-bold leading-tight">{title}</h3>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {location}
        </p>
        {showWishlist && rating ? <Rating value={rating} /> : null}
        {availability ? <p className="text-xs font-semibold text-primary">{availability}</p> : null}
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div>
          <p className="text-xs text-muted-foreground">From</p>
          <strong className="text-lg font-extrabold">{price}</strong>
          {type === "Accommodation" ? <p className="text-xs text-muted-foreground mt-0.5">per night</p> : null}
        </div>
        {type === "Accommodation" ? (
          <RoomPreviewModal listingId={id} title={title} />
        ) : null}
      </CardContent>
    </Card>
  );
}
