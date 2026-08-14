import { AuthCard } from "@/components/auth-card";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/ui/container";

export default function AdminLoginPage({ searchParams }: { searchParams: { returnTo?: string; error?: string } }) {
  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[75vh] items-center justify-center py-14">
          <AuthCard surface="admin" returnTo={searchParams.returnTo} error={searchParams.error} />
        </Container>
      </main>
    </>
  );
}
