"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Search, Calendar, Send, CheckCheck, Smile, ImageIcon, Paperclip, Zap, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage } from "@/lib/actions/messages";
import { EmptyState } from "../ui/empty-state";
import { cn } from "@/lib/utils";
import Image from "next/image";

export type MessageType = {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  sender: { name: string | null; image: string | null };
};

export type ThreadType = {
  id: string;
  updatedAt: Date;
  business: { 
    id: string; 
    name: string; 
    logoUrl: string | null; 
  };
  booking: { 
    id: string; 
    bookingRef: string; 
    startDate: Date | null;
    status: string;
    listing: { title: string; coverImageUrl: string | null };
  } | null;
  messages: MessageType[];
};

export function CustomerMessageInbox({ initialThreads, customerUserId }: { initialThreads: ThreadType[], customerUserId: string }) {
  const [threads, setThreads] = useState<ThreadType[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreads[0]?.id || null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const activeThread = threads.find(t => t.id === activeThreadId);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeThreadId) return;

    setIsSending(true);
    const content = draft;
    setDraft("");

    try {
      const newMessage = await sendMessage(activeThreadId, content);
      
      // Optimistic update
      setThreads(prev => prev.map(thread => {
        if (thread.id === activeThreadId) {
          return {
            ...thread,
            updatedAt: new Date(),
            messages: [...thread.messages, {
              ...newMessage,
              sender: { name: "You", image: null }
            }]
          };
        }
        return thread;
      }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      
    } catch (error) {
      console.error(error);
      setDraft(content); // restore on error
    } finally {
      setIsSending(false);
    }
  };

  if (threads.length === 0) {
    return (
      <div className="h-[600px] border border-slate-200 rounded-2xl flex items-center justify-center bg-white shadow-sm">
        <EmptyState title="No messages yet" description="When you message a business about a booking, it will appear here." />
      </div>
    );
  }

  return (
    <div className="flex h-[750px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm font-sans">
      
      {/* Left Pane: Thread List */}
      <div className={cn("w-full md:w-[350px] flex flex-col border-r border-slate-200 bg-white shrink-0", activeThread ? "hidden md:flex" : "flex")}>
        
        {/* Search */}
        <div className="p-4 flex flex-col gap-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search messages..." 
              className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>
        </div>
        
        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {threads.map((thread) => {
              const lastMessage = thread.messages[thread.messages.length - 1];
              const isActive = thread.id === activeThreadId;
              const businessName = thread.business.name || "Business";
              const initials = businessName.substring(0, 2).toUpperCase();
              
              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={cn(
                    "relative flex items-start gap-3 p-4 text-left transition-colors border-l-[3px]",
                    isActive 
                      ? "bg-[#F7FAF8] border-l-[#0B4928]" 
                      : "bg-white border-l-transparent hover:bg-slate-50 border-b border-b-slate-50"
                  )}
                >
                  <div className={cn(
                    "h-12 w-12 shrink-0 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden",
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
                      <p className={cn("font-bold truncate", isActive ? "text-slate-900" : "text-slate-900")}>
                        {businessName}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {format(new Date(thread.updatedAt), "MMM d")}
                      </span>
                    </div>
                    
                    <p className="text-xs truncate text-slate-500 font-semibold mb-1">
                      {thread.booking?.listing.title || "Inquiry"}
                    </p>

                    <p className={cn("text-xs truncate max-w-[200px]", isActive ? "text-slate-600" : "text-slate-500")}>
                      {lastMessage ? lastMessage.content : <span className="italic">No messages yet</span>}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Pane: Chat Area */}
      <div className={cn("flex-1 flex flex-col bg-white", !activeThread ? "hidden md:flex" : "flex")}>
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <button 
                  className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900"
                  onClick={() => setActiveThreadId(null)}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0 overflow-hidden">
                  {activeThread.business.logoUrl ? (
                    <Image src={activeThread.business.logoUrl} alt={activeThread.business.name} width={40} height={40} className="object-cover h-full w-full" />
                  ) : (
                    activeThread.business.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex flex-col">
                  <h2 className="font-bold text-slate-900 leading-tight">{activeThread.business.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                      <Store className="h-3 w-3" /> Business Account
                    </span>
                  </div>
                </div>
              </div>
              
              {activeThread.booking && (
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex flex-col items-end text-right">
                    <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{activeThread.booking.listing.title}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">{activeThread.booking.bookingRef}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#FAFBFA]"
            >
              <div className="flex flex-col min-h-full space-y-4">
                {activeThread.messages.map((message, i) => {
                  const isCustomer = message.senderId === customerUserId;
                  
                  return (
                    <div key={message.id} className={cn("flex flex-col max-w-[85%] md:max-w-[70%]", isCustomer ? "ml-auto items-end" : "items-start")}>
                      <div 
                        className={cn(
                          "px-4 py-3 rounded-2xl text-sm leading-relaxed border shadow-sm",
                          isCustomer 
                            ? "bg-[#0B4928] text-white border-transparent rounded-tr-sm" 
                            : "bg-white text-slate-800 border-slate-200 rounded-tl-sm"
                        )}
                      >
                        {message.content}
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {format(new Date(message.createdAt), "h:mm a")}
                        </span>
                        {isCustomer && (
                          <CheckCheck className="h-3 w-3 text-[#0B4928] opacity-70" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Composer */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSend} className="relative border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#0B4928] focus-within:ring-1 focus-within:ring-[#0B4928]/20 transition-all">
                <Textarea 
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type your message..." 
                  className="w-full min-h-[90px] p-4 pb-12 border-none focus-visible:ring-0 text-sm resize-none bg-white"
                  disabled={isSending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-3">
                  <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors"><Smile className="h-4 w-4" /></button>
                  <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors"><Paperclip className="h-4 w-4" /></button>
                </div>
                <div className="absolute bottom-3 right-3">
                  <Button 
                    type="submit" 
                    disabled={!draft.trim() || isSending} 
                    className="h-8 px-4 bg-[#0B4928] hover:bg-[#0B4928]/90 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    <Send className="h-3 w-3 mr-1.5" /> Send
                  </Button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <p className="text-slate-500 font-medium text-sm">Select a conversation to view messages</p>
          </div>
        )}
      </div>

    </div>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        props.className
      )}
    />
  )
}

function ChevronLeftIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}
