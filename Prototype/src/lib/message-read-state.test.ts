import {projectMessageReadState} from "./message-read-state";
describe("Per-user message read state",()=>{
 const date=new Date("2026-11-01");
 const message={senderId:"customer",readReceipts:[{userId:"staff-a",readAt:date}]};
 it("does not clear staff B when staff A reads",()=>expect(projectMessageReadState([message],"staff-b","customer")[0].readAt).toBeNull());
 it("retains staff A's own receipt",()=>expect(projectMessageReadState([message],"staff-a","customer")[0].readAt).toBe(date));
 it("shows the customer that a business reader read their message",()=>expect(projectMessageReadState([message],"customer","customer")[0].readAt).toBe(date));
 it("does not mistake a colleague for the customer recipient",()=>expect(projectMessageReadState([{senderId:"staff-a",readReceipts:[{userId:"staff-b",readAt:date}]}],"staff-a","customer")[0].readAt).toBeNull());
});
