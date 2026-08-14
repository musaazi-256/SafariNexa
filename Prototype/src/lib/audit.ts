import { db } from "@/lib/db";
import type { AuditOutcome, Surface } from "@prisma/client";

export async function logAuditEvent(entry: {
  actorUserId?: string;
  actorEmail?: string;
  surface: Surface;
  action: string;
  outcome: AuditOutcome;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      actorEmail: entry.actorEmail,
      surface: entry.surface,
      action: entry.action,
      outcome: entry.outcome,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      metadata: entry.metadata as never
    }
  });
}
