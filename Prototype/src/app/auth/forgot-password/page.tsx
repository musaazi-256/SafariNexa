import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[70vh] items-center justify-center py-14">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reset your password</CardTitle>
              <CardDescription>
                We&apos;ll email a reset link if an account exists for this address. Email delivery isn&apos;t connected
                in this environment yet — wiring a provider (e.g. Resend/SES) is an open follow-up.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reset-email">Email</Label>
                <Input id="reset-email" type="email" placeholder="you@example.com" disabled />
              </div>
              <Button disabled>Send reset link</Button>
            </CardContent>
          </Card>
        </Container>
      </main>
    </>
  );
}
