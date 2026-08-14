"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Settings
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
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/support", label: "Support", icon: LifeBuoy }
    ]
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports", icon: Gauge },
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
          <SidebarMenuItem className="px-1.5">
            <span className="text-sm font-bold">Admin portal</span>
          </SidebarMenuItem>
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
      <SidebarFooter>
        <SidebarMenu>
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
