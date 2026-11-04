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
      <main className="bg-muted/10 min-h-screen pb-24 pt-8">
        <Container>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-10">
            <aside className="w-full shrink-0 md:sticky md:top-24 md:w-64">
              <AccountSidebar />
            </aside>
            <div className="flex-1 min-w-0">
              <div className="mb-8">
                {eyebrow && (
                  <p className="mb-2 type-eyebrow text-brand-green leading-relaxed">
                    {eyebrow}
                  </p>
                )}
                <h1 className="type-page">{title}</h1>
                {description && (
                  <p className="mt-2 text-base text-muted-foreground max-w-2xl leading-relaxed">
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
