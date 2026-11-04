import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountLayout } from "@/components/customer/account-layout";
import { NotificationCentre, type NotificationSearch } from "@/components/notifications/notification-centre";
export default async function NotificationsPage({searchParams}:{searchParams:NotificationSearch}) {
  const session=await auth();
  if(!session?.user) redirect("/auth/sign-in?returnTo=%2Fnotifications");
  return <AccountLayout eyebrow="Account" title="Notifications" description="Booking, payment, message and support updates sent to your account."><NotificationCentre userId={session.user.id} surface="customer" searchParams={searchParams}/></AccountLayout>;
}
