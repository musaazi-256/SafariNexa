"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Heart, LayoutDashboard, Bell, LifeBuoy, Settings, CreditCard, MessageSquareText } from "lucide-react";

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
    <div className="flex flex-col h-full min-h-[500px]">
      <nav className="flex flex-col gap-2 flex-1">
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
                ? "bg-[#1e613c] text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
      </nav>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
        <h4 className="font-bold text-slate-900 mb-1">Need help?</h4>
        <p className="text-[13px] font-medium text-slate-500 mb-4 leading-relaxed">
          Our support team is here to help you succeed.
        </p>
        <Link href="/support" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors w-full justify-center shadow-sm">
          <MessageSquareText className="h-4 w-4" />
          Contact support
        </Link>
      </div>
    </div>
  );
}
