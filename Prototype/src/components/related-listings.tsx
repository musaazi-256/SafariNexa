import { ListingCard } from "@/components/listing-card";
import type { ServiceType } from "@/lib/listing-types";

type RelatedListing = {
  id: string;
  type: ServiceType;
  title: string;
  location: string;
  price: string;
  description: string;
  rating?: number;
  imageUrl?: string | null;
};

export function RelatedListings({ heading, items }: { heading: string; items: RelatedListing[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold">{heading}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ListingCard key={item.id} {...item} />
        ))}
      </div>
    </section>
  );
}
