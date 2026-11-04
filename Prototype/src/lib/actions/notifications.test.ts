/** @jest-environment node */
import { markNotificationRead,markAllNotificationsRead,openNotification,saveNotificationPreferences } from "./notifications";
import { db } from "@/lib/db";
import { setActiveBusiness } from "./business";
import { revalidatePath } from "next/cache";
jest.mock("@/auth",()=>({auth:jest.fn(async()=>({user:{id:"owner"}}))}));
jest.mock("@/lib/admin",()=>({requireAdminSession:jest.fn(async()=>({user:{id:"admin"}}))}));
jest.mock("next/navigation",()=>({redirect:jest.fn((path)=>{throw new Error(`REDIRECT:${path}`);})}));
jest.mock("next/cache",()=>({revalidatePath:jest.fn()}));
jest.mock("./business",()=>({setActiveBusiness:jest.fn()}));
jest.mock("@/lib/db",()=>({db:{notification:{findFirst:jest.fn(),updateMany:jest.fn()},businessUser:{findMany:jest.fn()},customerProfile:{upsert:jest.fn()}}}));
const mock=db as unknown as {notification:Record<string,jest.Mock>;businessUser:Record<string,jest.Mock>;customerProfile:Record<string,jest.Mock>};
function form(surface="business"){const fd=new FormData();fd.set("surface",surface);fd.set("notificationId","notice");return fd;}
beforeEach(()=>{jest.clearAllMocks();mock.businessUser.findMany.mockResolvedValue([{businessId:"lodge"}]);});
it("scopes read changes to the signed-in recipient and refreshes unread badges",async()=>{
 await markNotificationRead(form());
 expect(mock.notification.updateMany).toHaveBeenCalledWith({where:{id:"notice",userId:"owner"},data:{isRead:true}});
 expect(revalidatePath).toHaveBeenCalledWith("/","layout");
});
it("marks all categories read for the authenticated admin, never another account",async()=>{
 await markAllNotificationsRead(form("admin"));
 expect(mock.notification.updateMany).toHaveBeenCalledWith({where:{userId:"admin",isRead:false},data:{isRead:true}});
});
it("selects an accessible business before opening its booking",async()=>{
 mock.notification.findFirst.mockResolvedValue({id:"notice",userId:"owner",relatedBooking:{id:"booking",customerId:"traveller",businessId:"lodge"}});
 await expect(openNotification(form())).rejects.toThrow("REDIRECT:/business/bookings/booking");
 expect(mock.notification.findFirst).toHaveBeenCalledWith(expect.objectContaining({where:{id:"notice",userId:"owner"}}));
 expect(setActiveBusiness).toHaveBeenCalledWith("lodge");
});
it("does not switch business or expose a missing or foreign notice",async()=>{
 mock.notification.findFirst.mockResolvedValue(null);
 await expect(openNotification(form())).rejects.toThrow("REDIRECT:/business/notifications");
 expect(setActiveBusiness).not.toHaveBeenCalled();expect(mock.notification.updateMany).not.toHaveBeenCalled();
});

it("saves real account categories without overwriting traveller defaults",async()=>{
 const data=form();data.set("notify_BOOKING_UPDATE","on");
 await expect(saveNotificationPreferences({message:""},data)).resolves.toEqual({message:"Notification categories saved to your account."});
 expect(mock.customerProfile.upsert).toHaveBeenCalledWith({where:{userId:"owner"},update:{preferences:{notify:expect.objectContaining({BOOKING_UPDATE:true,PAYMENT_UPDATE:false})}},create:{userId:"owner",preferences:{notify:expect.any(Object)}}});
});
it("shows an error when categories cannot be persisted",async()=>{
 mock.customerProfile.upsert.mockRejectedValueOnce(new Error("Database unavailable"));
 await expect(saveNotificationPreferences({message:""},form())).resolves.toEqual({message:"Your categories could not be saved. Please try again.",error:true});
});
