import type { ReactNode } from "react";
import { LiveRefresh } from "@/components/live-refresh";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { requireAdminSession } from "@/lib/admin";

export default async function AdminPortalLayout({ children }: { children: ReactNode }) {
  await requireAdminSession();

  return (
    <SidebarProvider>
      <LiveRefresh />
      <AdminSidebar />
      <SidebarInset className="bg-muted/40">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4 sm:px-6">
          <SidebarTrigger />
          <span className="text-sm font-semibold text-muted-foreground">Admin portal</span>
        </header>
        <div className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 space-y-6 p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
