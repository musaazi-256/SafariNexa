import { CreateAccountForm } from "@/components/forms/create-account-form";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/ui/container";
import { safeReturnTo } from "@/lib/return-to";

export default function CreateAccountPage({ searchParams }: { searchParams: { returnTo?: string } }) {
  const returnTo = safeReturnTo(searchParams.returnTo, "/");

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[75vh] items-center justify-center py-14">
          <CreateAccountForm returnTo={returnTo} />
        </Container>
      </main>
    </>
  );
}
