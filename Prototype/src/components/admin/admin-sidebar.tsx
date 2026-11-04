"use client";

import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Bell } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Banknote,
  Building2,
  ClipboardCheck,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  Star,
  Users,
  Settings,
  UserCircle
} from "lucide-react";

import { signOutAction } from "@/lib/actions/session";
import { Logo } from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";

const GROUPS = [
  {
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }]
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/businesses", label: "Businesses", icon: Building2 },
      { href: "/admin/verification", label: "Business verification", icon: ShieldCheck },
      { href: "/admin/listings", label: "Listing reviews", icon: ClipboardCheck }
    ]
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: ClipboardCheck },
      { href: "/admin/payments", label: "Payments", icon: Banknote }
    ]
  },
  {
    label: "Community",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/roles", label: "Roles & permissions", icon: KeyRound },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/support", label: "Support", icon: LifeBuoy },
      { href: "/admin/audit", label: "Audit trail", icon: Gauge }
    ]
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/settings", label: "Settings", icon: Settings }
    ]
  }
];

export function AdminSidebar() {
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="mb-2 px-1.5 flex items-center">
            <Logo size="sm" />
          </SidebarMenuItem>
            <div className="flex flex-col ml-2">
              <span className="text-sm font-medium text-slate-900 leading-none">Admin Portal</span>
              <span className="text-xs font-medium text-slate-500 mt-1">SafariNexa</span>
            </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {GROUPS.map((group, i) => (
          <SidebarGroup key={i}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} onClick={() => setOpenMobile(false)}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3">
          <span className="text-xs font-medium text-slate-700">System health</span>
          <p className="mt-1 text-xs leading-5 text-slate-500">Monitoring data is unavailable.</p>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/admin/profile"}>
              <Link href="/admin/profile">
                <UserCircle />
                Profile
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOutAction}>
              <ConfirmSubmit
                title="Sign out of the admin portal?"
                description="You'll need to sign in again to manage SafariNexa."
                confirmLabel="Sign out"
                trigger={
                  <SidebarMenuButton className="text-destructive hover:bg-destructive/10">
                    <LogOut />
                    Sign out
                  </SidebarMenuButton>
                }
              />
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
