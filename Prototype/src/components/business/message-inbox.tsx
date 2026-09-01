"use client";

import { useState, useRef, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { 
  Search, Filter, Calendar, ExternalLink, User, Mail, Phone, 
  Smile, Image as ImageIcon, Paperclip, Zap, Send, MoreVertical, 
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
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    initialActiveThreadId || initialThreads[0]?.id || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState<"all" | "unread" | "bookings">("all");
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  
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

  // Mark thread messages as read when active thread changes or opens
  useEffect(() => {
    if (activeThreadId) {
      markThreadAsRead(activeThreadId).catch(console.error);
      
      // Clear unread state locally
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            messages: t.messages.map(m => ({
              ...m,
              readAt: m.senderId !== businessUserId ? (m.readAt || new Date()) : m.readAt
            }))
          };
        }
        return t;
      }));
    }
  }, [activeThreadId, businessUserId]);

  // Real-time message polling (every 4 seconds)
  useEffect(() => {
    if (!activeThreadId) return;

    const interval = setInterval(async () => {
      try {
        const fetchedMessages = await getThreadMessages(activeThreadId);
        setThreads(prev => prev.map(t => {
          if (t.id === activeThreadId) {
            // Check if message count or last message ID changed
            if (t.messages.length !== fetchedMessages.length) {
              return {
                ...t,
                updatedAt: new Date(),
                messages: fetchedMessages as any
              };
            }
          }
          return t;
        }));
      } catch (err) {
        // Silently ignore polling errors
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeThreadId]);

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
      }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
      
    } catch (error) {
      console.error(error);
      setDraft(content);
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
  const customerTotalSpent = activeThread?.customer.bookings.reduce((sum, b) => sum + b.totalMinor, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header bar with New Message CTA */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B4928] mb-1">BUSINESS PORTAL</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Messages</h1>
          <p className="text-sm text-slate-500">Communicate directly with your customers regarding their bookings and inquiries.</p>
        </div>
        
        <Dialog open={newMsgOpen} onOpenChange={setNewMsgOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1e613c] hover:bg-[#164a2e] text-white gap-2 font-bold h-10 px-5 rounded-xl shadow-sm">
              <SquarePen className="h-4 w-4" />
              New message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <SquarePen className="h-5 w-5 text-[#0B4928]" />
                Start a New Conversation
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Select a customer from your recent bookings and send them a direct message.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateNewMessage} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Select Customer</label>
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
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4928]"
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
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Message</label>
                <textarea
                  value={newMsgContent}
                  onChange={(e) => setNewMsgContent(e.target.value)}
                  placeholder="Hello! We are looking forward to hosting you..."
                  rows={4}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0B4928] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setNewMsgOpen(false)}
                  className="text-xs font-bold text-slate-500 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedCustomerId || !newMsgContent.trim() || isCreatingThread}
                  className="bg-[#0B4928] hover:bg-[#0B4928]/90 text-white font-bold text-xs rounded-xl h-10 px-5 gap-2"
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
        <div className="h-[600px] border border-slate-200 rounded-2xl flex items-center justify-center bg-white shadow-sm">
          <EmptyState title="No messages yet" description="When customers message you about bookings, they will appear here." />
        </div>
      ) : (
        <div className="flex h-[780px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm font-sans">
          
          {/* Left Pane: Thread List */}
          <div className="w-full lg:w-[350px] flex flex-col border-r border-slate-200 bg-white shrink-0">
            
            {/* Search & Filters */}
            <div className="p-4 flex flex-col gap-4 border-b border-slate-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search messages..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl text-xs"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveFilterTab("all")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                    activeFilterTab === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  All <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", activeFilterTab === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700")}>{threads.length}</span>
                </button>

                <button 
                  onClick={() => setActiveFilterTab("unread")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                    activeFilterTab === "unread" ? "bg-[#0B4928] text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Unread <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", activeFilterTab === "unread" ? "bg-white/20 text-white" : "bg-[#E4F2E8] text-[#0B4928]")}>{totalUnreadCount}</span>
                </button>

                <button 
                  onClick={() => setActiveFilterTab("bookings")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors",
                    activeFilterTab === "bookings" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  Bookings
                </button>
              </div>
            </div>
            
            {/* Thread List */}
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
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
                          isActive ? "bg-[#E4F2E8] text-[#0B4928]" : "bg-emerald-100 text-emerald-800"
                        )}>
                          {initials}
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col pt-0.5">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <p className={cn("font-bold truncate text-xs", isActive ? "text-slate-900" : "text-slate-800")}>
                              {customerName}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                              {format(new Date(thread.updatedAt), "h:mm a")}
                            </span>
                          </div>
                          
                          <p className="text-[11px] truncate text-slate-500 font-semibold mb-0.5">
                            {thread.booking?.listing.title || "Direct Inquiry"}
                          </p>

                          <p className={cn("text-xs truncate max-w-[200px]", unreadCount > 0 ? "font-bold text-slate-900" : "text-slate-500")}>
                            {lastMessage ? lastMessage.content : <span className="italic">No messages yet</span>}
                          </p>
                        </div>
                        
                        {unreadCount > 0 && (
                          <div className="absolute right-4 bottom-4 h-5 w-5 bg-[#0B4928] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
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
              <p className="text-[11px] font-semibold text-slate-400 text-center">
                Showing {filteredThreads.length} of {threads.length} conversations
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
                      {activeThread.customer.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || "CU"}
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-bold text-slate-900 leading-tight text-sm">{activeThread.customer.name || "Customer"}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 text-[#0B4928] text-[11px] font-bold">
                          Verified customer <CheckCircle2 className="h-3 w-3 fill-[#0B4928] text-white" />
                        </div>
                        {activeThread.booking && (
                          <>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <span className="text-slate-500 text-[11px] font-semibold">{activeThread.booking.bookingRef}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {activeThread.booking && (
                    <div className="flex items-center gap-3">
                      <Button asChild variant="outline" size="sm" className="h-8 text-xs font-bold border-slate-200 text-slate-700 rounded-xl">
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
                    {activeThread.messages.map((message, i) => {
                      const isBusiness = message.senderId === businessUserId;
                      const msgDate = new Date(message.createdAt);
                      const prevMsg = activeThread.messages[i - 1];
                      const showDateHeader = !prevMsg || !isSameDay(new Date(prevMsg.createdAt), msgDate);

                      return (
                        <div key={message.id} className="space-y-4">
                          {showDateHeader && (
                            <div className="flex justify-center my-3">
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50">
                                {format(msgDate, "dd MMM yyyy")}
                              </span>
                            </div>
                          )}
                          <div className={cn("flex flex-col max-w-[75%]", isBusiness ? "ml-auto items-end" : "items-start")}>
                            <div 
                              className={cn(
                                "px-4 py-3 rounded-2xl text-xs leading-relaxed border shadow-xs font-medium",
                                isBusiness 
                                  ? "bg-[#EBF5EE] text-[#0B4928] border-emerald-200/40 rounded-tr-xs" 
                                  : "bg-white text-slate-800 border-slate-200 rounded-tl-xs"
                              )}
                            >
                              {message.content}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 px-1">
                              <span className="text-[10px] font-semibold text-slate-400">
                                {format(msgDate, "h:mm a")}
                              </span>
                              {isBusiness && (
                                <CheckCheck className={cn("h-3 w-3", message.readAt ? "text-[#0B4928]" : "text-slate-400")} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Composer */}
                <div className="p-4 bg-white border-t border-slate-100">
                  <form onSubmit={handleSend} className="relative border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#0B4928] focus-within:ring-1 focus-within:ring-[#0B4928]/20 transition-all">
                    <textarea 
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Type your reply to the customer..." 
                      className="w-full min-h-[85px] p-4 pb-12 border-none focus:outline-none text-xs resize-none bg-white font-medium"
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
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <Button 
                        type="submit" 
                        disabled={!draft.trim() || isSending} 
                        className="h-8 px-4 bg-[#0B4928] hover:bg-[#0B4928]/90 text-white text-xs font-bold rounded-lg shadow-xs gap-1.5"
                      >
                        {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        Send
                      </Button>
                    </div>
                  </form>
                </div>
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
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Customer Details</h3>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-12 w-12 rounded-full bg-[#E4F2E8] text-[#0B4928] text-base font-bold flex items-center justify-center">
                      {activeThread.customer.name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || "CU"}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-bold text-sm text-slate-900">{activeThread.customer.name || "Guest Customer"}</h4>
                      <div className="flex items-center gap-1 text-[#0B4928] text-[11px] font-bold mt-0.5">
                        Verified customer <CheckCircle2 className="h-3 w-3 fill-[#0B4928] text-white" />
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
                  
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Bookings</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">{customerBookingsCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total Spent</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">{formatUGX(customerTotalSpent)}</p>
                    </div>
                  </div>
                </div>
                
                <hr className="border-slate-100" />
                
                {/* Booking Details */}
                {activeThread.booking && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Booking Details</h3>
                    
                    <div className="flex gap-3 mb-4">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 shrink-0 overflow-hidden shadow-xs border border-slate-200">
                        {activeThread.booking.listing.coverImageUrl ? (
                          <img src={activeThread.booking.listing.coverImageUrl} alt={activeThread.booking.listing.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{activeThread.booking.listing.title}</h4>
                        <p className="text-[11px] font-semibold text-[#0B4928] mt-0.5">{activeThread.booking.bookingRef}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{activeThread.booking.startDate ? format(new Date(activeThread.booking.startDate), "dd MMM yyyy") : "Date pending"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{activeThread.booking.startDate ? format(new Date(activeThread.booking.startDate), "h:mm a") : "Time pending"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                        <User className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{activeThread.booking.participantsCount > 1 ? `${activeThread.booking.participantsCount} guests` : `1 guest`}</span>
                      </div>
                    </div>
                    
                    <Button asChild variant="outline" className="w-full text-xs font-bold text-slate-700 border-slate-200 rounded-xl">
                      <Link href={`/business/bookings/${activeThread.booking.id}`}>
                        View booking details
                      </Link>
                    </Button>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <p className="text-xs text-slate-400 font-medium">Select a conversation to view customer context.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
