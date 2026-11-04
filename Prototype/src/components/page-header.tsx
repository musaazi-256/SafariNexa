import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageTitle({ size = "page", className, ...props }: HTMLAttributes<HTMLHeadingElement> & {size?: "page" | "display"}) {
  return <h1 data-slot="page-title" className={cn(size === "display" ? "type-display" : "type-page", "break-words text-foreground", className)} {...props} />;
}

/** Shared page-level title, description, back navigation, and actions. */
export function PageHeader({title,description,eyebrow,back,actions,tone="default",className,descriptionRole}: {
  title: ReactNode;
  description?: ReactNode;
  descriptionRole?: HTMLAttributes<HTMLParagraphElement>["role"];
  eyebrow?: ReactNode;
  back?: {href:string;label:string};
  actions?: ReactNode;
  tone?: "default" | "inverse";
  className?: string;
}) {
  const inverse = tone === "inverse";
  return <header data-slot="page-header" className={cn("flex min-w-0 flex-col gap-3 pt-2",className)}>
    {back && <Link href={back.href} className={cn("inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium transition-colors",inverse?"text-white/80 hover:text-white":"text-muted-foreground hover:text-foreground")}><ArrowLeft aria-hidden="true" className="h-4 w-4" />{back.label}</Link>}
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        {eyebrow && <p className={cn("type-eyebrow",inverse?"text-white/80":"text-primary")}>{eyebrow}</p>}
        <PageTitle className={inverse?"text-white":undefined}>{title}</PageTitle>
        {description && <p role={descriptionRole} className={cn("text-sm font-normal leading-relaxed",inverse?"text-white/90":"text-muted-foreground")}>{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>;
}
