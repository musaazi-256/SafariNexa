"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, FileText, ArrowRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VerificationWelcomeModalProps {
  verificationStatus: string;
}

export function VerificationWelcomeModal({ verificationStatus }: VerificationWelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (verificationStatus !== "APPROVED") {
      setIsOpen(true);
    }
  }, [verificationStatus]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md text-center sm:text-left">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 sm:mx-0">
          <AlertCircle className="h-6 w-6 text-warning" />
        </div>
        <DialogHeader className="mt-4">
          <DialogTitle className="text-xl">Welcome to SafariNexa!</DialogTitle>
          <DialogDescription className="mt-2 text-base">
            Your account is currently <strong className="text-slate-900">{verificationStatus.replace("_", " ")}</strong>.
            <br /><br />
            You can explore the platform and set up your profile, but you won&apos;t be able to publish listings or receive bookings until your business is verified.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
            Explore platform
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/business/verification">
              Check verification status
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface VerificationActionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  verificationStatus: string;
  attemptedAction?: string;
}

export function VerificationActionModal({
  isOpen,
  onOpenChange,
  verificationStatus,
  attemptedAction = "perform this action"
}: VerificationActionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
            <FileText className="h-6 w-6 text-slate-600" />
          </div>
          <DialogHeader>
            <DialogTitle>Verification Required</DialogTitle>
            <DialogDescription className="mt-2">
              You cannot {attemptedAction} because your business is not yet verified.
              Current status: <strong className="text-slate-900 uppercase">{verificationStatus.replace("_", " ")}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex flex-col gap-3 w-full sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button asChild>
              <Link href="/business/verification">
                Go to Verification <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
