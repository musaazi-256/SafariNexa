"use client";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    if (!isSignedIn) {
      window.location.href = `/auth/sign-in?returnTo=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsSending(true);
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
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs rounded-xl h-10 px-4 gap-2 shadow-xs"
        >
          <MessageSquare className="h-4 w-4 text-[#0d5932]" />
          <span>Inquire / Contact Host</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl font-sans">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#0d5932]" />
            Send Inquiry to {businessName}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Asking about <span className="font-bold text-slate-700">{listingTitle}</span>. The host will reply directly to your messages inbox.
          </DialogDescription>
        </DialogHeader>

        {sentSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 animate-bounce" />
            <h4 className="font-bold text-base text-slate-900">Inquiry Sent Successfully!</h4>
            <p className="text-xs text-slate-500">Your message has been sent to {businessName}. Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">Your Question or Special Request</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Hi! I'm interested in ${listingTitle}. Can you tell me more about check-in times or availability...`}
                rows={4}
                className="resize-none rounded-xl border-slate-200 text-xs font-medium focus-visible:ring-[#0d5932]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-xs font-bold text-slate-500 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!content.trim() || isSending}
                className="bg-[#0d5932] hover:bg-[#0a4526] text-white font-bold text-xs rounded-xl h-10 px-5 gap-2"
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Inquiry
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
