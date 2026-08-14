import { ShieldAlert } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { GoogleFlowPanel } from "@/components/google-flow-panel";
import { GoogleAuthTrigger } from "@/components/google-auth-trigger";
import { PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import { safeReturnTo } from "@/lib/return-to";

export default function AdminGooglePage({ searchParams }: { searchParams: { returnTo?: string } }) {
  const returnTo = safeReturnTo(searchParams.returnTo, "/admin/dashboard");
  const callbackUrl = `/admin/auth/google/callback?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20">
          <PageHero variant="portal"
            eyebrow="Admin Google authentication"
            title="Continue with Google"
            description="Admin accounts are never created from Google. Only an existing, active AdminUser record can sign in this way."
          />
          <div className="mb-6 flex max-w-xl items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-sm text-warning-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Unknown, suspended, or unassigned-role Google accounts are denied and logged to the audit trail.
          </div>
          <div className="max-w-sm">
            <GoogleAuthTrigger provider="google-admin" callbackUrl={callbackUrl} />
          </div>
          <h2 className="mb-3 mt-10 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            What happens after Google responds
          </h2>
          <GoogleFlowPanel surface="admin" />
        </Container>
      </main>
    </>
  );
}
