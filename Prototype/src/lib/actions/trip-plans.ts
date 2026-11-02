"use server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
const schema = z.object({
  id: z.string().optional(), title: z.string().trim().min(1).max(120),
  items: z.array(z.object({ customLabel: z.string().trim().min(1).max(300), date: z.string().optional(), notes: z.string().max(2000).optional() })).max(100)
});
export async function saveTripPlan(input: z.infer<typeof schema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Sign in to save your itinerary.");
  const data = schema.parse(input);
  const items = data.items.map((item,position) => {
    const date = item.date ? new Date(item.date) : null;
    if (date && Number.isNaN(date.getTime())) throw new Error("Invalid itinerary date");
    return { customLabel: item.customLabel, date, notes: item.notes, position };
  });
  const plan = await db.$transaction(async tx => {
    if (data.id) {
      const existing = await tx.tripPlan.findUnique({ where: { id: data.id } });
      if (!existing || existing.userId !== session.user.id) throw new Error("Itinerary not found.");
      await tx.tripPlanItem.deleteMany({ where: { tripPlanId: data.id } });
      return tx.tripPlan.update({ where: { id: data.id }, data: { title: data.title, items: { create: items } } });
    }
    return tx.tripPlan.create({ data: { userId: session.user.id, title: data.title, items: { create: items } } });
  });
  revalidatePath("/trip-planner");
  revalidatePath(`/trip-planner/${plan.id}`);
  return plan.id;
}
