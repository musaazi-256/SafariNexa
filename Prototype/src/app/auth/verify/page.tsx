import { MailCheck } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export default function VerifyEmailPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[70vh] items-center justify-center py-14">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-3 pt-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheck className="h-6 w-6" />
              </span>
              <h1 className="text-xl font-bold">Check your email</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Email verification codes require a connected email provider, which isn&apos;t configured in this
                environment yet — this is a placeholder for that step in the account flow.
              </p>
            </CardContent>
          </Card>
        </Container>
      </main>
    </>
  );
}
