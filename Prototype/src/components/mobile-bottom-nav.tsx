"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Search, Heart, User, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/profile/saved", label: "Saved", icon: Heart },
  { href: "/profile/messages", label: "Messages", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User }
];

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on certain paths if needed, e.g. business/admin portals or auth
  if (pathname?.startsWith("/business") || pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-[68px] items-center justify-around border-t border-border bg-background/95 pb-safe backdrop-blur md:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
