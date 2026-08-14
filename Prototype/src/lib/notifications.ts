import { db } from "@/lib/db";

export function getUnreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, isRead: false } });
}
