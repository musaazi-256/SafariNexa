import { AuthCard } from "@/components/auth-card";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/ui/container";

export default function SignInPage({
  searchParams
}: {
  searchParams: { returnTo?: string; error?: string; reason?: string };
}) {
  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[75vh] flex-col items-center justify-center gap-4 py-14">
          {searchParams.reason ? (
            <p className="text-sm font-semibold text-muted-foreground">Sign in to continue: {searchParams.reason}</p>
          ) : null}
          <AuthCard surface="customer" returnTo={searchParams.returnTo} error={searchParams.error} />
        </Container>
      </main>
    </>
  );
}
