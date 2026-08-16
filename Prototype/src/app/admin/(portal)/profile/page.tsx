import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { ShieldAlert, Key } from "lucide-react";

import { auth } from "@/auth";
import { EditProfileForm } from "@/components/forms/edit-profile-form";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/admin";

function initials(name?: string | null, email?: string | null) {
  const source = name ?? email ?? "Admin";
  return source
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function AdminProfilePage() {
  await requireAdminSession();
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fadmin%2Fprofile");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true, adminUser: { include: { role: true } } }
  });
  if (!user || !user.adminUser) redirect("/auth/sign-in?returnTo=%2Fadmin%2Fprofile");

  const hasGoogle = user.accounts.some((account) => account.provider === "google");

  async function updateAdminProfile(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user?.isAdmin) redirect("/auth/sign-in");

    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    await db.user.update({
      where: { id: activeSession.user.id },
      data: { name: name || null, phone: phone || null }
    });

    revalidatePath("/admin/(portal)/profile", "page");
  }

  async function changePassword(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user?.isAdmin) redirect("/auth/sign-in");

    const currentPassword = String(formData.get("currentPassword"));
    const newPassword = String(formData.get("newPassword"));

    const dbUser = await db.user.findUnique({ where: { id: activeSession.user.id } });
    if (!dbUser) return { error: "User not found." };
    if (!dbUser.passwordHash) return { error: "No password set. Sign in with Google." };

    const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!valid) return { error: "Incorrect current password." };

    const hash = await bcrypt.hash(newPassword, 12);
    await db.user.update({ where: { id: dbUser.id }, data: { passwordHash: hash } });

    revalidatePath("/admin/(portal)/profile", "page");
    return { success: true };
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 pb-20 font-sans">
      
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e613c] mb-1">ADMIN SETTINGS</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">My Profile</h1>
        <p className="text-[13px] text-slate-500 font-semibold max-w-2xl">
          Manage your personal details, security settings, and contact information.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
              <CardTitle className="text-lg font-bold text-slate-900">Personal Information</CardTitle>
              <p className="text-[13px] font-semibold text-slate-500">Update your name and phone number.</p>
            </CardHeader>
            <CardContent className="p-8">
              <EditProfileForm 
                name={user.name ?? ""}
                phone={user.phone ?? ""}
                dateOfBirth=""
                action={updateAdminProfile}
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
              <CardTitle className="text-lg font-bold text-slate-900">Security & Password</CardTitle>
              <p className="text-[13px] font-semibold text-slate-500">Manage your sign-in methods.</p>
            </CardHeader>
            <CardContent className="p-8">
              {!hasGoogle ? (
                <ChangePasswordForm action={changePassword} />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-900">Google Account Linked</h3>
                    <p className="text-[13px] font-semibold text-slate-500 mt-1 leading-relaxed">
                      You sign in using your Google account. To change your password, please visit your Google account settings.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Avatar Summary */}
        <div className="space-y-8">
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <Avatar className="h-28 w-28 mb-6 border-4 border-white shadow-lg shadow-slate-200/50">
                <AvatarFallback className="bg-gradient-to-br from-[#1e613c] to-[#15462b] text-white text-3xl font-extrabold tracking-tight">
                  {initials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-extrabold text-slate-900">{user.name || "Admin User"}</h2>
              <p className="text-[14px] font-semibold text-slate-500 mt-1">{user.email}</p>
              
              <div className="mt-6 w-full pt-6 border-t border-slate-100 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E4F2E8]">
                    <ShieldAlert className="h-4 w-4 text-[#1e613c]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</p>
                    <p className="text-[13px] font-bold text-slate-900">{user.adminUser.role.name}</p>
                  </div>
                </div>
                
                {hasGoogle && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <Key className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sign-in method</p>
                      <p className="text-[13px] font-bold text-slate-900">Google Auth</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
