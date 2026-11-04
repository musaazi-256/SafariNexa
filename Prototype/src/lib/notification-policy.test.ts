import { notificationDestination } from "./notification-policy";
const record={userId:"owner",relatedBooking:{id:"booking",customerId:"traveller",businessId:"lodge"}};
it("opens business bookings only for current members",()=>{
 expect(notificationDestination(record,{userId:"owner",surface:"business",businessIds:["lodge"]})).toEqual({href:"/business/bookings/booking",label:"View booking",businessId:"lodge"});
 expect(notificationDestination(record,{userId:"owner",surface:"business",businessIds:[]})).toBeNull();
});
it("keeps a business user's personal bookings in the customer view",()=>{
 expect(notificationDestination({...record,relatedBooking:{...record.relatedBooking,customerId:"owner"}},{userId:"owner",surface:"business",businessIds:["lodge"]})?.href).toBe("/bookings/booking");
});
it("uses the admin route for operational alerts and rejects another recipient",()=>{
 expect(notificationDestination(record,{userId:"owner",surface:"admin",businessIds:[]})?.href).toBe("/admin/bookings/booking");
 expect(notificationDestination(record,{userId:"other",surface:"admin",businessIds:[]})).toBeNull();
});
it("does not invent destinations for generic notifications or another person's case",()=>{
 expect(notificationDestination({userId:"owner"},{userId:"owner",surface:"business",businessIds:[]})).toBeNull();
 expect(notificationDestination({userId:"owner",supportCase:{id:"case",openedByUserId:"other"}},{userId:"owner",surface:"customer",businessIds:[]})).toBeNull();
});

it("routes support-case notifications to the portal the case was opened from", () => {
 const base = { userId: "owner", relatedBooking: null };
 expect(notificationDestination({ ...base, supportCase: { id: "c1", openedByUserId: "owner", surface: "BUSINESS" } }, { userId: "owner", surface: "business", businessIds: ["lodge"] })?.href).toBe("/business/support/c1");
 expect(notificationDestination({ ...base, supportCase: { id: "c2", openedByUserId: "owner", surface: "CUSTOMER" } }, { userId: "owner", surface: "customer", businessIds: [] })?.href).toBe("/support/c2");
 expect(notificationDestination({ ...base, supportCase: { id: "c1", openedByUserId: "owner", surface: "BUSINESS" } }, { userId: "owner", surface: "admin", businessIds: [] })?.href).toBe("/admin/support/c1");
});
