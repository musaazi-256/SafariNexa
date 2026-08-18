import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountLayout } from "@/components/account-layout";
import { EmptyState } from "@/components/ui/empty-state";

export default async function PaymentSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fprofile%2Fpayment-settings");

  return (
    <AccountLayout
      eyebrow="Account"
      title="Payment Settings"
      description="Manage your saved payment methods and billing preferences."
    >
      <EmptyState 
        title="Coming soon" 
        description="Payment methods integration is currently in development."
      />
    </AccountLayout>
  );
}
