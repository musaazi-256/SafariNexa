import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, ShieldCheck, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ui/rating";
import { Button } from "@/components/ui/button";
import { RoomPreviewModal } from "@/components/rooms/room-preview-modal";

const TYPE_HREF: Record<string, (id: string) => string> = {
  Accommodation: (id) => `/accommodation/${id}`,
  Tour: (id) => `/tours/${id}`,
  Restaurant: (id) => `/restaurants/${id}`,
  Transport: (id) => `/transport/${id}`
};

export function ListingRow({
  id,
  type,
  title,
  location,
  price,
  description,
  rating,
  reviewCount,
  tags,
  imageUrl
}: {
  id: string;
  type: string;
  title: string;
  location: string;
  price: string;
  description: string;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  imageUrl?: string | null;
}) {
  const href = (TYPE_HREF[type] ?? (() => "/explore"))(id);

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-card-hover sm:flex-row p-4 gap-5">
      <Link href={href} className="absolute inset-0 z-10" aria-label={title} />
      <div className={`relative h-[210px] shrink-0 sm:w-[300px] overflow-hidden rounded-[14px] ${imageUrl ? "" : "bg-gradient-to-br from-brand-green to-[#062617]"}`}>
        {imageUrl ? <Image src={imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 300px" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : null}
        <Badge className="absolute left-3 top-3 border-transparent bg-white/90 text-[#0B4928]">{type}</Badge>
        <button className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted-foreground transition-colors hover:text-destructive hover:bg-white" aria-label="Save to wishlist">
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-1 flex-col py-1">
        <div className="flex flex-col items-start gap-1">
          <h3 className="text-[20px] font-bold leading-tight text-foreground">{title}</h3>
          <p className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </p>
          {typeof rating === "number" ? (
            <div className="flex items-center gap-1 text-[13px] font-medium mt-1">
              <Star className="h-3.5 w-3.5 fill-[#FFCE06] text-[#FFCE06]" />
              <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">· Very good · {reviewCount ?? 0} {reviewCount === 1 ? 'review' : 'reviews'}</span>
            </div>
          ) : null}
        </div>
        <p className="text-[14px] leading-relaxed text-muted-foreground mt-3 line-clamp-2">{description}</p>
        <div className="mt-3">
        {tags?.includes("Verified partner") ? (
          <Badge variant="success-soft" className="w-fit border-transparent">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified partner
          </Badge>
        ) : tags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
         </div>
        <div className="mt-auto pt-4 flex items-end justify-between">
          <div>
            <p className="text-[13px] text-muted-foreground mb-0.5">From</p>
            <div className="flex items-baseline gap-1">
              <strong className="text-[20px] font-extrabold text-foreground">{price}</strong>
              <span className="text-[13px] text-muted-foreground">/ night</span>
            </div>
          </div>
          {type === "Accommodation" ? (
            <div className="w-auto shrink-0 relative z-20">
              <RoomPreviewModal listingId={id} title={title} />
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
