import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

const linkSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your account password to confirm it's you." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    await logAuditEvent({ actorEmail: email, surface: "CUSTOMER", action: "google_provider_link", outcome: "DENIED" });
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const pending = await db.pendingProviderLink.findFirst({
    where: { email, provider: "google", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" }
  });

  if (!pending) {
    return NextResponse.json(
      { error: "Your Google sign-in attempt expired. Continue with Google again to retry." },
      { status: 410 }
    );
  }

  await db.account.upsert({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: pending.providerAccountId } },
    create: { provider: "google", providerAccountId: pending.providerAccountId, type: "oauth", userId: user.id },
    update: { userId: user.id }
  });

  await db.pendingProviderLink.deleteMany({ where: { email, provider: "google" } });
  await logAuditEvent({ actorUserId: user.id, actorEmail: email, surface: "CUSTOMER", action: "google_provider_link", outcome: "SUCCESS" });

  return NextResponse.json({ ok: true });
}
