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
              <h1 className="type-page text-xl">Access denied</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Your account is not authorised for this administrative action. It may be inactive or missing the required role permission. Ask a super admin to check your access. No additional administrative access has been granted.
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
