import Link from "next/link";
import { ArrowRight, Building2, UserPlus } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Partner with SafariNexa",
  description: "Join our platform to list your accommodation, tours, and services.",
};

export default function BusinessLandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <Container className="flex min-h-[80vh] flex-col items-center justify-center py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Partner with SafariNexa
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Grow your business by reaching thousands of travelers. Manage your bookings, listings, and revenue all in one powerful platform.
          </p>

          <div className="mt-10 flex w-full max-w-sm flex-col gap-4 sm:max-w-md sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/business/onboarding">
                <UserPlus className="mr-2 h-5 w-5" />
                Register New Business
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/business/auth/sign-in">
                Log in to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </Container>
      </main>
    </>
  );
}
