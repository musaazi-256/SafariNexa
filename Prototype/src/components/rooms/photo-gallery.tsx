"use client";

import Image from "next/image";
import * as React from "react";
import { LayoutGrid } from "lucide-react";

import { PhotoLightbox } from "@/components/rooms/photo-lightbox";

export function PhotoGallery({ images, title }: { images: string[]; title: string }) {
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  function openAt(index: number) {
    setActiveIndex(index);
    setLightboxOpen(true);
  }

  if (images.length === 0) {
    return <div className="mb-6 h-72 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green to-[#062617] sm:h-96" />;
  }

  if (images.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => openAt(0)}
          className="relative mb-6 block h-72 w-full overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-96"
        >
          <Image src={images[0]} alt={title} fill sizes="(max-width: 768px) 100vw, 66vw" className="object-cover" />
        </button>
        <PhotoLightbox
          images={images}
          title={title}
          open={lightboxOpen}
          activeIndex={activeIndex}
          onOpenChange={setLightboxOpen}
          onIndexChange={setActiveIndex}
        />
      </>
    );
  }

  const tiles = images.slice(0, 5);

  return (
    <>
      <div className="relative mb-6 grid h-72 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl sm:h-96">
        {tiles[0] ? (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="col-span-2 row-span-2 block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <Image src={tiles[0]} alt={title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
          </button>
        ) : null}
        {tiles.slice(1).map((image, index) => (
          <button
            key={image + index}
            type="button"
            onClick={() => openAt(index + 1)}
            className="col-span-1 row-span-1 block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <Image src={image} alt={`${title} — photo ${index + 2}`} fill sizes="(max-width: 768px) 100vw, 16vw" className="object-cover" />
          </button>
        ))}

        <button
          type="button"
          onClick={() => openAt(0)}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-xs font-semibold text-foreground shadow-card-hover transition-colors hover:bg-white"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Show all photos
        </button>
      </div>
      <PhotoLightbox
        images={images}
        title={title}
        open={lightboxOpen}
        activeIndex={activeIndex}
        onOpenChange={setLightboxOpen}
        onIndexChange={setActiveIndex}
      />
    </>
  );
}
