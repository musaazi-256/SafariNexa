import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { z } from "zod";

import authConfig from "@/auth.config";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { isAuthDevMode } from "@/lib/dev-mode";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Node-runtime auth config: adds Credentials + the Prisma adapter on top of
// the edge-safe base config. Only ever imported from API routes, server
// components, and server actions — never from middleware.ts.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    // Customer + business email/password. Authenticates existing accounts
    // only — registration happens via /api/auth/register.
    Credentials({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        isAuthDevMode(); // Validate configuration; never bypass credentials.

        const user = await db.user.findUnique({ where: { email: normalizedEmail } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      }
    }),

    // Admin email/password. Deliberately stricter: login fails outright
    // unless an ACTIVE AdminUser record already exists for this user.
    // Admins are never created here or anywhere from a login flow.
    Credentials({
      id: "admin-credentials",
      name: "Admin email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        isAuthDevMode(); // Validate configuration; never bypass credentials.

        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
          include: { adminUser: true }
        });

        const denyLog = () =>
          logAuditEvent({
            actorEmail: email,
            surface: "ADMIN",
            action: "admin_credentials_sign_in",
            outcome: "DENIED"
          });

        if (!user?.passwordHash || !user.adminUser || user.adminUser.status !== "ACTIVE") {
          await denyLog();
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await denyLog();
          return null;
        }

        await db.adminUser.update({ where: { userId: user.id }, data: { lastLoginAt: new Date() } });
        await logAuditEvent({
          actorUserId: user.id,
          actorEmail: user.email,
          surface: "ADMIN",
          action: "admin_credentials_sign_in",
          outcome: "SUCCESS"
        });

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      }
    }),

    // Customer + business Google sign-in. Google only supplies a verified
    // identity — the signIn callback below decides what happens against the
    // SafariNexa DB (link, create, or send to onboarding).
    Google({
      id: "google",
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
      allowDangerousEmailAccountLinking: false
    }),

    // Admin Google sign-in. Same Google OAuth client, registered as a
    // second provider id so its callback (/api/auth/callback/google-admin)
    // can be gated independently and much more strictly in signIn() below.
    Google({
      id: "google-admin",
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
      allowDangerousEmailAccountLinking: false
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      if (account.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;

        const existingLinkedAccount = await db.account.findUnique({
          where: { provider_providerAccountId: { provider: "google", providerAccountId: account.providerAccountId } }
        });
        if (existingLinkedAccount) return true; // existing_linked_account

        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
          // existing_email_needs_provider_link: never silently attach Google
          // to a pre-existing email/password account. Stash the Google
          // identity briefly and send them to confirm ownership first.
          await db.pendingProviderLink.create({
            data: {
              email,
              provider: "google",
              providerAccountId: account.providerAccountId,
              expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            }
          });
          return `/auth/google/link?email=${encodeURIComponent(email)}`;
        }

        return true; // new_customer_profile — adapter creates User + Account
      }

      if (account.provider === "google-admin") {
        const email = user.email?.toLowerCase();
        const fail = async (reason: string) => {
          await logAuditEvent({
            actorEmail: email,
            surface: "ADMIN",
            action: "admin_google_sign_in",
            outcome: "DENIED",
            metadata: { reason }
          });
          return "/admin/auth/access-denied";
        };

        if (!email) return fail("no_email_from_google");

        const existingUser = await db.user.findUnique({ where: { email }, include: { adminUser: true } });
        if (!existingUser) return fail("no_matching_user"); // never auto-create admins
        if (!existingUser.adminUser) return fail("role_missing");
        if (existingUser.adminUser.status !== "ACTIVE") return fail(`status_${existingUser.adminUser.status.toLowerCase()}`);

        await db.adminUser.update({ where: { userId: existingUser.id }, data: { lastLoginAt: new Date() } });
        await logAuditEvent({
          actorUserId: existingUser.id,
          actorEmail: email,
          surface: "ADMIN",
          action: "admin_google_sign_in",
          outcome: "SUCCESS"
        });

        return true;
      }

      return true;
    },

    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.userId = user.id;
      }

      if (user?.id || token.userId || trigger === "update") {
        const dbUser = await db.user.findUnique({
          where: { id: (user?.id ?? token.userId) as string },
          include: {
            adminUser: { include: { role: true } },
            businessUsers: true
          }
        });

        if (dbUser) {
          const authVersion = createHash("sha256").update(dbUser.passwordHash ?? "oauth").digest("hex");
          if (!user?.id && token.authVersion && token.authVersion !== authVersion) return null;
          token.authVersion = authVersion;
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.isAdmin = Boolean(dbUser.adminUser && dbUser.adminUser.status === "ACTIVE");
          token.adminRoleName = dbUser.adminUser?.role.name ?? null;
          token.businessIds = dbUser.businessUsers.map((membership) => membership.businessId);
        } else return null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.adminRoleName = (token.adminRoleName as string | null) ?? null;
        session.user.businessIds = (token.businessIds as string[]) ?? [];
      }
      return session;
    }
  }
});
