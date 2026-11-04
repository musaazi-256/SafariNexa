"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function BusinessSettingsNavigation() {
  const path = usePathname();
  const params = useSearchParams();
  const tab = params.get("tab")?.toLowerCase();
  const active = path.startsWith("/business/settings/verification") ? "verification"
    : tab === "team" || tab === "staff" ? "team" : tab === "notifications" ? "notifications" : "profile";
  const sections = [
    { id: "profile", label: "Business profile", href: "/business/settings" },
    { id: "verification", label: "Verification & documents", href: "/business/settings/verification" },
    { id: "notifications", label: "Notifications", href: "/business/settings?tab=notifications" },
    { id: "team", label: "Staff access", href: "/business/settings?tab=team" }
  ];
  return <nav aria-label="Business settings" className="selection-group border-b border-border pb-3">
    {sections.map(section => <Link key={section.id} href={section.href} aria-current={active === section.id ? "page" : undefined}
      className="selection-control">{section.label}</Link>)}
  </nav>;
}
