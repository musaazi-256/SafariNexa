"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
  BarChart3,
  Settings as SettingsIcon
} from "lucide-react";

import { BusinessSwitcher } from "@/components/business-switcher";
import { signOutAction } from "@/lib/actions";
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
    items: [
      { href: "/business/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/business/listings", label: "Listings", icon: ClipboardList },
      { href: "/business/bookings", label: "Bookings", icon: CalendarClock },
      { href: "/business/messages", label: "Messages", icon: MessageCircle },
      { href: "/business/reviews", label: "Reviews", icon: Star },
      { href: "/business/revenue", label: "Earnings", icon: Banknote }
    ]
  },
  {
    label: "Manage",
    items: [
      { href: "/business/team", label: "Team", icon: Users }
    ]
  },
  {
    label: "Settings",
    items: [
      { href: "/business/settings", label: "Settings", icon: SettingsIcon }
    ]
  }
];

export function BusinessSidebar({
  businesses,
  activeBusinessId
}: {
  businesses: Array<{ id: string; name: string; type: string }>;
  activeBusinessId?: string;
}) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="mb-2 px-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-primary">SafariNexa</span>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <BusinessSwitcher businesses={businesses} activeBusinessId={activeBusinessId} />
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
