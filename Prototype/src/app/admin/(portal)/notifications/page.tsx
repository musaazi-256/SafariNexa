import { requireAdminSession } from "@/lib/admin";
import { PageHero } from "@/components/page-hero";
import { NotificationCentre, type NotificationSearch } from "@/components/notifications/notification-centre";
export default async function AdminNotifications({searchParams}:{searchParams:NotificationSearch}) {
  const session=await requireAdminSession();
  return <div className="mx-auto max-w-5xl space-y-6"><PageHero variant="portal" eyebrow="Admin portal" title="Notifications" description="Operational updates and support activity sent to your admin account."/><NotificationCentre userId={session.user.id} surface="admin" searchParams={searchParams}/></div>;
}
