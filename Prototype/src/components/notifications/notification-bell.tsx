import Link from "next/link";
import { Bell } from "lucide-react";
import { NOTIFICATION_PATHS, type NotificationSurface } from "@/lib/notification-policy";
export function NotificationBell({surface,unreadCount}:{surface:NotificationSurface;unreadCount:number}) {
  return <Link href={NOTIFICATION_PATHS[surface]} aria-label={`Notifications${unreadCount?`, ${unreadCount} unread`:""}`} title="Notifications" className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"><Bell className="h-4 w-4" aria-hidden="true"/>{unreadCount>0&&<span aria-hidden="true" className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-center text-xs leading-4 text-white">{unreadCount>99?"99+":unreadCount}</span>}</Link>;
}
