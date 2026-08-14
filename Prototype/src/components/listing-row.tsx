import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ui/rating";
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
    <Card className="relative flex flex-col overflow-hidden transition-shadow hover:shadow-card-hover sm:flex-row">
      <Link href={href} className="absolute inset-0 z-10" aria-label={title} />
      <div className={`relative h-44 shrink-0 sm:h-auto sm:w-64 ${imageUrl ? "" : "bg-gradient-to-br from-brand-green to-[#062617]"}`}>
        {imageUrl ? <Image src={imageUrl} alt="" fill sizes="(max-width: 640px) 33vw, 25vw" className="object-cover" /> : null}
        <Badge className="absolute left-3 top-3 border-transparent bg-white/90 text-foreground">{type}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold leading-tight">{title}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </p>
          </div>
          {typeof rating === "number" ? <ScoreBadge value={rating} count={reviewCount} /> : null}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        {tags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-auto pt-2 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <strong className="text-lg font-extrabold">{price}</strong>
          </div>
          {type === "Accommodation" ? (
            <div className="w-40 shrink-0">
              <RoomPreviewModal listingId={id} title={title} />
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
