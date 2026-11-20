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
              <Link href="/business/settings/verification">
                Go to Verification <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
