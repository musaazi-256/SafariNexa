import Link from "next/link";
import { ShieldX } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export default function AdminAccessDeniedPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[70vh] items-center justify-center py-14">
          <Card className="max-w-md border-destructive/30">
            <CardContent className="flex flex-col items-center gap-3 pt-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <ShieldX className="h-6 w-6" />
              </span>
              <h1 className="text-xl font-bold">Access denied</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This Google account isn&apos;t recognized as an active SafariNexa admin. Admin access is never created
                automatically — if you believe this is a mistake, ask a super admin to check your role. This attempt
                has been recorded in the audit log.
              </p>
              <Button asChild variant="secondary" className="mt-2">
                <Link href="/admin/login">Back to admin sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </Container>
      </main>
    </>
  );
}
