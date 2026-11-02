import { submitListing, decideListing, withdrawListing } from "./listing-review";
import { db } from "@/lib/db";
import { listingSnapshot } from "@/lib/listing-review";

jest.mock("next/navigation", () => ({redirect: jest.fn((path: string) => {throw new Error(`REDIRECT:${path}`);})}));
jest.mock("next/cache", () => ({revalidatePath: jest.fn()}));
jest.mock("@/lib/admin", () => ({requireAdminSession: jest.fn().mockResolvedValue({user:{id:"admin"}})}));
jest.mock("@/lib/business", () => ({requireBusinessSession: jest.fn().mockResolvedValue({businessId:"business",session:{user:{id:"owner"}}})}));
jest.mock("@/lib/db", () => ({db:{
  $transaction: jest.fn(), listing:{findUnique:jest.fn(),update:jest.fn()},
  listingSubmission:{findFirst:jest.fn(),findUnique:jest.fn(),create:jest.fn(),update:jest.fn(),updateMany:jest.fn()},
  businessUser:{findFirst:jest.fn(),findMany:jest.fn()},notification:{createMany:jest.fn()},auditLog:{create:jest.fn()}
}}));
const mock = db as unknown as {
  $transaction: jest.Mock;
  listing: Record<string,jest.Mock>; listingSubmission: Record<string,jest.Mock>;
  businessUser: Record<string,jest.Mock>; notification: Record<string,jest.Mock>; auditLog: Record<string,jest.Mock>;
};
const listing={id:"listing",businessId:"business",type:"TOUR",status:"DRAFT",title:"Review test tour",description:"A detailed tour description for administrator review.",address:"Main road",city:"Jinja",coverImageUrl:"cover.jpg",images:["gallery.jpg"],basePriceMinor:100000,tour:{groupSizeMax:6},business:{verificationStatus:"APPROVED"}};
function form(decision="APPROVED") {const data=new FormData();data.set("listingId","listing");data.set("submissionId","submission");data.set("decision",decision);data.set("notes","Reviewed the complete submission.");for(const key of ["photos","accuracy","pricing","policies"])data.set(key,"on");return data;}
beforeEach(() => {
 jest.clearAllMocks();mock.$transaction.mockImplementation(fn => fn(mock));
 mock.listing.findUnique.mockResolvedValue(listing);mock.businessUser.findFirst.mockResolvedValue({userId:"owner"});mock.businessUser.findMany.mockResolvedValue([{userId:"owner"}]);mock.listingSubmission.findFirst.mockResolvedValue(null);
 const {business,...content}=listing;void business;
 mock.listingSubmission.findUnique.mockResolvedValue({id:"submission",listingId:"listing",status:"SUBMITTED",snapshot:listingSnapshot(content),listing});
});
test("owner submits immutable content and photo snapshot without publishing",async()=>{
 await expect(submitListing(form())).rejects.toThrow("REDIRECT:");
 expect(mock.listingSubmission.create).toHaveBeenCalledWith({data:expect.objectContaining({listingId:"listing",submittedBy:"owner",snapshot:expect.objectContaining({images:["gallery.jpg"]})})});
 expect(mock.listing.update).not.toHaveBeenCalled();
});
test("unverified businesses cannot submit listings",async()=>{
 mock.listing.findUnique.mockResolvedValue({...listing,business:{verificationStatus:"SUBMITTED"}});
 await expect(submitListing(form())).rejects.toThrow("verification");expect(mock.listingSubmission.create).not.toHaveBeenCalled();
});
test("cross-business submission is denied",async()=>{
 mock.listing.findUnique.mockResolvedValue({...listing,businessId:"other"});
 await expect(submitListing(form())).rejects.toThrow("denied");
});
test("duplicate pending submission is denied",async()=>{
 mock.listingSubmission.findFirst.mockResolvedValue({id:"pending"});
 await expect(submitListing(form())).rejects.toThrow("already");
});
test("admin approval requires the photo checklist",async()=>{
 const data=form();data.delete("photos");await expect(decideListing(data)).rejects.toThrow("every approval check");expect(mock.listing.update).not.toHaveBeenCalled();
});
test("admin approval publishes and returns feedback to actual business members",async()=>{
 await expect(decideListing(form())).rejects.toThrow("REDIRECT:");
 expect(mock.listing.update).toHaveBeenCalledWith({where:{id:"listing"},data:{status:"PUBLISHED",publishedAt:expect.any(Date)}});
 expect(mock.notification.createMany).toHaveBeenCalledWith({data:[expect.objectContaining({userId:"owner",type:"SYSTEM"})]});expect(mock.auditLog.create).toHaveBeenCalled();
});
test("replaced photos invalidate the submitted review",async()=>{
 const current=await mock.listingSubmission.findUnique();mock.listingSubmission.findUnique.mockResolvedValue({...current,listing:{...listing,coverImageUrl:"replacement.jpg"}});
 await expect(decideListing(form())).rejects.toThrow("content changed");expect(mock.listing.update).not.toHaveBeenCalled();
});
test("changes requested and rejected submissions stay unpublished",async()=>{
 for(const decision of ["NEEDS_CHANGES","REJECTED"])await expect(decideListing(form(decision))).rejects.toThrow("REDIRECT:");
 expect(mock.listing.update).not.toHaveBeenCalled();expect(mock.listingSubmission.update).toHaveBeenCalledTimes(2);
});
test("review decision cannot be replayed",async()=>{
 const current=await mock.listingSubmission.findUnique();mock.listingSubmission.findUnique.mockResolvedValue({...current,status:"APPROVED"});
 await expect(decideListing(form())).rejects.toThrow("no longer pending");
});
test("business withdrawal is restricted to its own listings",async()=>{
 await withdrawListing(form());expect(mock.listingSubmission.updateMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({listing:{businessId:"business"}}),data:expect.objectContaining({status:"WITHDRAWN"})}));
});
