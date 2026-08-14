import { UserPlus, Users, ShieldCheck, Clock, CalendarDays, Search, Filter, MoreVertical, Crown, User } from "lucide-react";
import type { BusinessUserRole } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

const ROLES: BusinessUserRole[] = ["OWNER", "MANAGER", "STAFF"];

type UnifiedMember = {
  id: string;
  name: string | null;
  email: string;
  role: BusinessUserRole;
  joinedAt: Date | null;
  status: "ACTIVE" | "PENDING";
  isCurrentUser: boolean;
};

export default async function BusinessTeamPage() {
  const { business, businessId, userId } = await requireBusinessSession();

  if (!business || !businessId) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 pb-20">
        <EmptyState title="No business linked to this account" description="Your account isn't attached to a verified business yet." />
      </div>
    );
  }

  const [members, invitations] = await Promise.all([
    db.businessUser.findMany({
      where: { businessId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" }
    }),
    db.businessInvitation.findMany({
      where: { businessId, status: "PENDING" },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const unifiedMembers: UnifiedMember[] = [
    ...members.map(m => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.createdAt,
      status: "ACTIVE" as const,
      isCurrentUser: m.user.id === userId
    })),
    ...invitations.map(i => ({
      id: i.id,
      name: i.email, // using email as placeholder for name
      email: i.email,
      role: i.role,
      joinedAt: null,
      status: "PENDING" as const,
      isCurrentUser: false
    }))
  ].sort((a, b) => {
    // Sort by joinedAt desc, with pending (null) at top
    if (a.joinedAt && b.joinedAt) return b.joinedAt.getTime() - a.joinedAt.getTime();
    if (!a.joinedAt && b.joinedAt) return -1;
    if (a.joinedAt && !b.joinedAt) return 1;
    return 0;
  });

  const totalMembers = unifiedMembers.length;
  const activeMembers = members.length;
  const pendingMembers = invitations.length;

  const totalOwners = unifiedMembers.filter(m => m.role === "OWNER").length;
  const totalStaff = totalMembers - totalOwners;
  
  const activeOwners = members.filter(m => m.role === "OWNER").length;
  const activeStaff = activeMembers - activeOwners;

  // Find oldest owner to act as creator
  const oldestOwner = members.filter(m => m.role === "OWNER").sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const createdDate = oldestOwner ? oldestOwner.createdAt : new Date();
  const creatorName = oldestOwner?.user.name || "System";

  async function inviteMember(formData: FormData) {
    "use server";
    const { businessId: activeBusinessId } = await requireBusinessSession();
    if (!activeBusinessId) return;

    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const role = String(formData.get("role")) as BusinessUserRole;
    if (!email) return;

    await db.businessInvitation.create({
      data: {
        businessId: activeBusinessId,
        email,
        role,
        token: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B4928] mb-1">BUSINESS PORTAL</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">Team</h1>
          <p className="text-sm text-slate-500">Invite staff and manage who has access to this business.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-[#1e613c] hover:bg-[#164a2e] text-white gap-2 font-bold h-10 px-5 rounded-lg shadow-sm">
              <UserPlus className="h-4 w-4" />
              Invite member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a team member</DialogTitle>
              <DialogDescription>They&apos;ll join automatically the next time they sign in with this email.</DialogDescription>
            </DialogHeader>
            <form action={inviteMember} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Role</Label>
                <div className="flex gap-1.5">
                  {ROLES.map((role) => (
                    <label
                      key={role}
                      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold capitalize transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary"
                    >
                      <input type="radio" name="role" value={role} defaultChecked={role === "STAFF"} className="sr-only" required />
                      {role.toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="mt-1 self-start">
                Send invite
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Members */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex gap-4">
          <div className="h-12 w-12 rounded-full bg-[#E4F2E8] flex items-center justify-center shrink-0">
            <Users className="h-6 w-6 text-[#1e613c]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-slate-900 leading-tight">{totalMembers}</span>
            <span className="text-sm font-semibold text-slate-500 mb-1">Total members</span>
            <span className="text-[11px] font-bold text-slate-400">{totalOwners} owner &bull; {totalStaff} staff</span>
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-slate-900 leading-tight">{activeMembers}</span>
            <span className="text-sm font-semibold text-slate-500 mb-1">Active members</span>
            <span className="text-[11px] font-bold text-slate-400">{activeOwners} owner &bull; {activeStaff} staff</span>
          </div>
        </div>

        {/* Pending Invites */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex gap-4">
          <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-slate-900 leading-tight">{pendingMembers}</span>
            <span className="text-sm font-semibold text-slate-500 mb-1">Pending invites</span>
            <span className="text-[11px] font-bold text-slate-400">Awaiting acceptance</span>
          </div>
        </div>

        {/* Team Created */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex gap-4">
          <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <CalendarDays className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-slate-900 leading-tight whitespace-nowrap">{createdDate.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="text-sm font-semibold text-slate-500 mb-1 mt-1">Team created</span>
            <span className="text-[11px] font-bold text-slate-400 truncate max-w-[120px]">By {creatorName}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2 border-b border-slate-200">
        <div className="flex items-center gap-6">
          <button className="relative pb-4 font-bold text-sm text-[#1e613c]">
            All members <span className="ml-1 bg-[#E4F2E8] text-[#1e613c] text-[10px] px-1.5 py-0.5 rounded-full">{totalMembers}</span>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e613c]" />
          </button>
          <button className="relative pb-4 font-bold text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Owners <span className="ml-1 bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{totalOwners}</span>
          </button>
          <button className="relative pb-4 font-bold text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Staff <span className="ml-1 bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{totalStaff}</span>
          </button>
          <button className="relative pb-4 font-bold text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Pending <span className="ml-1 bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{pendingMembers}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 pb-2 lg:pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search members..." 
              className="pl-9 pr-4 h-9 w-[220px] rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-[#1e613c] shadow-sm"
            />
          </div>
          <Button variant="outline" className="h-9 px-3 border-slate-200 text-slate-700 font-bold rounded-lg shadow-sm">
            <Filter className="mr-2 h-4 w-4 text-slate-400" />
            Filters
          </Button>
          <Button variant="outline" className="h-9 px-3 border-slate-200 text-slate-700 font-bold rounded-lg shadow-sm">
            Sort: Newest
          </Button>
        </div>
      </div>

      {/* Data Table */}
      {unifiedMembers.length === 0 ? (
        <EmptyState title="No team members yet" description="Invite staff to help manage this business." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-bold text-slate-600 h-12 text-xs w-[35%]">Member</TableHead>
                <TableHead className="font-bold text-slate-600 h-12 text-xs w-[25%]">Email</TableHead>
                <TableHead className="font-bold text-slate-600 h-12 text-xs w-[15%]">Role</TableHead>
                <TableHead className="font-bold text-slate-600 h-12 text-xs w-[15%]">Joined</TableHead>
                <TableHead className="font-bold text-slate-600 h-12 text-xs w-[5%]">Status</TableHead>
                <TableHead className="font-bold text-slate-600 h-12 text-xs w-[5%] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unifiedMembers.map((member) => {
                const isOwner = member.role === "OWNER";
                const isPending = member.status === "PENDING";
                
                // Construct member name/initials
                const displayName = member.name || "Customer";
                let initials = "??";
                if (isPending) {
                  const emailParts = member.email.split('@')[0].split(/[._-]/);
                  initials = emailParts.length > 1 
                    ? (emailParts[0][0] + emailParts[1][0]).toUpperCase()
                    : displayName.substring(0,2).toUpperCase();
                } else {
                  initials = displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
                }

                return (
                  <TableRow key={member.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                    
                    {/* Member Column */}
                    <TableCell>
                      <div className="flex items-center gap-4 py-1">
                        <div className={cn(
                          "h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold",
                          isPending ? "bg-orange-50 text-orange-600" : (isOwner ? "bg-[#E4F2E8] text-[#1e613c]" : "bg-blue-100 text-blue-700")
                        )}>
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 truncate max-w-[180px]">{displayName}</span>
                            {member.isCurrentUser && (
                              <span className="bg-[#E4F2E8] text-[#1e613c] text-[10px] font-bold px-1.5 py-0.5 rounded-sm">You</span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {isPending ? "Invite pending" : (isOwner ? "Owner" : "Staff member")}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email Column */}
                    <TableCell className="font-semibold text-sm text-slate-700">
                      {member.email}
                    </TableCell>

                    {/* Role Column */}
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <div className={cn(
                          "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold",
                          isOwner ? "border-green-200 text-[#1e613c] bg-green-50/50" : "border-blue-200 text-blue-600 bg-blue-50/50"
                        )}>
                          {isOwner ? "Owner" : "Staff"}
                          {isOwner ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 pl-0.5">
                          {isOwner ? "Full access" : "Limited access"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Joined Column */}
                    <TableCell className="font-semibold text-[13px] text-slate-700">
                      {member.joinedAt ? member.joinedAt.toLocaleDateString("en-UG", { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
                    </TableCell>

                    {/* Status Column */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isPending ? "bg-orange-500" : "bg-green-600"
                        )} />
                        <span className="text-[11px] font-bold text-slate-700">{isPending ? "Pending" : "Active"}</span>
                      </div>
                    </TableCell>

                    {/* Action Column */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPending && (
                          <Button variant="outline" size="sm" className="h-7 text-[11px] font-bold border-slate-200 text-slate-700">
                            Resend
                          </Button>
                        )}
                        <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 text-slate-400 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              Showing 1 to {unifiedMembers.length} of {unifiedMembers.length} members
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200 text-slate-400"><span className="text-xs font-bold">&lt;</span></Button>
              <Button variant="solid" size="icon" className="h-8 w-8 rounded-full bg-[#1e613c] hover:bg-[#164a2e] text-white"><span className="text-xs font-bold">1</span></Button>
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-200 text-slate-400"><span className="text-xs font-bold">&gt;</span></Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
