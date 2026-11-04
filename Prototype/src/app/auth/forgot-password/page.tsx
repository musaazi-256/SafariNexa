import { PageTitle } from "@/components/page-header";
import { AccountEmailForm } from "@/components/account-email-form";
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
              <PageTitle>Reset your password</PageTitle>
              <CardDescription>
                Request a single-use password reset link for your SafariNexa account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <AccountEmailForm purpose="reset" />
            </CardContent>
          </Card>
        </Container>
      </main>
    </>
  );
}
