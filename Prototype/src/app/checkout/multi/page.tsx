import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MultiCheckoutForm } from "@/components/checkout/multi-checkout-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";

export default async function MultiCheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fcheckout%2Fmulti");

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20 pt-6">
          <Breadcrumbs items={[{ label: "Cart", href: "/" }, { label: "Checkout" }]} />

          <h1 className="mb-6 text-3xl font-extrabold">Complete your booking</h1>

          <MultiCheckoutForm />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
