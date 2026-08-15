"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function MobileNav({
  links,
  authed,
  authLinks
}: {
  links: Array<{ href: string; label: string }>;
  authed: boolean;
  authLinks: Array<{ href: string; label: string }>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-[85vw] max-w-xs flex-col">
        <SheetHeader>
          <SheetTitle asChild>
            <Logo size="sm" />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                {link.label}
              </Link>
            ))}
            <Separator className="my-1" />
            <Link
              href="/business"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Business Portal
            </Link>
            <Link
              href="/admin/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Admin Portal
            </Link>
        </nav>
        {!authed ? (
          <>
            <Separator className="my-2" />
            <div className="flex flex-col gap-2">
              {authLinks.map((link) => (
                <Button key={link.href} asChild variant={link.label === "Sign in" ? "default" : "secondary"} onClick={() => setOpen(false)}>
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
