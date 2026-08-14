import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProfilePage() {
  return (
    <>
      <PageHero variant="portal" eyebrow="Business portal" title="Business profile" description="Manage your public business information." />
      <EmptyState title="Coming soon" description="Public profile management will be available here." />
    </>
  );
}
