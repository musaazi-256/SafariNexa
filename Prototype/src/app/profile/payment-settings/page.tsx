import { redirect } from "next/navigation";
import { CreditCard, Plus, Smartphone } from "lucide-react";

import { auth } from "@/auth";
import { AccountLayout } from "@/components/account-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PaymentSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fprofile%2Fpayment-settings");

  return (
    <AccountLayout
      eyebrow="Account"
      title="Payment Settings"
      description="Manage your saved payment methods and billing preferences."
    >
      <div className="space-y-6">
        <Card className="border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Saved Payment Methods</CardTitle>
            <CardDescription>Securely save your mobile money numbers or cards for faster checkout.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mocked saved methods */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFCC00]/20">
                  <Smartphone className="h-5 w-5 text-[#FFCC00]" />
                </div>
                <div>
                  <p className="font-semibold">MTN Mobile Money</p>
                  <p className="text-sm text-muted-foreground">+256 770 ••• 123</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/28</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
            </div>

            <Button variant="outline" className="w-full mt-2">
              <Plus className="mr-2 h-4 w-4" /> Add Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
