import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Key, ShieldCheck } from "lucide-react";

import { auth } from "@/auth";
import { AccountLayout } from "@/components/customer/account-layout";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { EditProfileForm } from "@/components/forms/edit-profile-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

function initials(name?: string | null, email?: string | null) {
  const source = name ?? email ?? "SafariNexa";
  return source
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fprofile");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { customerProfile: true, accounts: true }
  });
  if (!user) redirect("/auth/sign-in?returnTo=%2Fprofile");

  const hasGoogle = user.accounts.some((account) => account.provider === "google");

  async function updateProfile(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in?returnTo=%2Fprofile");

    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const dateOfBirthRaw = String(formData.get("dateOfBirth") ?? "");

    await db.user.update({
      where: { id: activeSession.user.id },
      data: { name: name || null, phone: phone || null }
    });

    await db.customerProfile.upsert({
      where: { userId: activeSession.user.id },
      update: { dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null },
      create: { userId: activeSession.user.id, dateOfBirth: dateOfBirthRaw ? new Date(dateOfBirthRaw) : null }
    });

    revalidatePath("/profile");
  }

  async function changePassword(formData: FormData): Promise<{ error?: string }> {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in?returnTo=%2Fprofile");

    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };
    if (newPassword !== confirmPassword) return { error: "New password and confirmation don't match." };

    const target = await db.user.findUnique({ where: { id: activeSession.user.id } });
    if (!target?.passwordHash) return { error: "This account doesn't use a password." };

    const valid = await bcrypt.compare(currentPassword, target.passwordHash);
    if (!valid) return { error: "Current password is incorrect." };

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({ where: { id: target.id }, data: { passwordHash } });

    return {};
  }

  return (
    <AccountLayout
      eyebrow="Account"
      title="Profile"
      description="Your identity, contact details, and account security."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        
        {/* Left Column: Forms */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Account details</CardTitle>
              <p className="text-sm text-muted-foreground">Update your name, phone number, and date of birth.</p>
            </CardHeader>
            <CardContent>
              <EditProfileForm
                name={user.name ?? ""}
                phone={user.phone ?? ""}
                dateOfBirth={user.customerProfile?.dateOfBirth ? user.customerProfile.dateOfBirth.toISOString().slice(0, 10) : ""}
                action={updateProfile}
              />
            </CardContent>
          </Card>

          {user.passwordHash ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Password</CardTitle>
                <p className="text-sm text-muted-foreground">Change the password you use to sign in.</p>
              </CardHeader>
              <CardContent>
                <ChangePasswordForm action={changePassword} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Password</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This account signs in with Google only — there&apos;s no SafariNexa password to change.
                </p>
              </CardHeader>
            </Card>
          )}
        </div>

        {/* Right Column: Avatar Summary */}
        <div>
          <Card className="sticky top-24 text-center">
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <Avatar className="h-16 w-16 border border-border">
                {user.image ? <AvatarImage src={user.image} alt={user.name ?? "Account"} /> : null}
                <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                  {initials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 mb-2">
                <p className="text-lg font-semibold">{user.name ?? "Traveller"}</p>
                <p className="break-all text-sm text-muted-foreground">{user.email}</p>
              </div>
              
              <div className="mt-4 flex flex-col w-full text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 border-t py-4 text-xs">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Member since</span>
                  </div>
                  <span className="text-muted-foreground">
                    {user.createdAt.toLocaleDateString("en-UG", { dateStyle: "medium" })}
                  </span>
                </div>
                <div className="flex items-center gap-3 border-t py-4 text-xs">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{hasGoogle ? "Google connected" : "Email & password"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
      </div>
    </AccountLayout>
  );
}
