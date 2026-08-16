import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Store, Trash2, Bell, CalendarDays, XCircle, BarChart2, Info, Save, Users, UserPlus, ShieldCheck, MoreVertical, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { requireBusinessSession } from "@/lib/business";

export default async function BusinessSettingsPage() {
  const { business } = await requireBusinessSession();

  if (!business) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-4">
      <PageHero variant="portal" eyebrow="Business portal" title="Settings" description="Manage your business profile and preferences." />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Staff Access</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            
            <div className="flex items-start gap-4 mb-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4F2E8]">
                <Store className="h-5 w-5 text-[#1e613c]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-slate-900">Business Information</h3>
                <p className="text-sm font-medium text-slate-500">Update your registered business details.</p>
              </div>
            </div>

            <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[13px] font-bold text-slate-700">Business Name <span className="text-red-500">*</span></Label>
                <Input id="name" defaultValue={business.name} className="h-11 rounded-lg border-slate-200 font-medium focus-visible:ring-[#1e613c] shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[13px] font-bold text-slate-700">Support Email <span className="text-red-500">*</span></Label>
                <Input id="email" type="email" defaultValue={business.contactEmail || "support@example.com"} className="h-11 rounded-lg border-slate-200 font-medium focus-visible:ring-[#1e613c] shadow-sm" />
                <p className="text-[11px] font-semibold text-slate-400">This email will receive important updates and notifications.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[13px] font-bold text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 pr-2 border-r border-slate-200">
                    <span className="text-base mr-1">🇺🇬</span>
                    <span className="text-[13px] font-bold text-slate-600">+256</span>
                  </div>
                  <Input id="phone" type="tel" defaultValue="700 000000" className="h-11 rounded-lg border-slate-200 font-medium pl-[88px] focus-visible:ring-[#1e613c] shadow-sm" />
                </div>
                <p className="text-[11px] font-semibold text-slate-400">Include country code</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website" className="text-[13px] font-bold text-slate-700">Website (Optional)</Label>
                <Input id="website" type="url" placeholder="https://" className="h-11 rounded-lg border-slate-200 font-medium focus-visible:ring-[#1e613c] shadow-sm" />
                <p className="text-[11px] font-semibold text-slate-400">Add your website to help customers learn more about your business.</p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address" className="text-[13px] font-bold text-slate-700">Physical Address <span className="text-red-500">*</span></Label>
                <Input id="address" defaultValue={business.city ? `${business.city}, ${business.country}` : "Kampala, Uganda"} className="h-11 rounded-lg border-slate-200 font-medium focus-visible:ring-[#1e613c] shadow-sm" />
                <p className="text-[11px] font-semibold text-slate-400">Your business address will be visible to customers on your listings.</p>
              </div>

              <div className="space-y-2 sm:col-span-2 relative">
                <Label htmlFor="description" className="text-[13px] font-bold text-slate-700">About the Business <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="description" 
                  rows={4} 
                  defaultValue="We provide the best safari experiences in East Africa." 
                  className="rounded-lg border-slate-200 font-medium resize-none focus-visible:ring-[#1e613c] shadow-sm pb-8" 
                />
                <div className="absolute bottom-2 right-3 text-[11px] font-bold text-slate-400">50 / 500</div>
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
                <Button disabled className="bg-slate-200 text-slate-400 font-bold h-11 px-6 rounded-lg shadow-sm">
                  Save changes (Coming Soon)
                </Button>
              </div>
            </div>
            
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            
            <div className="p-8 pb-4">
              <div className="flex items-start gap-4 mb-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E4F2E8]">
                  <Bell className="h-5 w-5 text-[#1e613c]" />
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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E4F2E8]">
                      <CalendarDays className="h-5 w-5 text-[#1e613c]" />
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
                      <div className="h-6 w-11 rounded-full bg-[#1e613c] relative cursor-pointer shadow-sm">
                        <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                      </div>
                      <span className="text-[13px] font-bold text-[#1e613c] w-6">On</span>
                    </div>
                  </div>
                </div>

                {/* Cancellations */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E4F2E8]">
                      <XCircle className="h-5 w-5 text-[#1e613c]" />
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
                      <div className="h-6 w-11 rounded-full bg-[#1e613c] relative cursor-pointer shadow-sm">
                        <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
                      </div>
                      <span className="text-[13px] font-bold text-[#1e613c] w-6">On</span>
                    </div>
                  </div>
                </div>

                {/* Payout Reports */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E4F2E8]">
                      <BarChart2 className="h-5 w-5 text-[#1e613c]" />
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
                  <Info className="h-5 w-5 text-[#1e613c] shrink-0" />
                  <p className="text-[13px] font-semibold text-slate-700">
                    You can update your email and phone number in <span className="font-bold text-[#1e613c]">Business Profile</span> settings.
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
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E4F2E8]">
                  <Users className="h-6 w-6 text-[#1e613c]" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900">Staff Access</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Manage who can access and manage this business portal.</p>
                </div>
              </div>
              <Button disabled className="bg-slate-200 text-slate-400 font-bold h-10 px-5 rounded-lg shadow-sm gap-2">
                <UserPlus className="h-4 w-4" />
                Invite team member (Coming Soon)
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-[15px] font-bold text-slate-900">Team members</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E4F2E8] text-[11px] font-bold text-[#1e613c]">
                2
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden mb-6">
              <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-6 py-3">
                <div className="col-span-5 text-[13px] font-bold text-slate-500">Member</div>
                <div className="col-span-3 text-[13px] font-bold text-slate-500">Role & Permissions</div>
                <div className="col-span-3 text-[13px] font-bold text-slate-500">Joined</div>
                <div className="col-span-1 text-right text-[13px] font-bold text-slate-500">Actions</div>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-12 items-center border-b border-slate-200 px-6 py-5">
                <div className="col-span-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E4F2E8] text-lg font-bold text-[#1e613c]">
                    GN
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">You (Owner)</span>
                      <span className="rounded bg-[#E4F2E8] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#1e613c]">Owner</span>
                    </div>
                    <span className="text-[13px] font-semibold text-slate-500">grace.nakato@example.com</span>
                    <span className="text-[12px] font-semibold text-slate-400">Full access to all settings and revenue.</span>
                  </div>
                </div>
                
                <div className="col-span-3 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E4F2E8]">
                    <ShieldCheck className="h-4 w-4 text-[#1e613c]" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 text-[14px]">Full Access</span>
                    <span className="text-[12px] font-semibold text-slate-500">All permissions</span>
                    <span className="mt-1 w-max rounded bg-[#E4F2E8] px-1.5 py-0.5 text-[10px] font-bold text-[#1e613c]">All areas</span>
                  </div>
                </div>

                <div className="col-span-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    <span className="font-bold text-slate-900 text-[14px]">27 Jul 2026</span>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-400 pl-6">Joined</span>
                </div>

                <div className="col-span-1 flex flex-col items-end gap-1">
                  <span className="text-slate-400 font-bold">—</span>
                  <span className="text-[11px] font-bold text-slate-500">Owner</span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-12 items-center px-6 py-5">
                <div className="col-span-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600">
                    JE
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900">Jane Example</span>
                    <span className="text-[13px] font-semibold text-slate-500">jane@example.com</span>
                    <span className="text-[12px] font-semibold text-slate-400">Can manage bookings and listings.</span>
                  </div>
                </div>
                
                <div className="col-span-3 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                    <CalendarDays className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 text-[14px]">Operations Manager</span>
                    <span className="text-[12px] font-semibold text-slate-500">Bookings, Listings</span>
                    <span className="mt-1 w-max rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">2 areas</span>
                  </div>
                </div>

                <div className="col-span-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-500" />
                    <span className="font-bold text-slate-900 text-[14px]">5 Aug 2026</span>
                  </div>
                  <span className="text-[12px] font-semibold text-slate-400 pl-6">Joined</span>
                </div>

                <div className="col-span-1 flex justify-end">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 text-slate-500">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            </div>

            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/50 p-5">
              <Info className="h-5 w-5 text-[#1e613c] shrink-0" />
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
