"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Heart, LayoutDashboard, Bell, LifeBuoy, Settings, CreditCard, MessageSquareText } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/profile", label: "Profile", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/profile/saved", label: "Saved", icon: Heart },
  { href: "/profile/messages", label: "Messages", icon: MessageSquareText },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/profile/payment-settings", label: "Payments", icon: CreditCard },
  { href: "/profile/preferences", label: "Preferences", icon: Settings },
];

export function AccountSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    // "/profile" is a path prefix of "/profile/saved" and "/profile/preferences",
    // which have their own tabs — so it only lights up on an exact match.
    return pathname === href || (href !== "/profile" && pathname?.startsWith(`${href}/`));
  }

  return (
    <>
      {/* Mobile: a compact horizontal scroll strip instead of dumping all 8 items
       * as a full-width vertical block above the page content. */}
      <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              isActive(item.href)
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Desktop: full sticky sidebar */}
      <div className="hidden h-full min-h-[500px] flex-col md:flex">
        <nav className="flex flex-col gap-2 flex-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              isActive(item.href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
        </nav>

        <div className="mt-8 rounded-xl border bg-card p-4">
          <h4 className="mb-1 text-sm font-semibold">Need help?</h4>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Get help with your account or bookings.
          </p>
          <Link href="/support" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            <MessageSquareText className="h-4 w-4" />
            Contact support
          </Link>
        </div>
      </div>
    </>
  );
}
