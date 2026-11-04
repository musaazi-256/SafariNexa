import { TablePreferencesProvider } from "@/components/ui/table-column-visibility";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DemoToolbar } from "@/components/demo-toolbar";
import type { ReactNode } from "react";
import { LiveRefresh } from "@/components/live-refresh";

import { BusinessSidebar } from "@/components/business/business-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireBusinessSession } from "@/lib/business";
import { UserMenu } from "@/components/user-menu";
import { SignOutMenuItem } from "@/components/sign-out-button";
import { getUnreadNotificationCount } from "@/lib/notifications";

export default async function BusinessPortalLayout({ children }: { children: ReactNode }) {
  const { businessId, businesses, session, account } = await requireBusinessSession();
  const unreadCount = session?.user ? await getUnreadNotificationCount(session.user.id) : 0;

  return (
    <SidebarProvider>
      <LiveRefresh />
      <BusinessSidebar businesses={businesses} activeBusinessId={businessId} />
      <SidebarInset className="bg-white">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-white px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <SidebarTrigger />
            <span className="hidden text-sm font-semibold text-slate-900 sm:inline">Business portal</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <DemoToolbar surfaces={["customer", "admin"]} />
            <NotificationBell surface="business" unreadCount={unreadCount}/>
            {session?.user && (
              <UserMenu
                name={account?.name ?? session.user.name}
                email={account?.email ?? session.user.email}
                image={account?.image ?? session.user.image}
                unreadCount={unreadCount}
                surface="business"
              >
                <SignOutMenuItem />
              </UserMenu>
            )}
          </div>
        </header>
        <div className="portal-content flex-1 min-w-0 p-4 sm:p-6"><TablePreferencesProvider userId={session.user.id}>{children}</TablePreferencesProvider></div>
      </SidebarInset>
    </SidebarProvider>
  );
}
