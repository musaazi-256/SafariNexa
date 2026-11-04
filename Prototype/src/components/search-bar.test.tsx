import { fireEvent, render, screen } from "@testing-library/react";
import { SearchBar } from "./search-bar";
const mockPush=jest.fn();
const params=new URLSearchParams("category=tours&q=Nile&tourDuration=4-7&tourType=wildlife&page=3&sort=rating");
jest.mock("next/navigation",()=>({useRouter:()=>({push:mockPush}),useSearchParams:()=>params,usePathname:()=>"/search"}));
it("clears tour-only facets when switching marketplace category",()=>{
  render(<SearchBar />);
  fireEvent.click(screen.getByRole("button",{name:"Accommodation"}));
  expect(mockPush).toHaveBeenCalledWith("/search?category=accommodation&q=Nile&sort=rating");
});
