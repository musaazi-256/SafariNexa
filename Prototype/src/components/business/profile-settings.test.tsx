import * as React from "react";
import { render, screen } from "@testing-library/react";
import BusinessSettingsPage from "@/app/business/(portal)/settings/page";

const mockUpdate = jest.fn();
const mockRedirect = jest.fn((path: string) => { throw new Error(`redirect:${path}`); });
let mockRole = "OWNER";
jest.mock("next/navigation", () => ({ redirect: (path: string) => mockRedirect(path) }));
jest.mock("@/lib/actions/business-settings", () => ({ updateBusinessProfile: (data: FormData) => mockUpdate(data) }));
jest.mock("@/lib/actions/team", () => ({ inviteTeamMember: jest.fn(), cancelInvitation: jest.fn(), removeTeamMember: jest.fn() }));
jest.mock("@/lib/business", () => ({ requireBusinessSession: jest.fn(async () => ({
  businessId: "business", session: {user:{id:"owner"}},
  business: {name:"Nile Lodge",contactEmail:"hello@example.test",contactPhone:"+256700000000",address:"Main Road",city:"Jinja",country:"Uganda",description:"A riverside lodge.",logoUrl:null,coverImageUrl:null,registrationNumber:null,contactName:null,contactRole:null}
})) }));
jest.mock("@/lib/db", () => ({db:{
  customerProfile:{findUnique:jest.fn(async()=>null)},
  businessUser:{findMany:jest.fn(async()=>[{userId:"owner",role:mockRole}])},
  businessInvitation:{findMany:jest.fn(async()=>[])}
}}));
jest.mock("@/components/notifications/notification-preferences-form",()=>({NotificationPreferencesForm:()=>null}));
jest.mock("@/components/ui/image-uploader",()=>({ImageUploader:()=>null}));
beforeEach(()=>{jest.clearAllMocks();mockRole="OWNER";mockUpdate.mockResolvedValue(undefined);});
function formIn(node: React.ReactNode): React.ReactElement<{action:(data:FormData)=>Promise<void>}> | undefined {
  for(const child of React.Children.toArray(node)) {
    if(!React.isValidElement<{children?:React.ReactNode}>(child))continue;
    if(child.type==="form")return child as React.ReactElement<{action:(data:FormData)=>Promise<void>}>;
    const found=formIn(child.props.children);if(found)return found;
  }
}
it("shows saved profile information without editable inputs by default",async()=>{
  const tree=await BusinessSettingsPage({});render(tree);
  expect(screen.getByText("Nile Lodge")).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(formIn(tree)).toBeUndefined();
  expect(screen.getByRole("link",{name:"Edit business profile"})).toHaveAttribute("href","/business/settings?edit=profile");
});
it("opens the form only on explicit edit and provides a cancel destination",async()=>{
  const tree=await BusinessSettingsPage({searchParams:{edit:"profile"}});
  expect(formIn(tree)).toBeDefined();
  function links(node:React.ReactNode):React.ReactElement<{href?:string;children?:React.ReactNode}>[]{return React.Children.toArray(node).flatMap(child=>React.isValidElement<{href?:string;children?:React.ReactNode}>(child)?[child,...links(child.props.children)]:[]);}
  expect(links(tree).some(node=>node.props.href==="/business/settings"&&node.props.children==="Cancel")).toBe(true);
});
it("returns to the read-only view only after a successful save",async()=>{
  const tree=await BusinessSettingsPage({searchParams:{edit:"profile"}}),data=new FormData();
  await expect(formIn(tree)!.props.action(data)).rejects.toThrow("redirect:/business/settings");
  expect(mockUpdate).toHaveBeenCalledWith(data);
  mockRedirect.mockClear();mockUpdate.mockRejectedValueOnce(new Error("Validation failed"));
  await expect(formIn(tree)!.props.action(data)).rejects.toThrow("Validation failed");
  expect(mockRedirect).not.toHaveBeenCalled();
});
it("keeps staff read-only even when the edit URL is entered directly",async()=>{
  mockRole="STAFF";const tree=await BusinessSettingsPage({searchParams:{edit:"profile"}});render(tree);
  expect(formIn(tree)).toBeUndefined();expect(screen.queryByRole("link",{name:"Edit business profile"})).not.toBeInTheDocument();
});
