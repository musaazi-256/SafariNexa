import { SiteHeader } from "@/components/site-header";
import { GoogleFlowPanel } from "@/components/google-flow-panel";
import { GoogleAuthTrigger } from "@/components/google-auth-trigger";
import { PageHero } from "@/components/page-hero";
import { Container } from "@/components/ui/container";
import { safeReturnTo } from "@/lib/return-to";

export default function CustomerGooglePage({ searchParams }: { searchParams: { returnTo?: string } }) {
  const returnTo = safeReturnTo(searchParams.returnTo, "/auth/google/callback");
  const callbackUrl = `/auth/google/callback?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20">
          <PageHero
            eyebrow="Google authentication"
            title="Continue with Google"
            description="Google returns your verified identity. SafariNexa checks the database before deciding what happens next."
          />
          <div className="max-w-sm">
            <GoogleAuthTrigger provider="google" callbackUrl={callbackUrl} />
          </div>
          <h2 className="mb-3 mt-10 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            What happens after Google responds
          </h2>
          <GoogleFlowPanel surface="customer" />
        </Container>
      </main>
    </>
  );
}
