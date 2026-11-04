"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Loader2, Store, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendBookingInquiryAction } from "@/lib/actions/messages";
import { ConversationMessages, MessageComposer } from "@/components/messages/conversation";

export type BookingChatMessage = {
  id: string;
  content: string;
  createdAt: Date | string;
  senderId: string;
  senderName?: string | null;
  pending?: boolean;
};

export function BookingChat({
  bookingId,
  initialMessages,
  currentUserId,
  businessName,
  isBusinessPortal = false,
  recipientId
}: {
  bookingId: string;
  initialMessages: BookingChatMessage[];
  currentUserId: string;
  businessName: string;
  isBusinessPortal?: boolean;
  recipientId?: string;
}) {
  const [messages, setMessages] = useState<BookingChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setMessages(initialMessages); }, [initialMessages]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || isSending) return;

    setError("");
    const content = draft.trim();
    setDraft("");
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: BookingChatMessage = {
      id: tempId,
      content,
      createdAt: new Date(),
      senderId: currentUserId,
      senderName: "You",
      pending: true
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
      setError("Your message could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="mt-8 overflow-hidden rounded-2xl border border-border bg-white shadow-card">
      <CardHeader className="border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageSquare className="h-5 w-5" /></span><div className="min-w-0"><CardTitle>Messages</CardTitle><p className="mt-1 break-words text-sm text-muted-foreground leading-relaxed">{businessName}</p></div></div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={scrollRef} className="max-h-[420px] min-h-[220px] overflow-y-auto bg-[#FAFBFA] p-4 sm:p-6"><ConversationMessages messages={messages} currentUserId={currentUserId} outgoingSenderIds={isBusinessPortal && recipientId ? messages.filter(message => message.senderId !== recipientId).map(message => message.senderId) : undefined} /></div>
        <MessageComposer draft={draft} onDraftChange={setDraft} onSubmit={handleSend} pending={isSending} error={error} placeholder={isBusinessPortal ? "Type your reply to the customer…" : "Type your message to the business…"} />
      </CardContent>
    </Card>
  );
}
