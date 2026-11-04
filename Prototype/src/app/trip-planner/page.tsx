import { PageHero } from "@/components/page-hero";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
export default async function TripPlannerPage() {
  const session=await auth(); if(!session?.user)redirect("/auth/sign-in?returnTo=%2Ftrip-planner");
  const plans=await db.tripPlan.findMany({where:{userId:session.user.id},orderBy:{updatedAt:"desc"}});
  return <><SiteHeader/><PageHero eyebrow="Trip Planner" title="Your Saved Itineraries" description="Plan your East African adventure day by day."/><main className="container space-y-6 py-12"><Button asChild><Link href="/trip-planner/new">Create itinerary</Link></Button><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{plans.map(plan=><Link className="min-w-0 rounded-xl border p-5 hover:bg-muted" key={plan.id} href={`/trip-planner/${plan.id}`}><h2 className="break-words text-lg font-semibold">{plan.title}</h2><p className="text-sm leading-relaxed">Updated {plan.updatedAt.toLocaleDateString("en-UG")}</p></Link>)}</div>{!plans.length&&<p>No saved plans yet. Create your first itinerary above.</p>}</main><SiteFooter/></>;
}
