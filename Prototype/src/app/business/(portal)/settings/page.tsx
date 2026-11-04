import { redirect } from "next/navigation";
import { RemoteImage } from "@/components/remote-image";
import { NotificationPreferencesForm } from "@/components/notifications/notification-preferences-form";
import { parsePreferences } from "@/lib/preferences";
import { TableColumnLabel } from "@/components/ui/table-column-label";
import { ImageUploader } from "@/components/ui/image-uploader";
import { isDemoMode } from "@/lib/dev-mode";
import Link from "next/link";
import { ImageIcon, Store, Trash2, Bell, CalendarDays, XCircle, BarChart2, Info, Save, Users, UserPlus, ShieldCheck, MoreVertical, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireBusinessSession } from "@/lib/business";
import { updateBusinessProfile } from "@/lib/actions/business-settings";
import { inviteTeamMember, cancelInvitation, removeTeamMember } from "@/lib/actions/team";
import { db } from "@/lib/db";

export default async function BusinessSettingsPage({ searchParams }: { searchParams?: { tab?: string; edit?: string } }) {
  const { business, businessId, session } = await requireBusinessSession();
  const accountProfile=await db.customerProfile.findUnique({where:{userId:session.user.id},select:{preferences:true}});

  if (!business || !businessId) return null;

  const rawTab = searchParams?.tab?.toLowerCase();
  if (rawTab === "verification") redirect("/business/settings/verification");
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

  const canEditProfile = teamMembers.some(member => member.userId === session.user.id && ["OWNER", "MANAGER"].includes(member.role));
  const isEditingProfile = defaultTab === "profile" && canEditProfile && searchParams?.edit === "profile";
  const profileDetails = [
    ["Business name", business.name], ["Support email", business.contactEmail],
    ["Phone number", business.contactPhone], ["Physical address", business.address],
    ["City", business.city], ["Country", business.country],
    ["Registration number", business.registrationNumber], ["Contact name", business.contactName],
    ["Contact role", business.contactRole]
  ];

  async function saveBusinessProfile(formData: FormData) {
    "use server";
    await updateBusinessProfile(formData);
    redirect("/business/settings");
  }

  return (
    <div className="space-y-6">
        {defaultTab === "profile" && <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">

            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-slate-900">Business information</h2>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">{isEditingProfile ? "Update your registered business details." : "Your registered business details and contact information."}</p>
              </div>
              </div>
              {!isEditingProfile && canEditProfile && <Button asChild variant="outline"><Link href="/business/settings?edit=profile">Edit business profile</Link></Button>}
            </div>

            {isEditingProfile ? <form action={saveBusinessProfile}>
              <div className="mb-8 grid gap-6 sm:grid-cols-2">
                <div className="space-y-3"><Label>Business logo</Label><p className="text-xs text-muted-foreground">Shown in your business profile and customer conversations.</p><ImageUploader name="logoUrl" label="Upload business logo" defaultValue={business.logoUrl ?? ""} /></div>
                <div className="space-y-3"><Label>Cover photo</Label><p className="text-xs text-muted-foreground">Shown at the top of your business overview.</p><ImageUploader name="coverImageUrl" label="Upload business cover photo" defaultValue={business.coverImageUrl ?? ""} /></div>
              </div>
              <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-slate-700">Business Name <span className="text-red-500">*</span></Label>
                  <Input id="name" name="name" required defaultValue={business.name} className="h-11 rounded-xl font-medium focus-visible:ring-primary shadow-none" />
                </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Support Email <span className="text-red-500">*</span></Label>
                <Input id="email" name="email" required type="email" defaultValue={business.contactEmail || ""} className="h-11 rounded-xl font-medium focus-visible:ring-primary shadow-none" />
                <p className="text-xs font-medium text-slate-500">The email customers can use to contact your business.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
                <PhoneInput id="phone" name="phone" autoComplete="tel" required defaultValue={business.contactPhone || ""} />
                <p className="text-xs font-medium text-slate-500">Choose the country, then enter the number.</p>
              </div>


              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700">Physical Address <span className="text-red-500">*</span></Label>
                <Input id="address" name="address" required defaultValue={business.address ?? ""} placeholder="Street address" className="h-11 rounded-xl font-medium focus-visible:ring-primary shadow-none" />
                <p className="text-xs font-medium text-slate-500">Registered business address for administration. Set each listing’s customer-facing address in its listing form.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-slate-700">City <span className="text-red-500">*</span></Label>
                <Input id="city" name="city" required defaultValue={business.city ?? ""} className="h-11 rounded-xl font-medium focus-visible:ring-primary shadow-none" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-slate-700">Country</Label>
                <Input id="country" name="country" defaultValue={business.country} className="h-11 rounded-xl font-medium focus-visible:ring-primary shadow-none" />
              </div>

              <div className="space-y-2"><Label htmlFor="registrationNumber">Registration number</Label><Input id="registrationNumber" name="registrationNumber" defaultValue={business.registrationNumber ?? ""} /></div>
              <div className="space-y-2"><Label htmlFor="contactName">Contact name</Label><Input id="contactName" name="contactName" defaultValue={business.contactName ?? ""} /></div>
              <div className="space-y-2"><Label htmlFor="contactRole">Contact role</Label><Input id="contactRole" name="contactRole" defaultValue={business.contactRole ?? ""} /></div>
              <div className="space-y-2 sm:col-span-2 relative">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">About the Business <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  defaultValue={business.description ?? ""}
                  placeholder="We provide the best safari experiences in East Africa."
                  className="rounded-xl font-medium resize-none focus-visible:ring-primary shadow-none"
                />
                <p className="text-xs font-medium text-slate-500 mt-1">This description appears on your business profile.</p>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-medium h-11 px-6 rounded-lg shadow-sm">
                  Save changes
                </Button>
                <Button asChild variant="outline"><Link href="/business/settings">Cancel</Link></Button>
              </div>
            </div>
            </form> : <div className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2"><h3 className="text-sm font-medium text-muted-foreground">Business logo</h3>
                  {business.logoUrl ? <RemoteImage src={business.logoUrl} alt={`${business.name} logo`} className="h-24 w-24 rounded-xl border object-contain" /> : <div role="img" aria-label="Business logo not submitted" className="flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-2 text-center text-muted-foreground">
                    <Store aria-hidden="true" className="h-6 w-6" /><span className="text-xs">No logo yet</span>
                  </div>}
                </div>
                <div className="space-y-2"><h3 className="text-sm font-medium text-muted-foreground">Cover photo</h3>
                  {business.coverImageUrl ? <RemoteImage src={business.coverImageUrl} alt={`${business.name} cover`} className="h-32 w-full rounded-xl border object-cover" /> : <div role="img" aria-label="Business cover photo not submitted" className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-muted-foreground">
                    <ImageIcon aria-hidden="true" className="h-6 w-6" /><span className="text-xs">Cover photo not submitted</span>
                  </div>}
                </div>
              </div>
              <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {profileDetails.map(([label, value]) => <div key={label} className={label === "Physical address" ? "sm:col-span-2" : ""}>
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="mt-1 break-words text-sm font-medium text-foreground">{value?.trim() || "Not provided"}</dd>
                </div>)}
                <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">About the business</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{business.description?.trim() || "Not provided"}</dd></div>
              </dl>
            </div>}

          </div>
        </div>}

        {defaultTab === "notifications" && <div className="space-y-6">
          <Card><CardHeader><CardTitle>Notification categories</CardTitle><CardDescription>Manage the updates shown in your account’s notification centre.</CardDescription></CardHeader><CardContent><NotificationPreferencesForm notify={parsePreferences(accountProfile?.preferences).notify}/></CardContent></Card>
          <div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link href="/business/notifications">Open notifications</Link></Button><Button asChild variant="outline"><Link href="/business/messages">Open messages</Link></Button></div>
        </div>}

        {defaultTab === "team" && <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden p-8">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl font-semibold text-slate-900">Staff Access</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1 leading-relaxed">Manage who can access and manage this business portal.</p>
                </div>
              </div>
              <form action={inviteTeamMember} className="flex gap-2">
                <Input name="email" type="email" placeholder="Email address" required className="h-11 text-base md:text-sm" />
                <select name="role" className="form-control">
                  <option value="STAFF">Staff</option>
                  <option value="MANAGER">Manager</option>
                </select>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-10 px-5 rounded-lg shadow-sm gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite
                </Button>
              </form>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-base font-semibold text-slate-900">Team members</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {teamMembers.length}
              </span>
            </div>

            <div>
              <Table tableId="business-team" aria-label="Team members">
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role & Permissions</TableHead>
                    <TableHead><TableColumnLabel help="The date the member joined your business. Pending invitations have not been accepted.">Joined</TableColumnLabel></TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-normal text-primary">
                            {member.user.name?.charAt(0) || "U"}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-normal text-slate-700">{member.user.name || "Unknown"}</span>
                              {member.role === "OWNER" && (
                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-normal uppercase text-primary">Owner</span>
                              )}
                            </div>
                            <span className="text-sm font-normal text-slate-500">{member.user.email}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-normal text-slate-700 text-sm">{member.role}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-500" />
                          <span className="font-normal text-slate-700 text-sm">{member.createdAt.toLocaleDateString("en-UG", { dateStyle: "medium" })}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {member.role !== "OWNER" && (
                          <form action={removeTeamMember.bind(null, member.id)} className="inline-block">
                             <Button aria-label={`Remove ${member.user.name ?? member.user.email} from the team`} type="submit" variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border text-slate-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-normal text-slate-500">
                            @
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-normal text-slate-700">{invitation.email}</span>
                            <span className="text-xs font-normal text-orange-600 uppercase tracking-wider">{invitation.status}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-normal text-slate-700 text-sm">{invitation.role}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-normal text-slate-500">Expires: {invitation.expiresAt.toLocaleDateString()}</span>
                      </TableCell>
                      <TableCell className="text-right">
                         <form action={cancelInvitation.bind(null, invitation.id)} className="inline-block">
                           <Button type="submit" variant="ghost" size="sm" className="text-xs text-red-600 font-normal h-8 px-2">Cancel</Button>
                         </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50/50 p-5">
              <Info className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                Owners have full access to all settings, revenue, and team management.
              </p>
            </div>

          </div>
        </div>}
    </div>
  );
}
