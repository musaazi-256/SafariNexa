import { PageHeader } from "@/components/page-header";
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
      <main className="bg-white min-h-screen pb-24 pt-8">
        <Container>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-10">
            <aside className="w-full shrink-0 md:sticky md:top-24 md:w-64">
              <AccountSidebar />
            </aside>
            <div className="flex-1 min-w-0">
              <PageHeader className="mb-6 pt-0" title={title} description={description} eyebrow={eyebrow} />
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
