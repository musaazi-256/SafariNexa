import {render,screen} from "@testing-library/react";
import BusinessPersonalProfilePage from "@/app/business/(portal)/profile/page";
let mockRole="STAFF";
const mockForm=jest.fn();
jest.mock("next/navigation",()=>({redirect:jest.fn((path:string)=>{throw new Error(`redirect:${path}`);})}));
jest.mock("@/lib/business",()=>({requireBusinessSession:jest.fn(async()=>({session:{user:{id:"me"}},businessId:"business",business:{name:"Nile Lodge"},account:{id:"me",name:"Alex Person",email:"alex@example.test",phone:"+256700000000",image:null}}))}));
jest.mock("@/lib/db",()=>({db:{businessUser:{findUnique:jest.fn(async()=>({role:mockRole}))}}}));
jest.mock("@/lib/actions/business-personal-profile",()=>({updateBusinessPersonalProfile:jest.fn()}));
jest.mock("./personal-profile-form",()=>({PersonalProfileForm:(props:unknown)=>{mockForm(props);return <form aria-label="Personal profile form"/>;}}));
beforeEach(()=>{mockRole="STAFF";mockForm.mockClear();});
it("shows a personal profile instead of redirecting to business settings",async()=>{
  render(await BusinessPersonalProfilePage({}));
  expect(screen.getByRole("heading",{name:"My profile"})).toBeInTheDocument();
  expect(screen.getByText("alex@example.test")).toBeInTheDocument();expect(screen.getByText("Staff · Nile Lodge")).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(screen.getByRole("link",{name:"Edit profile"})).toHaveAttribute("href","/business/profile?edit=profile");
  expect(screen.getByRole("link",{name:"Business settings"})).toHaveAttribute("href","/business/settings");
});
it.each(["OWNER","MANAGER","STAFF"])("a %s can explicitly open their personal edit form",async role=>{
  mockRole=role;render(await BusinessPersonalProfilePage({searchParams:{edit:"profile"}}));
  expect(mockForm).toHaveBeenCalledWith(expect.objectContaining({name:"Alex Person",email:"alex@example.test",phone:"+256700000000"}));
  expect(screen.queryByRole("link",{name:"Edit profile"})).not.toBeInTheDocument();
});
