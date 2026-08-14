import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AccountLayout } from "@/components/account-layout";
import { PreferencesForm } from "@/components/forms/preferences-form";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { NOTIFICATION_TYPES, defaultPreferences, parsePreferences, type CustomerPreferences } from "@/lib/preferences";

export default async function PreferencesPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fprofile%2Fpreferences");

  const profile = await db.customerProfile.findUnique({ where: { userId: session.user.id } });
  const preferences = parsePreferences(profile?.preferences);

  async function updatePreferences(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/auth/sign-in?returnTo=%2Fprofile%2Fpreferences");

    const notify = defaultPreferences().notify;
    for (const type of NOTIFICATION_TYPES) {
      notify[type] = formData.has(`notify_${type}`);
    }
    const next: CustomerPreferences = { notify };

    const nationality = String(formData.get("nationality") ?? "").trim();
    const emergencyContact = String(formData.get("emergencyContact") ?? "").trim();

    await db.customerProfile.upsert({
      where: { userId: activeSession.user.id },
      update: { preferences: next, nationality: nationality || null, emergencyContact: emergencyContact || null },
      create: {
        userId: activeSession.user.id,
        preferences: next,
        nationality: nationality || null,
        emergencyContact: emergencyContact || null
      }
    });
  }

  return (
    <AccountLayout
      eyebrow="Account"
      title="Preferences"
      description="Control what SafariNexa notifies you about, and set your default traveller details."
    >
      <Card className="border-none shadow-sm rounded-2xl">
        <CardContent className="pt-6 pb-6">
          <PreferencesForm
            notify={preferences.notify}
            nationality={profile?.nationality ?? ""}
            emergencyContact={profile?.emergencyContact ?? ""}
            action={updatePreferences}
          />
        </CardContent>
      </Card>
    </AccountLayout>
  );
}
