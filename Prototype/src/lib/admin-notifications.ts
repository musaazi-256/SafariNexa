import type { Prisma } from "@prisma/client";

type AdminNotificationStore = Pick<Prisma.TransactionClient,"adminUser"|"notification">;
/** Deliver only to active administrators with the capability to handle the event. */
export async function adminNotificationData(store: AdminNotificationStore, permission: string, data: Omit<Prisma.NotificationCreateManyInput,"userId">, actorId?: string) {
  const recipients=await store.adminUser.findMany({where:{status:"ACTIVE",role:{OR:[{name:"Super Admin"},{permissions:{some:{permission:{key:permission}}}}]}},select:{userId:true}});
  return [...new Set(recipients.map(recipient=>recipient.userId))].filter(id=>id!==actorId).map(userId=>({...data,userId}));
}
export async function notifyAdmins(store: AdminNotificationStore, permission: string, data: Omit<Prisma.NotificationCreateManyInput,"userId">, actorId?: string) {
  const notifications=await adminNotificationData(store,permission,data,actorId);
  if(notifications.length) await store.notification.createMany({data:notifications});
}
