import { render,screen } from "@testing-library/react";
import { PortalSearch } from "./portal-search";
jest.mock("next/navigation",()=>({usePathname:()=>"/business/bookings",useSearchParams:()=>new URLSearchParams("status=confirmed&q=lodge&page=4")}));
it("submits a labelled search with the current status and without stale pagination",()=>{
 render(<PortalSearch label="Search bookings"/>);
 const form=screen.getByRole("search",{name:"Search bookings"}) as HTMLFormElement;
 expect(screen.getByRole("searchbox",{name:"Search bookings"})).toHaveValue("lodge");
 const data=new FormData(form);
 expect(data.get("status")).toBe("confirmed");expect(data.get("q")).toBe("lodge");expect(data.has("page")).toBe(false);
 expect(screen.getByRole("link",{name:"Clear search"})).toHaveAttribute("href","/business/bookings?status=confirmed");
});
