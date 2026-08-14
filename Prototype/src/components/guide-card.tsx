import Link from "next/link";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatUGX } from "@/lib/booking";

export function GuideCard({
  id,
  name,
  photoUrl,
  bio,
  location,
  isTopGuide,
  isVerified,
  rating,
  reviewCount,
  availabilityNote,
  hourlyRateMinor
}: {
  id: string;
  name: string;
  photoUrl?: string | null;
  bio: string;
  location?: string;
  isTopGuide?: boolean;
  isVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  availabilityNote?: string | null;
  hourlyRateMinor?: number | null;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Link href={`/guides/${id}`} className="block w-72 shrink-0 snap-start rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-card-hover">
        <div className="flex items-end gap-2 px-4 pt-4">
          <Avatar className="h-[50px] w-[50px]">
            {photoUrl ? <AvatarImage src={photoUrl} alt={name} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-foreground">{name}</h3>
            <div className="mt-2 flex items-center gap-1">
              {isTopGuide ? (
                <Badge variant="accent" className="shrink-0 whitespace-nowrap px-1.5 py-0.5 text-[10px]">
                  Top guide
                </Badge>
              ) : null}
              {isVerified ? (
                <Badge variant="success-soft" className="shrink-0 whitespace-nowrap px-1.5 py-0.5 text-[10px]">
                  Verified
                </Badge>
              ) : null}
              {location ? <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">{location}</span> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 p-4">
          <p className="text-[13px] leading-relaxed text-muted-foreground">{bio}</p>

          {rating || availabilityNote ? (
            <div className="flex items-center gap-3">
              {rating ? (
                <span className="flex items-center gap-1 text-[13px] font-medium text-foreground">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  {rating.toFixed(1)} {reviewCount ? `(${reviewCount})` : null}
                </span>
              ) : null}
              {availabilityNote ? <span className="text-[13px] font-medium text-success">{availabilityNote}</span> : null}
            </div>
          ) : null}

          {hourlyRateMinor ? <p className="text-base font-semibold text-foreground">{formatUGX(hourlyRateMinor)} / hour</p> : null}
        </div>
      </Card>
    </Link>
  );
}
