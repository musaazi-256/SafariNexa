"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin";
import { setActiveBusiness } from "@/lib/actions/business";
import { notificationDestination, NOTIFICATION_PATHS, type NotificationSurface } from "@/lib/notification-policy";

function surfaceOf(data: FormData): NotificationSurface {
  const value = data.get("surface");
  return value === "admin" || value === "business" ? value : "customer";
}
async function viewer(surface: NotificationSurface) {
  const session = surface === "admin" ? await requireAdminSession() : await auth();
  if (!session?.user) redirect(`/auth/sign-in?returnTo=${encodeURIComponent(NOTIFICATION_PATHS[surface])}`);
  return session.user;
}
function refreshNotifications() {
  revalidatePath("/", "layout");
}
export async function markNotificationRead(data: FormData) {
  const user = await viewer(surfaceOf(data));
  await db.notification.updateMany({where: {id: String(data.get("notificationId") ?? ""), userId: user.id}, data: {isRead: true}});
  refreshNotifications();
}
export async function markAllNotificationsRead(data: FormData) {
  const user = await viewer(surfaceOf(data));
  await db.notification.updateMany({where: {userId: user.id, isRead: false}, data: {isRead: true}});
  refreshNotifications();
}
export async function openNotification(data: FormData) {
  const surface = surfaceOf(data);
  const user = await viewer(surface);
  const record = await db.notification.findFirst({where: {id: String(data.get("notificationId") ?? ""), userId: user.id}, include: {relatedBooking: true, supportCase: true}});
  if (!record) redirect(NOTIFICATION_PATHS[surface]);
  const memberships = await db.businessUser.findMany({where: {userId: user.id}, select: {businessId: true}});
  const destination = notificationDestination(record, {userId: user.id, surface, businessIds: memberships.map(member => member.businessId)});
  if (destination && "businessId" in destination && destination.businessId) await setActiveBusiness(destination.businessId);
  await db.notification.updateMany({where: {id: record.id, userId: user.id}, data: {isRead: true}});
  refreshNotifications();
  redirect(destination?.href ?? NOTIFICATION_PATHS[surface]);
}

export async function saveNotificationPreferences(_previous: {message:string;error?:boolean}, data: FormData) {
  const user=await viewer("customer");
  const {NOTIFICATION_TYPES}=await import("@/lib/preferences");
  const notify=Object.fromEntries(NOTIFICATION_TYPES.map(type=>[type,data.has(`notify_${type}`)]));
  try {
    await db.customerProfile.upsert({where:{userId:user.id},update:{preferences:{notify}},create:{userId:user.id,preferences:{notify}}});
    refreshNotifications();
    return {message:"Notification categories saved to your account."};
  } catch {
    return {message:"Your categories could not be saved. Please try again.",error:true};
  }
}
