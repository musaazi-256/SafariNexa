"use client";
import { MessageComposer } from "@/components/messages/conversation";

import { useState } from "react";
import { MessageSquare, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sendListingInquiryAction } from "@/lib/actions/messages";

export function InquiryDialog({
  listingId,
  listingTitle,
  businessName,
  isSignedIn = true,
}: {
  listingId: string;
  listingTitle: string;
  businessName: string;
  isSignedIn?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    if (!isSignedIn) {
      window.location.href = `/auth/sign-in?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsSending(true);
    setErrorMessage("");
    try {
      await sendListingInquiryAction(listingId, content.trim());
      setSentSuccess(true);
      setContent("");
      setTimeout(() => {
        setSentSuccess(false);
        setOpen(false);
      }, 2000);
    } catch (error) {
      console.error(error);
      setErrorMessage("Your inquiry was not sent. Please try again. You can find successful inquiries in your Messages inbox.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-border bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium text-xs rounded-xl h-10 px-4 gap-2 shadow-xs"
        >
          <MessageSquare className="h-4 w-4 text-[#0d5932]" />
          <span>Inquire / Contact Host</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl font-sans">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#0d5932]" />
            Send Inquiry to {businessName}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Asking about <span className="font-semibold text-slate-700">{listingTitle}</span>. The host will reply directly to your messages inbox.
          </DialogDescription>
        </DialogHeader>

        {sentSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
            <h4 className="font-semibold text-base text-slate-900">Message sent</h4>
            <p className="text-xs text-slate-500">Your message has been sent to {businessName}. Replies appear in your Messages inbox.</p>
          </div>
        ) : (
          <div className="pt-2">
            <MessageComposer draft={content} onDraftChange={setContent} onSubmit={handleSubmit} pending={isSending} error={errorMessage} placeholder="Type your question or special request…" />
            <div className="flex justify-end"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
