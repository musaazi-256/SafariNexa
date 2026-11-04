import { EmptyState } from "@/components/ui/empty-state";
import { isDemoMode } from "@/lib/dev-mode";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountLayout } from "@/components/customer/account-layout";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PaymentSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fprofile%2Fpayment-settings");

  return (
    <AccountLayout
      eyebrow="Account"
      title="Payment Settings"
      description="Review payments and receipts for your account."
    >
      <EmptyState title="Payment methods" description={isDemoMode() ? "Choose mobile money or a card during checkout." : "Choose a payment method during checkout."} />
      <div className="mt-6 flex flex-wrap justify-center gap-3"><Button asChild><Link href="/bookings">View bookings and payments</Link></Button><Button asChild variant="outline"><Link href="/support">Payment support</Link></Button></div>
    </AccountLayout>
  );
}
