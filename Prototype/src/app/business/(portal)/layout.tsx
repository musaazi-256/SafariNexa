import type { ReactNode } from "react";

import { BusinessSidebar } from "@/components/business-sidebar";
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
      <BusinessSidebar businesses={businesses} activeBusinessId={businessId} />
      <SidebarInset className="bg-[#f8f9fa]">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-white px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <span className="text-sm font-semibold text-slate-900">Business portal</span>
          </div>
          <div className="flex items-center gap-4">
            {session?.user && (
              <UserMenu 
                name={session.user.name} 
                email={session.user.email} 
                image={session.user.image} 
                unreadCount={unreadCount}
              >
                <SignOutMenuItem />
              </UserMenu>
            )}
          </div>
        </header>
        <div className="flex-1 space-y-6 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
