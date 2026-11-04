"use client";

import { StatCard } from "@/components/ui/stat-card";
import { useConversationSync } from "@/components/messages/use-conversation-sync";
import { ConversationMessages, MessageComposer } from "@/components/messages/conversation";

import { RemoteImage } from "@/components/remote-image";
import { useState, useRef, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import {
  Search, Filter, Calendar, ExternalLink, User, Mail, Phone,
  Zap, Send, MoreVertical, ChevronLeft,
  Plus, CheckCircle2, CheckCheck, SquarePen, Clock, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessage, markThreadAsRead, getThreadMessages, createThreadWithCustomer } from "@/lib/actions/messages";
import { formatUGX } from "@/lib/booking";
import Link from "next/link";
import { EmptyState } from "../ui/empty-state";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    startDate: Date | string | null;
    participantsCount: number;
    status: string;
    listing: { title: string; coverImageUrl: string | null };
  } | null;
  messages: MessageType[];
};

export type BusinessCustomerType = {
  customer: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    image: string | null;
  };
  booking: {
    id: string;
    bookingRef: string;
    listing: { title: string };
  };
};

export function MessageInbox({ 
  initialThreads, 
  businessUserId,
  businessId,
  initialActiveThreadId,
  businessCustomers = []
}: { 
  initialThreads: ThreadType[];
  businessUserId: string;
  businessId?: string;
  initialActiveThreadId?: string;
  businessCustomers?: BusinessCustomerType[];
}) {
  const [threads, setThreads] = useState<ThreadType[]>(initialThreads);
  useEffect(() => {
    setThreads(initialThreads);
    setActiveThreadId(current => current && initialThreads.some(thread => thread.id === current) ? current : null);
  }, [initialThreads]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialActiveThreadId || initialThreads[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "unread" | "bookings">("all");
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  
  // New Message Modal State
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [newMsgContent, setNewMsgContent] = useState("");
  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeThread = threads.find(t => t.id === activeThreadId);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread?.messages]);

  useConversationSync(activeThreadId, isSending, businessUserId, setThreads);

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

  const handleCreateNewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !newMsgContent.trim() || !businessId || isCreatingThread) return;

    setIsCreatingThread(true);
    try {
      const newThread = await createThreadWithCustomer(businessId, selectedCustomerId, selectedBookingId || undefined);
      await sendMessage(newThread.id, newMsgContent.trim());
      
      setNewMsgOpen(false);
      setNewMsgContent("");
      setSelectedCustomerId("");
      setSelectedBookingId("");
      
      // Trigger full refresh or select new thread
      setActiveThreadId(newThread.id);
      window.location.href = `/business/messages?threadId=${newThread.id}`;
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingThread(false);
    }
  };

  // Helper to compute unread count for a thread
  const getUnreadCount = (thread: ThreadType) => {
    return thread.messages.filter(m => m.senderId !== businessUserId && !m.readAt).length;
  };

  // Filter threads by search and tabs
  const filteredThreads = threads.filter(thread => {
    const customerName = thread.customer.name || "";
    const customerEmail = thread.customer.email || "";
    const bookingRef = thread.booking?.bookingRef || "";
    const listingTitle = thread.booking?.listing.title || "";
    const lastMsg = thread.messages[thread.messages.length - 1]?.content || "";

    const matchesSearch = 
      !searchQuery.trim() ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookingRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lastMsg.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilterTab === "unread") {
      return getUnreadCount(thread) > 0;
    }
    if (activeFilterTab === "bookings") {
      return !!thread.booking;
    }
    return true;
  });

  const totalUnreadCount = threads.reduce((sum, t) => sum + getUnreadCount(t), 0);
  const customerBookingsCount = activeThread?.customer.bookings.length || 0;
  const customerTotalSpent = activeThread?.customer.bookings.filter(booking => ["CONFIRMED", "COMPLETED", "REVIEW_PENDING", "REVIEWED"].includes(booking.status)).reduce((sum, b) => sum + b.totalMinor, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header bar with New Message CTA */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#0B4928] mb-1">BUSINESS PORTAL</p>
          <h1 className="type-page text-slate-900 mb-1">Messages</h1>
          <p className="text-sm text-slate-500 leading-relaxed">Communicate directly with your customers regarding their bookings and inquiries.</p>
        </div>
        
        <Dialog open={newMsgOpen} onOpenChange={setNewMsgOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e613c] hover:bg-[#164a2e] text-white gap-2 font-medium h-10 px-5 rounded-xl shadow-sm">
              <SquarePen className="h-4 w-4" />
              New message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <SquarePen className="h-5 w-5 text-[#0B4928]" />
                Start a New Conversation
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Select a customer from your recent bookings and send them a direct message.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateNewMessage} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-medium text-slate-700 mb-1.5 block">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const selected = businessCustomers.find(c => c.customer.id === e.target.value);
                    if (selected?.booking?.id) {
                      setSelectedBookingId(selected.booking.id);
                    }
                  }}
                  required
                  className="form-control w-full font-medium"
                >
                  <option value="">-- Choose customer --</option>
                  {businessCustomers.map(({ customer, booking }) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name || customer.email} ({booking.listing.title} - Ref: {booking.bookingRef})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 mb-1.5 block">Message</label>
                <textarea
                  value={newMsgContent}
                  onChange={(e) => setNewMsgContent(e.target.value)}
                  placeholder="Hello! We are looking forward to hosting you..."
                  rows={4}
                  required
                  className="form-textarea w-full font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setNewMsgOpen(false)}
                  className="text-xs font-medium text-slate-500 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedCustomerId || !newMsgContent.trim() || isCreatingThread}
                  className="bg-[#0B4928] hover:bg-[#0B4928]/90 text-white font-medium text-xs rounded-xl h-10 px-5 gap-2"
                >
                  {isCreatingThread ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Message
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Inbox Container */}
      {threads.length === 0 ? (
        <div className="h-[min(60svh,520px)] min-h-[320px] border border-border rounded-2xl flex items-center justify-center bg-white shadow-sm">
          <EmptyState title="No messages yet" description="When customers message you about bookings, they will appear here." />
        </div>
      ) : (
        <div className="flex h-[min(75svh,680px)] min-h-[440px] overflow-hidden rounded-2xl border border-border bg-white shadow-sm font-sans">
          
          {/* Left Pane: Thread List */}
          <div className={cn("w-full md:w-[300px] lg:w-[350px] min-w-0 flex-col border-r border-border bg-white shrink-0", activeThread ? "hidden md:flex" : "flex")}>
            
            {/* Search & Filters */}
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
              
              <div className="flex flex-wrap items-center gap-1.5">
                <button 
                  type="button" aria-pressed={activeFilterTab === "all"} onClick={() => setActiveFilterTab("all")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all",
                    activeFilterTab === "all"
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-border bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  All <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums leading-none", activeFilterTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")}>{threads.length}</span>
                </button>

                <button 
                  type="button" aria-pressed={activeFilterTab === "unread"} onClick={() => setActiveFilterTab("unread")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all",
                    activeFilterTab === "unread"
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-border bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  Unread <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums leading-none", activeFilterTab === "unread" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")}>{totalUnreadCount}</span>
                </button>

                <button 
                  type="button" aria-pressed={activeFilterTab === "bookings"} onClick={() => setActiveFilterTab("bookings")}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all",
                    activeFilterTab === "bookings"
                      ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                      : "border-border bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  Bookings
                </button>
              </div>
            </div>
            
            {/* Thread List */}
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-medium">
                  No conversations match your filter.
                </div>
              ) : (
                <div className="flex flex-col">
                  {filteredThreads.map((thread) => {
                    const lastMessage = thread.messages[thread.messages.length - 1];
                    const isActive = thread.id === activeThreadId;
                    const customerName = thread.customer.name || "Customer";
                    const initials = customerName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
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
                          "h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-medium text-sm",
                          isActive ? "bg-[#E4F2E8] text-[#0B4928]" : "bg-emerald-100 text-emerald-800"
                        )}>
                          {initials}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <p className={cn("font-medium truncate text-xs", isActive ? "text-slate-900" : "text-slate-800")}>
                              {customerName}
                            </p>
                            <span className="text-xs font-medium text-slate-500 shrink-0">
                              {format(new Date(thread.updatedAt), "h:mm a")}
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
            
            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <p className="text-xs font-medium text-slate-500 text-center">
                Showing {filteredThreads.length} of {threads.length} conversations
              </p>
            </div>
          </div>

          {/* Middle Pane: Chat Area */}
          <div className={cn("min-w-0 flex-1 flex-col bg-white border-r border-border", activeThread ? "flex" : "hidden md:flex")}>
            {activeThread ? (
              <>
                {/* Chat Header */}
                <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-3">
                    <button type="button" aria-label="Back to conversations" className="p-2 -ml-2 md:hidden" onClick={() => setActiveThreadId(null)}><ChevronLeft className="h-5 w-5" /></button><div className="h-10 w-10 rounded-full bg-[#E4F2E8] text-[#0B4928] font-semibold flex items-center justify-center shrink-0">
                      {activeThread.customer.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || "CU"}
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-semibold text-slate-900 leading-tight text-sm">{activeThread.customer.name || "Customer"}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 text-[#0B4928] text-xs font-medium">
                          Customer account
                        </div>
                        {activeThread.booking && (
                          <>
                            <span className="text-slate-300 text-xs">•</span>
                            <span className="text-slate-500 text-xs font-medium">{activeThread.booking.bookingRef}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {activeThread.booking && (
                    <div className="flex items-center gap-3">
                      <Button asChild variant="outline" size="sm" className="h-8 text-xs font-medium border-border text-slate-700 rounded-xl">
                        <Link href={`/business/bookings/${activeThread.booking.id}`}>
                          <Calendar className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                          View booking
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Messages Area */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 bg-[#FAFBFA]"
                >
                  <div className="flex flex-col min-h-full space-y-4">
  <ConversationMessages messages={activeThread.messages.map(message => ({...message, senderName: message.sender.name}))} currentUserId={businessUserId} outgoingSenderIds={activeThread.messages.filter(message => message.senderId !== activeThread.customer.id).map(message => message.senderId)} />
                  </div>
                </div>

                <MessageComposer draft={draft} onDraftChange={setDraft} onSubmit={handleSend} pending={isSending} error={sendError} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 font-medium text-xs">Select a conversation to start messaging</p>
              </div>
            )}
          </div>

          {/* Right Pane: Customer & Booking Context */}
          <div className="hidden xl:flex w-[320px] flex-col bg-[#FCFDFD] shrink-0 overflow-y-auto border-l border-slate-100">
            {activeThread ? (
              <div className="p-6 space-y-6">
                
                {/* Customer Details */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">Customer Details</h3>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-12 w-12 rounded-full bg-[#E4F2E8] text-[#0B4928] text-base font-semibold flex items-center justify-center">
                      {activeThread.customer.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || "CU"}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-semibold text-sm text-slate-900">{activeThread.customer.name || "Guest Customer"}</h4>
                      <div className="flex items-center gap-1 text-[#0B4928] text-xs font-medium mt-0.5">
                        Customer account
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{activeThread.customer.email || "No email provided"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{activeThread.customer.phone || "No phone provided"}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4 grid gap-3">
                    <StatCard compact label="Bookings with this business" value={customerBookingsCount} description="All recorded booking states" />
                    <StatCard compact label="Confirmed booking value" value={formatUGX(customerTotalSpent)} description="Confirmed and completed bookings" />
                  </div>
                </div>
                
                <hr className="border-slate-100" />
                
                {/* Booking Details */}
                {activeThread.booking && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-4">Booking Details</h3>
                    
                    <div className="flex gap-3 mb-4">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden shadow-xs border border-border">
                        {activeThread.booking.listing.coverImageUrl ? (
                          <RemoteImage src={activeThread.booking.listing.coverImageUrl} alt={activeThread.booking.listing.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">{activeThread.booking.listing.title}</h4>
                        <p className="text-xs font-medium text-[#0B4928] mt-0.5">{activeThread.booking.bookingRef}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{activeThread.booking.startDate ? format(new Date(activeThread.booking.startDate), "dd MMM yyyy") : "Date pending"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{activeThread.booking.startDate ? format(new Date(activeThread.booking.startDate), "h:mm a") : "Time pending"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-slate-700">
                        <User className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{activeThread.booking.participantsCount > 1 ? `${activeThread.booking.participantsCount} guests` : `1 guest`}</span>
                      </div>
                    </div>
                    
                    <Button asChild variant="outline" className="w-full text-xs font-medium text-slate-700 border-border rounded-xl">
                      <Link href={`/business/bookings/${activeThread.booking.id}`}>
                        View booking details
                      </Link>
                    </Button>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <p className="text-xs text-slate-500 font-medium">Select a conversation to view customer context.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
