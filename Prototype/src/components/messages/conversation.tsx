"use client";

import type { FormEvent, ReactNode } from "react";
import { format, isSameDay } from "date-fns";
import { CheckCheck, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConversationMessage = { id: string; content: string; createdAt: Date | string; senderId: string; senderName?: string | null; readAt?: Date | string | null; pending?: boolean };

/** Shared by the inboxes, booking inquiries and support case conversations. */
export function ConversationMessages({ messages, currentUserId, emptyText = "No messages yet. Start the conversation below.", outgoingSenderIds }: { messages: ConversationMessage[]; currentUserId: string; emptyText?: string; outgoingSenderIds?: string[] }) {
  if (!messages.length) return <p className="py-12 text-center text-sm text-muted-foreground leading-relaxed">{emptyText}</p>;
  return <div className="flex min-w-0 flex-col space-y-4" role="log" aria-label="Conversation messages" aria-live="polite">
    {messages.map((message, index) => {
      const date = new Date(message.createdAt);
      const previous = messages[index - 1];
      const ownUser = message.senderId === currentUserId;
      const mine = ownUser || Boolean(outgoingSenderIds?.includes(message.senderId));
      return <div key={message.id} className="min-w-0 space-y-4">
        {(!previous || !isSameDay(new Date(previous.createdAt), date)) && <div className="my-3 flex justify-center"><span className="rounded-full border border-border/50 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{format(date, "dd MMM yyyy")}</span></div>}
        <div className={cn("flex max-w-[85%] flex-col md:max-w-[75%]", mine ? "ml-auto items-end" : "items-start")}>
          {message.senderName && <p className="mb-1 px-1 type-caption text-slate-500">{ownUser ? "You" : message.senderName}</p>}
          <div className={cn("min-w-0 max-w-full whitespace-pre-wrap break-words rounded-2xl border px-4 py-3 type-body-sm [overflow-wrap:anywhere]", mine ? "rounded-tr-sm border-transparent bg-[#0B4928] text-white" : "rounded-tl-sm border-border bg-white text-slate-800")}>{message.content}</div>
          <div className="mt-1 flex items-center gap-1.5 px-1 type-caption text-slate-500"><time dateTime={date.toISOString()}>{message.pending ? "Sending…" : format(date, "h:mm a")}</time>{ownUser && !message.pending && message.readAt !== undefined && <CheckCheck aria-label={message.readAt ? "Read" : "Sent"} className={cn("h-3 w-3", message.readAt ? "text-[#0B4928]" : "text-slate-400")} />}</div>
        </div>
      </div>;
    })}
  </div>;
}

export function MessageComposer({ draft, onDraftChange, onSubmit, pending, error, placeholder = "Type your message…", hiddenFields }: { draft: string; onDraftChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; pending?: boolean; error?: string; placeholder?: string; hiddenFields?: ReactNode }) {
  return <div className="border-t border-slate-100 bg-white p-4">
    <form onSubmit={onSubmit} className="relative overflow-hidden rounded-xl border border-input transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      {hiddenFields}
      <textarea aria-label="Message" name="body" value={draft} onChange={event => onDraftChange(event.target.value)} placeholder={placeholder} required maxLength={5000} disabled={pending} className="block min-h-[100px] w-full resize-none border-none bg-white p-4 pb-14 text-base font-normal leading-relaxed md:text-sm outline-none" onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
      <Button type="submit" loading={pending} disabled={!draft.trim()} aria-label="Send message" className="absolute bottom-3 right-3 h-8 gap-1.5 rounded-lg bg-[#0B4928] px-4 text-xs font-medium text-white hover:bg-[#0B4928]/90">{!pending && <Send className="h-3 w-3" />}{pending ? "Sending…" : "Send"}</Button>
    </form>
    {error && <p role="alert" className="mt-2 text-sm text-destructive leading-relaxed">{error}</p>}
  </div>;
}
