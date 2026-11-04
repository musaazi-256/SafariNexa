import { updateBusinessPersonalProfile } from "./business-personal-profile";
import { db } from "@/lib/db";
import { requireBusinessSession } from "@/lib/business";
import { revalidatePath } from "next/cache";

jest.mock("next/cache",()=>({revalidatePath:jest.fn()}));
jest.mock("next/navigation",()=>({redirect:jest.fn((path:string)=>{throw new Error(`redirect:${path}`);})}));
jest.mock("@/lib/business",()=>({requireBusinessSession:jest.fn()}));
jest.mock("@/lib/audit",()=>({logAuditEvent:jest.fn()}));
jest.mock("@/lib/db",()=>({db:{businessUser:{findUnique:jest.fn()},user:{update:jest.fn()}}}));
const mocks=db as unknown as {businessUser:{findUnique:jest.Mock};user:{update:jest.Mock}};
const session={businessId:"business",session:{user:{id:"actor",email:"me@example.test"}}};
function form(){const data=new FormData();data.set("name","  My Name  ");data.set("phone"," +256700000000 ");return data;}
beforeEach(()=>{jest.clearAllMocks();(requireBusinessSession as jest.Mock).mockResolvedValue(session);mocks.businessUser.findUnique.mockResolvedValue({id:"membership"});mocks.user.update.mockResolvedValue({});});
it.each(["OWNER","MANAGER","STAFF"])("allows a %s to update only their own personal account",async role=>{
  mocks.businessUser.findUnique.mockResolvedValue({id:"membership",role});
  const data=form();data.set("userId","another-person");data.set("email","changed@example.test");data.set("role","ADMIN");data.set("businessId","another-business");
  await expect(updateBusinessPersonalProfile({},data)).rejects.toThrow("redirect:/business/profile");
  expect(mocks.businessUser.findUnique).toHaveBeenCalledWith({where:{businessId_userId:{businessId:"business",userId:"actor"}},select:{id:true}});
  expect(mocks.user.update).toHaveBeenCalledWith({where:{id:"actor"},data:{name:"My Name",phone:"+256700000000"}});
  expect(revalidatePath).toHaveBeenCalledWith("/business","layout");expect(revalidatePath).toHaveBeenCalledWith("/profile");
});
it("rejects an account with no business membership",async()=>{
  (requireBusinessSession as jest.Mock).mockResolvedValue({...session,businessId:undefined});
  await expect(updateBusinessPersonalProfile({},form())).rejects.toThrow("membership is required");expect(mocks.user.update).not.toHaveBeenCalled();
});
it("rejects a membership removed after the page was opened",async()=>{
  mocks.businessUser.findUnique.mockResolvedValue(null);
  await expect(updateBusinessPersonalProfile({},form())).rejects.toThrow("membership is required");expect(mocks.user.update).not.toHaveBeenCalled();
});
it.each([["name","   "],["name","n".repeat(101)],["phone","1".repeat(41)]])("reports invalid %s without writing or leaving edit mode",async(key,value)=>{
  const data=form();data.set(key,value);expect(await updateBusinessPersonalProfile({},data)).toHaveProperty("error");expect(mocks.user.update).not.toHaveBeenCalled();
});
it("allows the optional phone number to be cleared",async()=>{
  const data=form();data.set("phone","");await expect(updateBusinessPersonalProfile({},data)).rejects.toThrow("redirect:/business/profile");
  expect(mocks.user.update).toHaveBeenCalledWith({where:{id:"actor"},data:{name:"My Name",phone:null}});
});
