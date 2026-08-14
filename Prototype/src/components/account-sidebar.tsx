"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Heart, LayoutDashboard, Bell, LifeBuoy, Settings, CreditCard } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/profile", label: "Profile", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/profile/saved", label: "Saved", icon: Heart },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/profile/payment-settings", label: "Payments", icon: CreditCard },
  { href: "/profile/preferences", label: "Preferences", icon: Settings },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {NAV_ITEMS.map((item) => {
        // "/profile" is a path prefix of "/profile/saved" and "/profile/preferences",
        // which have their own tabs — so it only lights up on an exact match.
        const isActive =
          pathname === item.href || (item.href !== "/profile" && pathname?.startsWith(`${item.href}/`));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
              isActive
                ? "bg-brand-green text-white shadow-md"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
