import { cache } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
export const getSavedCardState = cache(async () => {
  const session = await auth();
  if (!session?.user) return { signedIn: false, ids: [] as string[] };
  const saved = await db.savedItem.findMany({ where: { userId: session.user.id }, select: { listingId: true } });
  return { signedIn: true, ids: saved.map(item => item.listingId) };
});
