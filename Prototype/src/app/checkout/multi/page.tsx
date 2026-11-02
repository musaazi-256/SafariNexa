import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MultiCheckoutForm } from "@/components/checkout/multi-checkout-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";

export default async function MultiCheckoutPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/sign-in?returnTo=%2Fcheckout%2Fmulti");
  const user = await db.user.findUnique({where: {id: session.user.id}, include: {customerProfile: true}});

  return (
    <>
      <SiteHeader />
      <main>
        <Container className="pb-20 pt-6">
          <Breadcrumbs items={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />

          <h1 className="mb-6 text-3xl font-extrabold">Complete your booking</h1>

          <MultiCheckoutForm defaults={{ fullName: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "", nationality: user?.customerProfile?.nationality, emergencyContact: user?.customerProfile?.emergencyContact }} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
