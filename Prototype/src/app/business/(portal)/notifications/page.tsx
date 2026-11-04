import { requireBusinessSession } from "@/lib/business";
import { PageHero } from "@/components/page-hero";
import { NotificationCentre, type NotificationSearch } from "@/components/notifications/notification-centre";
export default async function BusinessNotifications({searchParams}:{searchParams:NotificationSearch}) {
  const {session}=await requireBusinessSession();
  return <div className="mx-auto max-w-5xl space-y-6"><PageHero variant="portal" eyebrow="Business portal" title="Notifications" description="Updates sent to your account across the businesses you belong to. Opening a business booking selects its business."/><NotificationCentre userId={session.user.id} surface="business" searchParams={searchParams}/></div>;
}
