import { TablePreferencesProvider } from "@/components/ui/table-column-visibility";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { DemoToolbar } from "@/components/demo-toolbar";
import type { ReactNode } from "react";
import { LiveRefresh } from "@/components/live-refresh";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireAdminSession } from "@/lib/admin";

export default async function AdminPortalLayout({ children }: { children: ReactNode }) {
  const session=await requireAdminSession();
  const unreadCount=await getUnreadNotificationCount(session.user.id);

  return (
    <SidebarProvider>
      <LiveRefresh />
      <AdminSidebar />
      <SidebarInset className="bg-white">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-white px-4 sm:px-6">
          <SidebarTrigger />
          <span className="text-sm font-semibold text-muted-foreground">Admin portal</span>
          <div className="ml-auto flex items-center gap-2"><DemoToolbar surfaces={["customer", "business"]} /><NotificationBell surface="admin" unreadCount={unreadCount}/></div>
        </header>
        <div className="portal-content flex-1 min-w-0 p-4 sm:p-6"><TablePreferencesProvider userId={session.user.id}>{children}</TablePreferencesProvider></div>
      </SidebarInset>
    </SidebarProvider>
  );
}
