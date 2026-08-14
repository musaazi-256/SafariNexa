import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";
import { safeReturnTo } from "@/lib/return-to";

// Uses the edge-safe config only — no Prisma/bcrypt in this bundle.
const { auth } = NextAuth(authConfig);

const CUSTOMER_PROTECTED_PREFIXES = [
  "/checkout",
  "/bookings",
  "/payments/receipt",
  "/profile",
  "/notifications",
  "/support",
  "/reviews/new",
  "/trip-planner"
];

const BUSINESS_PUBLIC_PREFIXES = ["/business/auth", "/business/onboarding"];
const ADMIN_PUBLIC_PREFIXES = ["/admin/login", "/admin/auth"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const session = req.auth;

  const isCustomerProtected = CUSTOMER_PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (isCustomerProtected && !session?.user) {
    const signInUrl = new URL("/auth/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("returnTo", safeReturnTo(pathname + search, pathname));
    return NextResponse.redirect(signInUrl);
  }

  const isBusinessRoute = pathname === "/business" || pathname.startsWith("/business/");
  const isBusinessPublic = BUSINESS_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isBusinessRoute && !isBusinessPublic && !session?.user) {
    const signInUrl = new URL("/business/auth/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("returnTo", safeReturnTo(pathname + search, pathname));
    return NextResponse.redirect(signInUrl);
  }

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminPublic = ADMIN_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isAdminRoute && !isAdminPublic) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/admin/login", req.nextUrl.origin));
    }
    if (!session.user.isAdmin) {
      return NextResponse.redirect(new URL("/admin/auth/access-denied", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"]
};
