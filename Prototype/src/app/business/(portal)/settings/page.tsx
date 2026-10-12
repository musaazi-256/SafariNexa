import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Store, Trash2, Bell, CalendarDays, XCircle, BarChart2, Info, Save, Users, UserPlus, ShieldCheck, MoreVertical, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireBusinessSession } from "@/lib/business";
import { updateBusinessProfile } from "@/lib/actions/business-settings";
import { inviteTeamMember, cancelInvitation, removeTeamMember } from "@/lib/actions/team";
import { db } from "@/lib/db";

export default async function BusinessSettingsPage({ searchParams }: { searchParams?: { tab?: string } }) {
  const { business, businessId } = await requireBusinessSession();

  if (!business || !businessId) return null;

  const rawTab = searchParams?.tab?.toLowerCase();
  const defaultTab = rawTab === "team" || rawTab === "staff" ? "team" : rawTab === "notifications" ? "notifications" : "profile";

  const [teamMembers, invitations] = await Promise.all([
    db.businessUser.findMany({
      where: { businessId },
      include: { user: true },
      orderBy: { createdAt: "asc" }
    }),
    db.businessInvitation.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-4">
      <PageHero variant="portal" eyebrow="Business portal" title="Settings" description="Manage your business profile, staff access, and preferences." />

      <Tabs defaultValue={defaultTab} key={defaultTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Staff Access</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            
            <div className="flex items-start gap-4 mb-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-900">Business Information</h3>
                <p className="text-sm font-medium text-slate-500">Update your registered business details.</p>
              </div>
            </div>

            <form action={updateBusinessProfile}>
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[13px] font-bold text-slate-700">Business Name <span className="text-red-500">*</span></Label>
                  <Input id="name" name="name" defaultValue={business.name} className="h-11 rounded-lg border-slate-200 font-medium focus-visible:ring-primary shadow-sm" />
                </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-bold text-slate-700">Support Email <span className="text-red-500">*</span></Label>
                <Input id="email" name="email" type="email" defaultValue={business.contactEmail || "support@example.com"} className="h-11 rounded-lg border-slate-200 font-medium focus-visible:ring-primary shadow-sm" />
                <p className="text-[11px] font-semibold text-slate-400">This email will receive important updates and notifications.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[13px] font-bold text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 pr-2 border-r border-slate-200">
                    <span className="text-base mr-1">🇺🇬</span>
                    <span className="text-[13px] font-bold text-slate-600">+256</span>
                  </div>
                  <Input id="phone" name="phone" type="tel" defaultValue={business.contactPhone || "700 000000"} className="h-11 rounded-lg border-slate-200 font-medium pl-[88px] focus-visible:ring-primary shadow-sm" />
                </div>
                <p className="text-[11px] font-semibold text-slate-400">Include country code</p>
              </div>
              

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address" className="text-[13px] font-bold text-slate-700">Physical Address <span className="text-red-500">*</span></Label>
                <Input id="address" name="address" defaultValue={business.address ?? ""} placeholder="Street address" className="h-11 rounded-lg border-slate-200 font-medium focus-visible:ring-primary shadow-sm" />
                <p className="text-[11px] font-semibold text-slate-400">Your business address will be visible to customers on your listings.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-[13px] font-bold text-slate-700">City <span className="text-red-500">*</span></Label>
                <Input id="city" name="city" defaultValue={business.city ?? "Kampala"} className="h-11 rounded-lg border-slate-200 font-medium focus-visible:ring-primary shadow-sm" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-[13px] font-bold text-slate-700">Country</Label>
                <Input id="country" name="country" defaultValue={business.country} className="h-11 rounded-lg border-slate-200 font-medium focus-visible:ring-primary shadow-sm" />
              </div>

              <div className="space-y-2 sm:col-span-2 relative">
                <Label htmlFor="description" className="text-[13px] font-bold text-slate-700">About the Business <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  defaultValue={business.description ?? ""}
                  placeholder="We provide the best safari experiences in East Africa."
                  className="rounded-lg border-slate-200 font-medium resize-none focus-visible:ring-primary shadow-sm"
                />
                <p className="text-[11px] font-semibold text-slate-400 mt-1">This description appears on your business profile.</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900">Verification & Documents</h3>
                  <p className="text-sm font-medium text-slate-500">Manage your business registration and compliance documents.</p>
                </div>
              </div>
              
              <div className="rounded-xl border border-slate-200 p-5 flex items-center justify-between">
                <div>
                  <h4 className="text-[15px] font-bold text-slate-900">Verification Status</h4>
                  <p className="text-[13px] font-semibold text-slate-500 mt-1 uppercase">Status: {business.verificationStatus.replace("_", " ")}</p>
                </div>
                <Link href="/business/verification">
                  <Button variant="outline" className="font-bold border-slate-200">View Documents</Button>
                </Link>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-lg shadow-sm">
                  Save changes
                </Button>
              </div>
            </div>
            </form>
            
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            
            <div className="p-8 pb-4">
              <div className="flex items-start gap-4 mb-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900">Notification Preferences</h3>
                  <p className="text-sm font-medium text-slate-500">Choose how you want to be notified about bookings and messages.</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                
                {/* New Bookings */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <Label className="text-[15px] font-bold text-slate-900">New Bookings</Label>
                      <p className="text-[13px] font-semibold text-slate-500">Receive an email when a new booking is made.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col text-left">
                      <span className="text-[12px] font-bold text-slate-900">Email</span>
                      <span className="text-[12px] font-semibold text-slate-500">{business.contactEmail || "info@example.com"}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-11 rounded-full bg-primary relative cursor-pointer shadow-sm">
                        <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                      </div>
                      <span className="text-[13px] font-bold text-primary w-6">On</span>
                    </div>
                  </div>
                </div>

                {/* Cancellations */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <XCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <Label className="text-[15px] font-bold text-slate-900">Cancellations</Label>
                      <p className="text-[13px] font-semibold text-slate-500">Receive an SMS when a booking is cancelled.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col text-left">
                      <span className="text-[12px] font-bold text-slate-900">SMS</span>
                      <span className="text-[12px] font-semibold text-slate-500">+256 700 000000</span>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-11 rounded-full bg-primary relative cursor-pointer shadow-sm">
                        <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                      </div>
                      <span className="text-[13px] font-bold text-primary w-6">On</span>
                    </div>
                  </div>
                </div>

                {/* Payout Reports */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <BarChart2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <Label className="text-[15px] font-bold text-slate-900">Payout Reports</Label>
                      <p className="text-[13px] font-semibold text-slate-500">Receive a weekly summary of your payouts.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col text-left">
                      <span className="text-[12px] font-bold text-slate-900">Email</span>
                      <span className="text-[12px] font-semibold text-slate-500">{business.contactEmail || "info@example.com"}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-11 rounded-full bg-slate-200 relative cursor-pointer border border-slate-300">
                        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-500 w-6">Off</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50/50 p-4 mt-2">
                  <Info className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-[13px] font-semibold text-slate-700">
                    You can update your email and phone number in <span className="font-bold text-primary">Business Profile</span> settings.
                  </p>
                </div>
                
              </div>
            </div>

            <div className="px-8 py-6 border-t border-slate-200 bg-white">
              <Button disabled className="bg-slate-200 text-slate-400 font-bold h-11 px-6 rounded-lg shadow-sm gap-2">
                <Save className="h-4 w-4" />
                Save preferences (Coming Soon)
              </Button>
            </div>
            
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden p-8">
            
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900">Staff Access</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Manage who can access and manage this business portal.</p>
                </div>
              </div>
              <form action={inviteTeamMember} className="flex gap-2">
                <Input name="email" type="email" placeholder="Email address" required className="h-10 text-[13px]" />
                <select name="role" className="h-10 rounded-md border border-slate-200 px-3 text-[13px]">
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                </select>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-5 rounded-lg shadow-sm gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite
                </Button>
              </form>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-[15px] font-bold text-slate-900">Team members</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {teamMembers.length}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[13px] font-bold text-slate-500">Member</TableHead>
                    <TableHead className="text-[13px] font-bold text-slate-500">Role & Permissions</TableHead>
                    <TableHead className="text-[13px] font-bold text-slate-500">Joined</TableHead>
                    <TableHead className="text-right text-[13px] font-bold text-slate-500">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                            {member.user.name?.charAt(0) || "U"}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{member.user.name || "Unknown"}</span>
                              {member.role === "OWNER" && (
                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">Owner</span>
                              )}
                            </div>
                            <span className="text-[13px] font-semibold text-slate-500">{member.user.email}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-bold text-slate-900 text-[14px]">{member.role}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-500" />
                          <span className="font-bold text-slate-900 text-[14px]">{member.createdAt.toLocaleDateString("en-UG", { dateStyle: "medium" })}</span>
                        </div>
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        {member.role !== "OWNER" && (
                          <form action={removeTeamMember.bind(null, member.id)} className="inline-block">
                             <Button type="submit" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 text-slate-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id} className="bg-slate-50/50 hover:bg-slate-50">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-500">
                            @
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-900">{invitation.email}</span>
                            <span className="text-[12px] font-bold text-orange-600 uppercase tracking-wider">{invitation.status}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-slate-900 text-[14px]">{invitation.role}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[13px] font-semibold text-slate-500">Expires: {invitation.expiresAt.toLocaleDateString()}</span>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                         <form action={cancelInvitation.bind(null, invitation.id)} className="inline-block">
                           <Button type="submit" variant="ghost" size="sm" className="text-[12px] text-red-600 font-bold h-8 px-2">Cancel</Button>
                         </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/50 p-5">
              <Info className="h-5 w-5 text-primary shrink-0" />
              <p className="text-[14px] font-semibold text-slate-700">
                Owners have full access to all settings, revenue, and team management.
              </p>
            </div>
            
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
