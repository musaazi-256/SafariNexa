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
      <div className="space-y-4 rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Secure checkout</h2><p>Card details are entered on the configured provider’s hosted page. SafariNexa does not store card numbers, security codes or saved payment methods.</p><p>Unavailable methods cannot accept money. Payment is shown as received only after provider confirmation.</p><div className="flex flex-wrap gap-3"><Button asChild><Link href="/bookings">View bookings and payments</Link></Button><Button asChild variant="outline"><Link href="/support">Payment support</Link></Button></div></div>
    </AccountLayout>
  );
}
