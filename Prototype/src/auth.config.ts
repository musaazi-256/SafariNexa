import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { isAuthDevMode } from "@/lib/dev-mode";

/**
 * Edge-safe auth config used by middleware. Deliberately excludes the
 * Credentials providers, PrismaAdapter, and bcrypt — none of those are
 * Edge-runtime compatible, and middleware only needs to *read* an already
 *-issued JWT, never call authorize()/adapter code. The full config (with
 * Credentials, Google's DB-driven signIn logic, and the Prisma adapter)
 * lives in `@/auth` and runs on the Node.js runtime (API routes, server
 * components, server actions).
 */
export default {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: {
    signIn: "/auth/sign-in",
    error: "/auth/sign-in"
  },
  providers: [
    Google({ id: "google", clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }),
    Google({ id: "google-admin", clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })
  ],
  callbacks: {
    // Projects whatever the full Node-runtime config already put in the JWT
    // onto session.user — no DB access, just reading existing claims.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.isAdmin = Boolean(token.isAdmin) || isAuthDevMode();
        session.user.adminRoleName = (token.adminRoleName as string | null) ?? null;
        session.user.businessIds = (token.businessIds as string[]) ?? [];
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
