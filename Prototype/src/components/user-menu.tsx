"use client";

import Link from "next/link";
import { Bell, Heart, LayoutDashboard, LifeBuoy, MapPin, Settings, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

function initials(name?: string | null, email?: string | null) {
  const source = name ?? email ?? "SafariNexa";
  return source
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({
  name,
  email,
  image,
  unreadCount = 0,
  children
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  unreadCount?: number;
  children?: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar>
          {image ? <AvatarImage src={image} alt={name ?? "Account"} /> : null}
          <AvatarFallback>{initials(name, email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{name ?? email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/bookings">
            <LayoutDashboard className="h-4 w-4" />
            My bookings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/saved">
            <Heart className="h-4 w-4" />
            Saved
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/trip-planner">
            <MapPin className="h-4 w-4" />
            Trip planner
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 ? (
              <Badge variant="destructive" className="ml-auto px-1.5 py-0">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            ) : null}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/support">
            <LifeBuoy className="h-4 w-4" />
            Support
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/preferences">
            <Settings className="h-4 w-4" />
            Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
