import { fireEvent,render,screen,within } from "@testing-library/react";
import { PortalFilter } from "./portal-tools";
const params=new URLSearchParams("status=confirmed&q=lodge&page=4");
jest.mock("next/navigation",()=>({usePathname:()=>"/business/bookings",useSearchParams:()=>params,useRouter:()=>({push:jest.fn()})}));
it("exposes real list filters in a keyboard-dismissable dialog",async()=>{
 render(<PortalFilter/>);
 fireEvent.click(screen.getByRole("button",{name:/Filters/}));
 const dialog=await screen.findByRole("dialog",{name:"Filter records"});
 expect(within(dialog).getByRole("combobox",{name:"Booking status"})).toHaveValue("confirmed");
 expect(within(dialog).getByRole("searchbox",{name:"Search records"})).toHaveValue("lodge");
 expect(dialog.querySelector('input[name="page"]')).toBeNull();
 fireEvent.keyDown(dialog,{key:"Escape"});
 expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
