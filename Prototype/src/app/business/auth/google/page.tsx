import { AuthCard } from "@/components/auth-card";
import { isDemoMode } from "@/lib/dev-mode";
import { SiteHeader } from "@/components/site-header";
import { GoogleFlowPanel } from "@/components/google-flow-panel";
import { GoogleAuthTrigger } from "@/components/google-auth-trigger";
import { PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import { safeReturnTo } from "@/lib/return-to";

export default function BusinessGooglePage({ searchParams }: { searchParams: { returnTo?: string } }) {
  const returnTo = safeReturnTo(searchParams.returnTo, "/business/dashboard");
  const callbackUrl = `/business/auth/google/callback?returnTo=${encodeURIComponent(returnTo)}`;

  if (isDemoMode()) return <main className="flex justify-center p-8"><AuthCard hideGoogle surface="business" returnTo={searchParams.returnTo} /></main>;
  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20">
          <PageHero variant="portal"
            eyebrow="Business Google authentication"
            title="Continue with Google"
            description="SafariNexa checks business membership, invitations, and verification status before loading your dashboard."
          />
          <div className="max-w-sm">
            <GoogleAuthTrigger provider="google" callbackUrl={callbackUrl} />
          </div>
          <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            What happens after Google responds
          </h2>
          <GoogleFlowPanel surface="business" />
        </Container>
      </main>
    </>
  );
}
