import type { ReactNode } from "react";
import { LiveRefresh } from "@/components/live-refresh";

import { BusinessSidebar } from "@/components/business/business-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireBusinessSession } from "@/lib/business";
import { auth } from "@/auth";
import { UserMenu } from "@/components/user-menu";
import { SignOutMenuItem } from "@/components/sign-out-button";
import { getUnreadNotificationCount } from "@/lib/notifications";

export default async function BusinessPortalLayout({ children }: { children: ReactNode }) {
  const { businessId, businesses } = await requireBusinessSession();
  const session = await auth();
  const unreadCount = session?.user ? await getUnreadNotificationCount(session.user.id) : 0;

  return (
    <SidebarProvider>
      <LiveRefresh />
      <BusinessSidebar businesses={businesses} activeBusinessId={businessId} />
      <SidebarInset className="bg-muted/40">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <span className="text-sm font-semibold text-muted-foreground">Business portal</span>
          </div>
          <div className="flex items-center gap-4">
            {session?.user && (
              <UserMenu
                name={session.user.name}
                email={session.user.email}
                image={session.user.image}
                unreadCount={unreadCount}
                surface="business"
              >
                <SignOutMenuItem />
              </UserMenu>
            )}
          </div>
        </header>
        <div className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 space-y-6 p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
