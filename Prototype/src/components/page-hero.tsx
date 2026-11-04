import type { ReactNode } from "react";
import { RemoteImage } from "@/components/remote-image";
import { PageHeader, PageTitle } from "@/components/page-header";
import { cn } from "@/lib/utils";

export function PageHero({eyebrow,title,description,heroImageUrl,className,variant="marketing",back,actions}: {
  eyebrow?: string;
  title: string;
  description: string;
  heroImageUrl?: string | null;
  className?: string;
  variant?: "marketing" | "portal";
  back?: {href:string;label:string};
  actions?: ReactNode;
}) {
  if (variant === "portal") {
    if (heroImageUrl) return <div className={cn("relative mb-6 overflow-hidden rounded-2xl bg-muted px-6 pb-8 pt-12 sm:px-8",className)}>
      <div className="absolute inset-0"><RemoteImage src={heroImageUrl} alt={title} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-black/40" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /></div>
      <PageHeader className="relative z-10 pt-0" tone="inverse" title={title} description={description} eyebrow={eyebrow} back={back} actions={actions} />
    </div>;
    return <PageHeader title={title} description={description} eyebrow={eyebrow} back={back} actions={actions} className={className} />;
  }
  return <section className={cn("py-9 sm:py-12",className)}>
    {eyebrow && <p className="type-eyebrow text-primary">{eyebrow}</p>}
    <PageTitle size="display" className="mt-2">{title}</PageTitle>
    <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</p>
  </section>;
}
