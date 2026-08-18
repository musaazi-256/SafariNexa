import Link from "next/link";
import { Search } from "lucide-react";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import { SignOutMenuItem } from "@/components/sign-out-button";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { CartDropdown } from "@/components/cart/cart-dropdown";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/accommodation", label: "Accommodation" },
  { href: "/tours", label: "Tours" },
  { href: "/guides", label: "Guides" },
  { href: "/trip-planner", label: "Trip Planner" }
];

const AUTH_LINKS = [
  { href: "/auth/sign-in", label: "Sign in" },
  { href: "/auth/create-account", label: "Create account" }
];

export async function SiteHeader() {
  const session = await auth();
  const unreadCount = session?.user ? await getUnreadNotificationCount(session.user.id) : 0;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
        <Container className="flex h-[72px] items-center justify-between gap-4">
        <Link href="/">
          <Logo />
        </Link>

        <NavLinks links={NAV_LINKS} />

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Search">
            <Link href="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          <div className="hidden items-center gap-2 border-r border-border pr-2 mr-1 lg:flex">
            <Link href="/business" className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Business
            </Link>
            <Link href="/admin/dashboard" className="px-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Admin
            </Link>
          </div>

          <CartDropdown />

          {session?.user ? (
            <UserMenu name={session.user.name} email={session.user.email} image={session.user.image} unreadCount={unreadCount}>
              <SignOutMenuItem />
            </UserMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost">
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/create-account">Create account</Link>
              </Button>
            </div>
          )}

          <div className="hidden md:flex">
            <MobileNav links={NAV_LINKS} authed={Boolean(session?.user)} authLinks={AUTH_LINKS} />
          </div>
        </div>
      </Container>
      </header>
      <MobileBottomNav />
    </>
  );
}
