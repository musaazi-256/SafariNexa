"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Banknote,
  Building2,
  ClipboardCheck,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  ShieldCheck,
  Star,
  Users,
  Settings,
  UserCircle
} from "lucide-react";

import { signOutAction } from "@/lib/actions";
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
  SidebarMenuItem
} from "@/components/ui/sidebar";

const GROUPS = [
  {
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }]
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/businesses", label: "Businesses", icon: Building2 },
      { href: "/admin/verification", label: "Verification", icon: ShieldCheck }
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
      { href: "/admin/reviews", label: "Reviews", icon: Star }
    ]
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings }
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="mb-2 px-1.5 flex items-center">
            <Logo size="sm" />
          </SidebarMenuItem>
            <div className="flex flex-col ml-2">
              <span className="text-[14px] font-bold text-slate-900 leading-none">Admin Portal</span>
              <span className="text-[12px] font-semibold text-slate-500 mt-1">SafariNexa</span>
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
                      <Link href={item.href}>
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
        {/* System Status Widget */}
        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
          <div className="flex flex-col mb-4">
            <span className="text-[13px] font-bold text-slate-900 mb-2">System status</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#1e613c]"></div>
              <span className="text-[12px] font-bold text-[#1e613c]">All systems operational</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 mt-0.5">Updated 2 mins ago</span>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-500">Uptime</span>
              <span className="text-[12px] font-bold text-[#1e613c]">99.98%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-500">Response time</span>
              <span className="text-[12px] font-bold text-[#1e613c]">145ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-500">Active users</span>
              <span className="text-[12px] font-bold text-[#1e613c]">128</span>
            </div>
          </div>
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
              <SidebarMenuButton type="submit" className="text-destructive hover:bg-destructive/10">
                <LogOut />
                Sign out
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
