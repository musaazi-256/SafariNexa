import Link from "next/link";
import { Plus, Map, Calendar } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          <Link href="/trip-planner/new">
            <Card className="h-full border-2 border-dashed flex flex-col items-center justify-center p-12 transition-colors hover:bg-muted/50 cursor-pointer text-muted-foreground hover:text-foreground">
              <Plus className="h-12 w-12 mb-4" />
              <h3 className="font-semibold text-lg">Create New Itinerary</h3>
              <p className="text-sm text-center mt-2">Start planning a new trip from scratch.</p>
            </Card>
          </Link>

          {/* Mocked Saved Trip */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Murchison Falls Safari</CardTitle>
              <CardDescription>3 days, 2 adults</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Oct 15 - Oct 18, 2026
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Map className="mr-2 h-4 w-4" />
                Murchison Falls National Park
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/trip-planner/murchison-trip">View Itinerary</Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Mocked Saved Trip 2 */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle>Kampala City Tour</CardTitle>
              <CardDescription>1 day, 1 adult</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Nov 2, 2026
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Map className="mr-2 h-4 w-4" />
                Kampala
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/trip-planner/kampala-trip">View Itinerary</Link>
              </Button>
            </CardFooter>
          </Card>

        </div>
      </main>
    </>
  );
}
