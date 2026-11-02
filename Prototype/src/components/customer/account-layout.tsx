import * as React from "react";
import { LiveRefresh } from "@/components/live-refresh";

import { AccountSidebar } from "@/components/customer/account-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";

interface AccountLayoutProps {
  children: React.ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
}

export function AccountLayout({ children, eyebrow, title, description }: AccountLayoutProps) {
  return (
    <>
      <LiveRefresh />
      <SiteHeader />
      <main className="min-h-screen bg-muted/40 pb-16 pt-6 sm:pt-10">
        <Container>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-10">
            <aside className="w-full shrink-0 md:sticky md:top-24 md:w-64">
              <AccountSidebar />
            </aside>
            <div className="flex-1 min-w-0">
              <div className="mb-8">
                {eyebrow && (
                  <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {eyebrow}
                  </p>
                )}
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                {description && (
                  <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                    {description}
                  </p>
                )}
              </div>
              <div className="w-full">
                {children}
              </div>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
