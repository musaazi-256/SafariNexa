/** @jest-environment node */
import { GET } from "./route";
import { auth } from "@/auth";
import { db } from "@/lib/db";
jest.mock("@/auth",()=>({auth:jest.fn()}));
jest.mock("fs/promises",()=>({__esModule:true,default:{readFile:jest.fn().mockResolvedValue(Buffer.from("synthetic image bytes"))}}));
jest.mock("@/lib/db",()=>({db:{businessProfile:{findFirst:jest.fn()},listing:{findFirst:jest.fn()},listingImageUpload:{findUnique:jest.fn()},adminUser:{findFirst:jest.fn()}}}));
const mock=db as unknown as {businessProfile:{findFirst:jest.Mock};listing:{findFirst:jest.Mock};listingImageUpload:{findUnique:jest.Mock};adminUser:{findFirst:jest.Mock}};
const filename="00000000-0000-4000-8000-000000000000.png";
const request=()=>GET(new Request(`http://localhost:3002/api/images/${filename}`),{params:{filename}});
beforeEach(()=>{jest.clearAllMocks();mock.businessProfile.findFirst.mockResolvedValue(null);mock.listing.findFirst.mockResolvedValue(null);mock.listingImageUpload.findUnique.mockResolvedValue(null);mock.adminUser.findFirst.mockResolvedValue(null);(auth as jest.Mock).mockResolvedValue(null);});
test("anonymous visitors cannot access an unpublished photo",async()=>{expect((await request()).status).toBe(404);});
test("photo uploader can preview an unpublished photo",async()=>{
 (auth as jest.Mock).mockResolvedValue({user:{id:"owner"}});mock.listingImageUpload.findUnique.mockResolvedValue({uploadedBy:"owner"});
 const response=await request();expect(response.status).toBe(200);expect(response.headers.get("cache-control")).toBe("private, no-store");
});
test("another signed-in user cannot view an unpublished upload",async()=>{
 (auth as jest.Mock).mockResolvedValue({user:{id:"other"}});mock.listingImageUpload.findUnique.mockResolvedValue({uploadedBy:"owner"});expect((await request()).status).toBe(404);
});
test("active admin can inspect photos before publication",async()=>{
 (auth as jest.Mock).mockResolvedValue({user:{id:"admin",isAdmin:true}});mock.adminUser.findFirst.mockResolvedValue({status:"ACTIVE"});expect((await request()).status).toBe(200);
});
test("published cover, gallery and room photo references are eligible for public display",async()=>{
 mock.listing.findFirst.mockResolvedValueOnce({id:"published"});expect((await request()).status).toBe(200);
 expect(mock.listing.findFirst).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({status:"PUBLISHED",OR:expect.arrayContaining([{coverImageUrl:`/api/images/${filename}`},{images:{has:`/api/images/${filename}`}},{accommodation:{roomTypes:{some:{images:{has:`/api/images/${filename}`}}}}}])})}));
});
test("invalid image filenames are rejected before accessing storage",async()=>{
 expect((await GET(new Request("http://localhost:3002"),{params:{filename:"../private.pdf"}})).status).toBe(404);expect(mock.listing.findFirst).not.toHaveBeenCalled();
});

test("approved business logos can appear in public profile and conversation surfaces",async()=>{mock.businessProfile.findFirst.mockResolvedValueOnce({id:"business"});expect((await request()).status).toBe(200);});
test("a business member can view its unpublished branding",async()=>{(auth as jest.Mock).mockResolvedValue({user:{id:"staff"}});mock.businessProfile.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({id:"own-business"});expect((await request()).status).toBe(200);});
