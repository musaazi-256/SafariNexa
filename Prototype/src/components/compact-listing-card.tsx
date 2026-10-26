import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

const TYPE_HREF: Record<string, (id: string) => string> = {
  Accommodation: (id) => `/accommodation/${id}`,
  Tour: (id) => `/tours/${id}`,
  Restaurant: (id) => `/restaurants/${id}`,
  Transport: (id) => `/transport/${id}`
};

export function CompactListingCard({
  id,
  type,
  title,
  price,
  imageUrl,
  className
}: {
  id: string;
  type: string;
  title: string;
  price: string;
  imageUrl?: string | null;
  className?: string;
}) {
  const href = (TYPE_HREF[type] ?? (() => "/explore"))(id);

  return (
    <Link
      href={href}
      className={`group flex w-72 shrink-0 snap-start items-center gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-card transition-all duration-300 hover:shadow-card-hover ${className ?? ""}`}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-green to-[#062617]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-foreground">{title}</p>
        <p className="truncate text-xs font-medium text-muted-foreground mt-1">{price}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
}
