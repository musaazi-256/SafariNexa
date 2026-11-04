import { adminNotificationData,notifyAdmins } from "./admin-notifications";
import type { Prisma } from "@prisma/client";
const store={adminUser:{findMany:jest.fn()},notification:{createMany:jest.fn()}};
beforeEach(()=>jest.clearAllMocks());
it("targets only active admins with the matching capability and deduplicates recipients",async()=>{
 store.adminUser.findMany.mockResolvedValue([{userId:"support"},{userId:"support"},{userId:"actor"}]);
 const data=await adminNotificationData(store as unknown as Prisma.TransactionClient,"support.manage",{type:"SUPPORT_UPDATE",title:"New support case",body:"A case was opened."},"actor");
 expect(data).toEqual([expect.objectContaining({userId:"support",type:"SUPPORT_UPDATE"})]);
 expect(store.adminUser.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{status:"ACTIVE",role:{OR:[{name:"Super Admin"},{permissions:{some:{permission:{key:"support.manage"}}}}]}}}));
});
it("does not create phantom alerts when no eligible admin exists",async()=>{
 store.adminUser.findMany.mockResolvedValue([]);
 await notifyAdmins(store as unknown as Prisma.TransactionClient,"businesses.manage",{type:"SYSTEM",title:"Submission received",body:"Review the queue."});
 expect(store.notification.createMany).not.toHaveBeenCalled();
});
