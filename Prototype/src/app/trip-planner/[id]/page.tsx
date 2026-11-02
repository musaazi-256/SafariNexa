import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TripPlanEditor } from "@/components/trip-plan-editor";
import { TripBookingCompanion } from "@/components/trip-booking-companion";
export default async function TripPlannerBuilder({params}:{params:{id:string}}) {
  const session = await auth();
  if (!session?.user) redirect(`/auth/sign-in?returnTo=${encodeURIComponent("/trip-planner/"+params.id)}`);
  const plan = params.id === "new" ? null : await db.tripPlan.findUnique({ where:{id:params.id},include:{items:{orderBy:{position:"asc"}}} });
  if (params.id !== "new" && (!plan || plan.userId !== session.user.id)) notFound();
  return <><SiteHeader/><TripPlanEditor initial={{id:plan?.id,title:plan?.title ?? "Untitled itinerary",items:plan?.items.map(i=>({customLabel:i.customLabel ?? "",date:i.date?.toISOString().slice(0,10) ?? "",notes:i.notes ?? ""})) ?? []}}/><TripBookingCompanion userId={session.user.id}/><SiteFooter/></>;
}
