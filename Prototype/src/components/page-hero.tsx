import { RemoteImage } from "@/components/remote-image";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  heroImageUrl,
  className,
  variant = "marketing"
}: {
  eyebrow?: string;
  title: string;
  description: string;
  heroImageUrl?: string | null;
  className?: string;
  variant?: "marketing" | "portal";
}) {
  if (variant === "portal") {
    if (heroImageUrl) {
      return (
        <div className={cn("relative mb-6 overflow-hidden rounded-2xl bg-muted pb-8 pt-12 px-6 sm:px-8", className)}>
          <div className="absolute inset-0 z-0">
            <RemoteImage src={heroImageUrl} alt={title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="relative z-10 flex flex-col gap-1">
            {eyebrow ? <p className="type-eyebrow text-white/80">{eyebrow}</p> : null}
            <h1 className="type-page text-white">{title}</h1>
            {description && <p className="text-sm text-white/90 leading-relaxed">{description}</p>}
          </div>
        </div>
      );
    }
    return (
      <div className={cn("flex flex-col gap-1 pb-6 pt-2", className)}>
        {eyebrow ? <p className="type-eyebrow text-primary">{eyebrow}</p> : null}
        <h1 className="type-page text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
    );
  }

  return (
    <section className={cn("py-9 sm:py-12", className)}>
      {eyebrow ? <p className="type-eyebrow text-primary">{eyebrow}</p> : null}
      <h1 className="mt-2 type-display text-foreground">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</p>
    </section>
  );
}
