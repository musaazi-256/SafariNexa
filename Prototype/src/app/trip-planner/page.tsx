import { SiteHeader } from "@/components/site-header";
import { PageHero } from "@/components/page-hero";
import { EmptyState } from "@/components/ui/empty-state";

export default function TripPlannerPage() {
  return (
    <>
      <SiteHeader />
      <PageHero 
        eyebrow="Trip Planner" 
        title="Your Saved Itineraries" 
        description="Plan your East African adventure day by day." 
      />
      
      <main className="container py-12">
        <EmptyState 
          title="Coming soon" 
          description="The trip planning feature is currently in development."
        />
      </main>
    </>
  );
}
