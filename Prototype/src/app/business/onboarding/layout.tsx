import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

export default function BusinessOnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#FBFAF5]">
      <header className="flex h-16 shrink-0 items-center border-b bg-background px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <Logo size="md" />
        </Link>
      </header>
      <main className="flex-1 p-6 md:p-12">
        {children}
      </main>
    </div>
  );
}
