"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, CalendarDays, Star, Settings, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerificationActionModal } from "./verification-modals";

export function DashboardQuickActions({ verificationStatus }: { verificationStatus: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const actions = [
    { href: "/business/listings/new", label: "Add a listing", icon: Plus },
    { href: "/business/bookings/calendar", label: "Booking calendar", icon: CalendarDays },
    { href: "/business/reviews", label: "Respond to reviews", icon: Star },
    { href: "/business/settings", label: "Business settings", icon: Settings }
  ];
  return <>
    <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
      {actions.map(action => <Button key={action.href} asChild variant="ghost" className="h-auto min-h-11 justify-start px-3 py-3">
        <Link href={action.href} onClick={event => {
          if (action.href === "/business/listings/new" && verificationStatus !== "APPROVED") {
            event.preventDefault();
            setModalOpen(true);
          }
        }}><action.icon className="text-muted-foreground" /><span className="flex-1 text-left">{action.label}</span><ArrowUpRight className="text-muted-foreground" /></Link>
      </Button>)}
    </div>
    <VerificationActionModal isOpen={modalOpen} onOpenChange={setModalOpen} verificationStatus={verificationStatus} attemptedAction="add a new listing" />
  </>;
}
