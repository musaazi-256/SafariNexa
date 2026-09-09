"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Ticket, Calendar as CalendarIcon, Star, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { VerificationActionModal } from "./verification-modals";

interface DashboardQuickActionsProps {
  verificationStatus: string;
}

export function DashboardQuickActions({ verificationStatus }: DashboardQuickActionsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [attemptedAction, setAttemptedAction] = useState("");

  const isVerified = verificationStatus === "APPROVED";

  const handleAction = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, actionName: string) => {
    if (!isVerified) {
      e.preventDefault();
      setAttemptedAction(actionName);
      setModalOpen(true);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 overflow-x-auto custom-scrollbar whitespace-nowrap">
        <span className="text-sm font-bold text-slate-900 shrink-0 px-2 sm:px-4">Quick actions</span>
        <div className="w-px h-6 bg-slate-200 hidden sm:block shrink-0" />
        
        <Button variant="ghost" asChild className="text-slate-700 font-medium shrink-0">
          <Link href="/business/listings/new" onClick={(e) => handleAction(e, "add a new listing")}>
            <Plus className="mr-2 h-4 w-4 text-[#0B4928]" /> Add new listing
          </Link>
        </Button>
        <Button variant="ghost" disabled className="text-slate-400 font-medium shrink-0">
          <Ticket className="mr-2 h-4 w-4" /> Create promotion
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">Soon</span>
        </Button>
        <Button variant="ghost" asChild className="text-slate-700 font-medium shrink-0">
          <Link href="/business/bookings" onClick={(e) => handleAction(e, "view the calendar")}>
            <CalendarIcon className="mr-2 h-4 w-4 text-green-600" /> View calendar
          </Link>
        </Button>
        <Button variant="ghost" asChild className="text-slate-700 font-medium shrink-0">
          <Link href="/business/reviews" onClick={(e) => handleAction(e, "respond to reviews")}>
            <Star className="mr-2 h-4 w-4 text-amber-400" /> Respond to reviews
          </Link>
        </Button>
        <Button variant="ghost" disabled className="text-slate-400 font-medium shrink-0 ml-auto hidden md:flex">
          <Download className="mr-2 h-4 w-4" /> Download report
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">Soon</span>
        </Button>
      </div>

      <VerificationActionModal 
        isOpen={modalOpen} 
        onOpenChange={setModalOpen} 
        verificationStatus={verificationStatus}
        attemptedAction={attemptedAction}
      />
    </>
  );
}
