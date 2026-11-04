import { PageHeader } from "@/components/page-header";
import { AccountEmailForm } from "@/components/account-email-form";
import { MailCheck } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export default function VerifyEmailPage({searchParams}:{searchParams:{token?:string}}) {
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
              <PageHeader title={<>Check your email</>} description={<>
                {searchParams.token ? "Confirm ownership of your email address below." : "Request a single-use email verification link."}
              </>} />
              <AccountEmailForm purpose="verify" token={searchParams.token} />
            </CardContent>
          </Card>
        </Container>
      </main>
    </>
  );
}
