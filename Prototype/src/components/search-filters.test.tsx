import { fireEvent, render, screen } from "@testing-library/react";
import { SearchFilters } from "./search-filters";
const mockPush=jest.fn();
const params=new URLSearchParams("q=Nile&category=accommodation&amenities=wifi&page=3&sort=rating");
jest.mock("next/navigation",()=>({useRouter:()=>({push:mockPush}),useSearchParams:()=>params}));
beforeEach(()=>mockPush.mockClear());
it("combines marketplace checkbox facets while preserving category, search, and sorting",()=>{
  render(<SearchFilters />);
  expect(screen.getByRole("checkbox",{name:"Wi-Fi"})).toHaveAttribute("aria-checked","true");
  fireEvent.click(screen.getByRole("checkbox",{name:"Swimming pool"}));
  expect(mockPush).toHaveBeenCalledWith("/search?q=Nile&category=accommodation&sort=rating&amenities=wifi&amenities=pool");
});
it("clears facets while retaining travel search context",()=>{
  render(<SearchFilters />);
  fireEvent.click(screen.getByRole("button",{name:"Clear filters"}));
  expect(mockPush).toHaveBeenCalledWith("/search?q=Nile&category=accommodation&sort=rating");
});
