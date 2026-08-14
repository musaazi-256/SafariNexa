"use client";

import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Search, Filter, Calendar, ExternalLink, User, Mail, Phone, Smile, Image as ImageIcon, Paperclip, Zap, Send, MoreVertical, Plus, CheckCircle2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage } from "@/lib/actions/messages";
import { formatUGX } from "@/lib/booking";
import Link from "next/link";
import { EmptyState } from "../ui/empty-state";
import { cn } from "@/lib/utils";

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
  customer: { 
    id: string; 
    name: string | null; 
    image: string | null; 
    email: string | null;
    phone: string | null;
    bookings: { totalMinor: number; status: string }[];
  };
  booking: { 
    id: string; 
    bookingRef: string; 
    startDate: Date | null;
    participantsCount: number;
    status: string;
    listing: { title: string; coverImageUrl: string | null };
  } | null;
  messages: MessageType[];
};

export function MessageInbox({ initialThreads, businessUserId }: { initialThreads: ThreadType[], businessUserId: string }) {
  const [threads, setThreads] = useState<ThreadType[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreads[0]?.id || null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const activeTab = "All"; // Dummy state for tabs

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
      <div className="h-[600px] border border-slate-200 rounded-2xl flex items-center justify-center bg-white">
        <EmptyState title="No messages yet" description="When customers message you about bookings, they will appear here." />
      </div>
    );
  }

  // Calculate stats
  const customerBookingsCount = activeThread?.customer.bookings.length || 0;
  const customerTotalSpent = activeThread?.customer.bookings.reduce((sum, b) => sum + b.totalMinor, 0) || 0;

  return (
    <div className="flex h-[800px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm font-sans">
      
      {/* Left Pane: Thread List */}
      <div className="w-full lg:w-[350px] flex flex-col border-r border-slate-200 bg-white shrink-0">
        
        {/* Search & Filters */}
        <div className="p-4 flex flex-col gap-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search messages..." 
                className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl"
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl border-slate-200 text-slate-500">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-sm font-bold text-slate-900 transition-colors">
              All <span className="bg-[#0B4928] text-white text-[10px] px-1.5 py-0.5 rounded-full">{threads.length}</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
              Unread <span className="bg-[#E4F2E8] text-[#0B4928] text-[10px] px-1.5 py-0.5 rounded-full">0</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">
              Bookings
            </button>
          </div>
        </div>
        
        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col">
            {threads.map((thread, idx) => {
              const lastMessage = thread.messages[thread.messages.length - 1];
              const isActive = thread.id === activeThreadId;
              const customerName = thread.customer.name || "Customer";
              const initials = customerName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
              
              // Determine if it should show an unread dot (mock logic based on idx)
              const isUnread = idx === 1; // Just a mock for visual
              
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
                    "h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-bold text-sm",
                    isActive ? "bg-[#E4F2E8] text-[#0B4928]" : "bg-blue-100 text-blue-600"
                  )}>
                    {initials}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <p className={cn("font-bold truncate", isActive ? "text-slate-900" : "text-slate-900")}>
                        {customerName}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                        {format(new Date(thread.updatedAt), "h:mm a")}
                      </span>
                    </div>
                    
                    <p className={cn("text-xs truncate max-w-[200px]", isActive ? "text-slate-600" : "text-slate-500")}>
                      {lastMessage ? lastMessage.content : <span className="italic">No messages yet</span>}
                    </p>
                  </div>
                  
                  {isUnread && (
                    <div className="absolute right-4 bottom-4 h-5 w-5 bg-[#0B4928] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      1
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <p className="text-[11px] font-semibold text-slate-400 text-center">
            Showing 1 to {threads.length} of {threads.length} conversations
          </p>
        </div>
      </div>

      {/* Middle Pane: Chat Area */}
      <div className="hidden sm:flex flex-1 flex-col bg-white border-r border-slate-200">
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#E4F2E8] text-[#0B4928] font-bold flex items-center justify-center shrink-0">
                  {activeThread.customer.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <h2 className="font-bold text-slate-900 leading-tight">{activeThread.customer.name || "Customer"}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1 text-[#0B4928] text-[11px] font-bold">
                      Verified customer <CheckCircle2 className="h-3 w-3 fill-[#0B4928] text-white" />
                    </div>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <span className="text-slate-400 text-[11px] font-medium">{activeThread.booking?.bookingRef}</span>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <span className="text-slate-400 text-[11px] font-medium">{format(new Date(), "dd MMM yyyy")}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-slate-200 text-slate-700">
                  <Calendar className="mr-2 h-3.5 w-3.5 text-slate-400" />
                  View booking
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 bg-[#FAFBFA]" // Slight green-grey tint
            >
              <div className="flex flex-col min-h-full space-y-4">
                {/* Date separator */}
                <div className="flex justify-center mb-4">
                  <span className="text-[10px] font-bold text-slate-400">31 Jul 2026</span>
                </div>
                
                {activeThread.messages.map((message, i) => {
                  const isBusiness = message.senderId === businessUserId;
                  
                  return (
                    <div key={message.id} className={cn("flex flex-col max-w-[70%]", isBusiness ? "ml-auto items-end" : "items-start")}>
                      <div 
                        className={cn(
                          "px-4 py-3 rounded-2xl text-sm leading-relaxed border shadow-sm",
                          isBusiness 
                            ? "bg-[#EBF5EE] text-[#0B4928] border-transparent rounded-tr-sm" 
                            : "bg-white text-slate-800 border-slate-200 rounded-tl-sm"
                        )}
                      >
                        {message.content}
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {format(new Date(message.createdAt), "h:mm a")}
                        </span>
                        {isBusiness && (
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
                  <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors"><ImageIcon className="h-4 w-4" /></button>
                  <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors"><Paperclip className="h-4 w-4" /></button>
                  <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors"><Zap className="h-4 w-4" /></button>
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
            <p className="text-slate-500 font-medium">Select a conversation</p>
          </div>
        )}
      </div>

      {/* Right Pane: Context & Notes */}
      <div className="hidden xl:flex w-[320px] flex-col bg-[#FCFDFD] shrink-0 overflow-y-auto">
        {activeThread && activeThread.booking ? (
          <div className="p-6 space-y-6">
            
            {/* Customer Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4">Customer details</h3>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-12 w-12 rounded-full bg-[#E4F2E8] text-[#0B4928] text-lg font-bold flex items-center justify-center">
                  {activeThread.customer.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-slate-900">{activeThread.customer.name}</h4>
                  <div className="flex items-center gap-1 text-[#0B4928] text-[11px] font-bold mt-0.5">
                    Verified customer <CheckCircle2 className="h-3 w-3 fill-[#0B4928] text-white" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{activeThread.customer.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{activeThread.customer.phone || "No phone"}</span>
                </div>
              </div>
              
              <div className="space-y-3 mb-5">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 mb-0.5">Total bookings</p>
                  <p className="text-sm font-bold text-slate-900">{customerBookingsCount}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 mb-0.5">Total spent</p>
                  <p className="text-sm font-bold text-slate-900">{formatUGX(customerTotalSpent)}</p>
                </div>
              </div>
              
              <Button variant="outline" className="w-full text-xs font-bold text-slate-700 border-slate-200">
                View customer profile
              </Button>
            </div>
            
            <hr className="border-slate-100" />
            
            {/* Booking Details */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4">Booking details</h3>
              
              <div className="flex gap-3 mb-4">
                <div className="h-12 w-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden shadow-sm border border-slate-200">
                  {activeThread.booking.listing.coverImageUrl ? (
                    <img src={activeThread.booking.listing.coverImageUrl} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{activeThread.booking.listing.title}</h4>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{activeThread.booking.bookingRef}</p>
                </div>
              </div>
              
              <div className="mb-5 inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold tracking-wide">
                Awaiting confirmation
              </div>
              
              <div className="space-y-4 mb-5">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{activeThread.booking.startDate ? format(new Date(activeThread.booking.startDate), "dd MMM yyyy") : "TBD"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <ClockIcon className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>7:30 PM</span> {/* Mocked time based on screenshot */}
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{activeThread.booking.participantsCount > 1 ? `${activeThread.booking.participantsCount} guests` : `1 guest`}</span>
                </div>
              </div>
              
              <Button variant="outline" className="w-full text-xs font-bold text-slate-700 border-slate-200">
                View booking
              </Button>
            </div>
            
            <hr className="border-slate-100" />
            
            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Notes</h3>
                <button className="flex items-center gap-1 text-[11px] font-bold text-[#0B4928] hover:underline">
                  <Plus className="h-3 w-3" /> Add note
                </button>
              </div>
              
              <div className="p-6 border border-dashed border-slate-200 rounded-xl bg-white text-center">
                <p className="text-xs font-bold text-slate-900 mb-1">No notes yet</p>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Add notes about this customer to keep track of important details.
                </p>
              </div>
            </div>
            
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-sm text-slate-400 font-medium">Select a conversation to view context.</p>
          </div>
        )}
      </div>

    </div>
  );
}

// Simple clock icon replacement since I imported Clock earlier
function ClockIcon(props: any) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// Simple Textarea component instead of importing from ui
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
