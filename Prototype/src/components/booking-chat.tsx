"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Loader2, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendBookingInquiryAction } from "@/lib/actions/messages";
import { cn } from "@/lib/utils";

export type BookingChatMessage = {
  id: string;
  content: string;
  createdAt: Date | string;
  senderId: string;
  senderName?: string | null;
};

export function BookingChat({
  bookingId,
  initialMessages,
  currentUserId,
  businessName,
  isBusinessPortal = false
}: {
  bookingId: string;
  initialMessages: BookingChatMessage[];
  currentUserId: string;
  businessName: string;
  isBusinessPortal?: boolean;
}) {
  const [messages, setMessages] = useState<BookingChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isSending) return;

    const content = draft.trim();
    setDraft("");
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: BookingChatMessage = {
      id: tempId,
      content,
      createdAt: new Date(),
      senderId: currentUserId,
      senderName: "You"
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const realMessage = await sendBookingInquiryAction(bookingId, content);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...realMessage,
                senderName: "You"
              }
            : msg
        )
      );
    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setDraft(content);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="mt-8 border border-slate-200 shadow-sm rounded-2xl overflow-hidden font-sans">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
        <CardTitle className="text-lg font-bold flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-[#0d5932]" />
            <span>{isBusinessPortal ? "Customer Messages & Inquiries" : "Messages & Inquiries"}</span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {isBusinessPortal ? "Direct line with customer" : `Direct line with ${businessName}`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Conversation List */}
        <div ref={scrollRef} className="max-h-[320px] min-h-[140px] overflow-y-auto p-5 space-y-4 bg-white">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <MessageSquare className="h-8 w-8 mb-2 opacity-50 text-[#0d5932]" />
              <p className="text-sm font-semibold text-slate-600">No messages sent yet.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {isBusinessPortal
                  ? "Send an inquiry or message to the customer regarding this booking."
                  : "Have a question or request about your stay or tour? Send an inquiry directly to the business."}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUserId;
              const dateObj = typeof msg.createdAt === "string" ? new Date(msg.createdAt) : msg.createdAt;
              const formattedTime = dateObj.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });

              return (
                <div key={msg.id} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-slate-400">
                    <span>{isMine ? "You" : msg.senderName || (isBusinessPortal ? "Customer" : businessName)}</span>
                    <span>•</span>
                    <span>{formattedTime}</span>
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap font-medium shadow-xs",
                      isMine
                        ? "bg-[#0d5932] text-white rounded-br-none"
                        : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-slate-50/30 flex gap-3 items-end">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              isBusinessPortal
                ? "Type a reply to the customer..."
                : `Need to ask ${businessName} something about this booking? Type your inquiry...`
            }
            className="min-h-[44px] max-h-32 resize-none rounded-xl border-slate-200 bg-white font-medium text-xs focus-visible:ring-[#0d5932]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!draft.trim() || isSending}
            className="bg-[#0d5932] hover:bg-[#0a4526] text-white font-bold h-11 px-4 rounded-xl shrink-0 gap-1.5"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
