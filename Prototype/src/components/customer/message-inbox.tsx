"use client";
import { useConversationSync } from "@/components/messages/use-conversation-sync";
import { ConversationMessages, MessageComposer } from "@/components/messages/conversation";

import { useState, useRef, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { Search, Calendar, Send, CheckCheck, Store, ChevronLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage, markThreadAsRead, getThreadMessages } from "@/lib/actions/messages";
import { EmptyState } from "../ui/empty-state";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export type MessageType = {
  id: string;
  content: string;
  createdAt: Date | string;
  senderId: string;
  readAt?: Date | string | null;
  sender: { name: string | null; image: string | null };
};

export type ThreadType = {
  id: string;
  updatedAt: Date | string;
  business: { 
    id: string; 
    name: string; 
    logoUrl: string | null; 
  };
  booking: { 
    id: string; 
    bookingRef: string; 
    startDate: Date | string | null;
    status: string;
    listing: { title: string; coverImageUrl: string | null };
  } | null;
  messages: MessageType[];
};

export function CustomerMessageInbox({ initialThreads, customerUserId }: { initialThreads: ThreadType[], customerUserId: string }) {
  const [threads, setThreads] = useState<ThreadType[]>(initialThreads);
  useEffect(() => {
    setThreads(initialThreads);
    setActiveThreadId(current => current && initialThreads.some(thread => thread.id === current) ? current : null);
  }, [initialThreads]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreads[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const activeThread = threads.find(t => t.id === activeThreadId);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread?.messages]);

  useConversationSync(activeThreadId, isSending, customerUserId, setThreads);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeThreadId || isSending) return;

    setIsSending(true);
    setSendError("");
    const content = draft;
    setDraft("");

    try {
      const newMessage = await sendMessage(activeThreadId, content);
      
      // Optimistic update
      setThreads(prev => prev.map(thread => {
        if (thread.id === activeThreadId) {
          return {
            ...thread,
            updatedAt: newMessage.createdAt,
            messages: [...thread.messages, {
              ...newMessage,
              sender: { name: "You", image: null }
            }]
          };
        }
        return thread;
      }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      
    } catch (error) {
      console.error(error);
      setDraft(content);
      setSendError("Your message could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const getUnreadCount = (thread: ThreadType) => {
    return thread.messages.filter(m => m.senderId !== customerUserId && !m.readAt).length;
  };

  const filteredThreads = threads.filter(thread => {
    const businessName = thread.business.name || "";
    const listingTitle = thread.booking?.listing.title || "";
    const bookingRef = thread.booking?.bookingRef || "";
    const lastMsg = thread.messages[thread.messages.length - 1]?.content || "";

    return (
      !searchQuery.trim() ||
      businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastMsg.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (threads.length === 0) {
    return (
      <div className="h-[min(60svh,520px)] min-h-[320px] border border-border rounded-2xl flex items-center justify-center bg-white shadow-sm">
        <EmptyState title="No messages yet" description="When you message a business about a booking, it will appear here." />
      </div>
    );
  }

  return (
    <div className="flex h-[min(75svh,680px)] min-h-[440px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm font-sans">
      
      {/* Left Pane: Thread List */}
      <div className={cn("w-full md:w-[350px] flex flex-col border-r border-border bg-white shrink-0", activeThread ? "hidden md:flex" : "flex")}>
        
        {/* Search */}
        <div className="p-4 flex flex-col gap-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              aria-label="Search conversations" placeholder="Search messages…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 md:h-9 bg-white rounded-xl text-base md:text-sm shadow-none transition-colors hover:border-slate-300 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 focus-visible:ring-offset-0"
            />
            {searchQuery && (
              <button type="button" aria-label="Clear message search" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        
        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No conversations found.
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredThreads.map((thread) => {
                const lastMessage = thread.messages[thread.messages.length - 1];
                const isActive = thread.id === activeThreadId;
                const businessName = thread.business.name || "Business";
                const initials = businessName.substring(0, 2).toUpperCase();
                const unreadCount = getUnreadCount(thread);
                
                return (
                  <button
                    key={thread.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={cn(
                      "relative flex items-start gap-3 p-4 text-left transition-colors border-l-[3px]",
                      isActive 
                        ? "bg-[#F7FAF8] border-l-[#0B4928]" 
                        : "bg-white border-l-transparent hover:bg-slate-50 border-b border-b-slate-50"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 shrink-0 rounded-full flex items-center justify-center font-medium text-sm overflow-hidden",
                      isActive ? "bg-[#E4F2E8] text-[#0B4928]" : "bg-slate-100 text-slate-600"
                    )}>
                      {thread.business.logoUrl ? (
                        <Image src={thread.business.logoUrl} alt={businessName} width={48} height={48} className="object-cover h-full w-full" />
                      ) : (
                        initials
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <p className={cn("font-medium truncate text-xs", isActive ? "text-slate-900" : "text-slate-900")}>
                          {businessName}
                        </p>
                        <span className="text-xs font-medium text-slate-500 shrink-0">
                          {format(new Date(thread.updatedAt), "MMM d")}
                        </span>
                      </div>
                      
                      <p className="text-xs truncate text-slate-500 font-medium mb-0.5">
                        {thread.booking?.listing.title || "Direct Inquiry"}
                      </p>

                      <p className={cn("text-xs truncate max-w-[200px]", unreadCount > 0 ? "font-semibold text-slate-900" : "text-slate-500")}>
                        {lastMessage ? lastMessage.content : <span className="italic">No messages yet</span>}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <div className="absolute right-4 bottom-4 h-5 w-5 bg-[#0B4928] rounded-full flex items-center justify-center text-xs font-medium text-white shadow-xs">
                        {unreadCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Chat Area */}
      <div className={cn("flex-1 flex flex-col bg-white", !activeThread ? "hidden md:flex" : "flex")}>
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <button 
                  aria-label="Back to conversations" className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900"
                  onClick={() => setActiveThreadId(null)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 font-semibold flex items-center justify-center shrink-0 overflow-hidden">
                  {activeThread.business.logoUrl ? (
                    <Image src={activeThread.business.logoUrl} alt={activeThread.business.name} width={40} height={40} className="object-cover h-full w-full" />
                  ) : (
                    activeThread.business.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <h2 className="font-semibold text-slate-900 leading-tight text-sm">{activeThread.business.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                      <Store className="h-3 w-3" /> Business Account
                    </span>
                  </div>
                </div>
              </div>
              
              {activeThread.booking && (
                <div className="flex items-center gap-3">
                  <Button asChild variant="outline" size="sm" className="h-8 text-xs font-medium border-border text-slate-700 rounded-xl">
                    <Link href={`/bookings/${activeThread.booking.id}`}>
                      <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                      View Booking ({activeThread.booking.bookingRef})
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#FAFBFA]"
            >
              <div className="flex flex-col min-h-full space-y-4">
<ConversationMessages messages={activeThread.messages} currentUserId={customerUserId} />
              </div>
            </div>

            <MessageComposer draft={draft} onDraftChange={setDraft} onSubmit={handleSend} pending={isSending} error={sendError} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <p className="text-slate-500 font-medium text-xs">Select a conversation to view messages</p>
          </div>
        )}
      </div>

    </div>
  );
}
