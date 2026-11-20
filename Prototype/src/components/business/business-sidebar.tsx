"use client";

import { Bell } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  LifeBuoy,
  CreditCard,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Star,
  Users,
  UserCircle,
  BarChart3,
  Settings as SettingsIcon,
  ShieldCheck
} from "lucide-react";

import { BusinessSwitcher } from "@/components/business/business-switcher";
import { signOutAction } from "@/lib/actions/session";
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
    items: [
      { href: "/business/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/business/listings", label: "Listings", icon: ClipboardList },
      { href: "/business/guides", label: "Guides", icon: Users },
      { href: "/business/bookings", label: "Bookings", icon: CalendarClock },
      { href: "/business/customers", label: "Customers", icon: Users },
      { href: "/business/payments", label: "Payments & refunds", icon: CreditCard },
      { href: "/business/messages", label: "Messages", icon: MessageCircle },
      { href: "/business/reviews", label: "Reviews", icon: Star },
      { href: "/business/revenue", label: "Earnings", icon: Banknote }
    ]
  },
  {
    label: "Settings",
    items: [
      { href: "/business/verification", label: "Verification", icon: ShieldCheck },
      { href: "/business/notifications", label: "Notifications", icon: Bell },
      { href: "/business/settings", label: "Settings", icon: SettingsIcon },
      { href: "/business/support", label: "Support", icon: LifeBuoy }
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
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="mb-2 px-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-primary">SafariNexa</span>
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem><SidebarMenuButton asChild isActive={pathname === "/business/profile"}>
            <Link href="/business/profile" onClick={() => setOpenMobile(false)}><UserCircle />My profile</Link>
          </SidebarMenuButton></SidebarMenuItem>
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
