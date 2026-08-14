import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isAdmin: boolean;
      adminRoleName: string | null;
      businessIds: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
    isAdmin?: boolean;
    adminRoleName?: string | null;
    businessIds?: string[];
  }
}
