import type { ReactNode } from "react";
import { PageHero } from "@/components/page-hero";
import { BusinessSettingsNavigation } from "@/components/business/settings-navigation";

export default function BusinessSettingsLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-4xl space-y-6 pb-12">
    <PageHero variant="portal" title="Settings" description="Manage your business profile, verification documents, staff access, and preferences." />
    <BusinessSettingsNavigation />
    {children}
  </div>;
}
