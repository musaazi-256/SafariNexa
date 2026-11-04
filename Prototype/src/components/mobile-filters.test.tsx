import {fireEvent,render,screen,within} from "@testing-library/react";
import { MobileFilters } from "./mobile-filters";
const params=new URLSearchParams("category=accommodation&page=4");const push=jest.fn();
jest.mock("next/navigation",()=>({useSearchParams:()=>params,useRouter:()=>({push})}));
it("keeps mobile filters open for several selections and resets pagination",async()=>{
 render(<MobileFilters/>);fireEvent.click(screen.getByRole("button",{name:"Filters"}));
 const dialog=await screen.findByRole("dialog");
 fireEvent.click(within(dialog).getByRole("checkbox",{name:"Wi-Fi"}));
 expect(screen.getByRole("dialog")).toBeInTheDocument();
 expect(push).toHaveBeenCalledWith("/search?category=accommodation&amenities=wifi");
 fireEvent.click(within(dialog).getByRole("button",{name:"Show results"}));
 expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
