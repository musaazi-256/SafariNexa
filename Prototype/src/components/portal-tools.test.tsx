import { fireEvent, render, screen } from "@testing-library/react";
import { ReviewSort } from "./portal-tools";
const mockPush = jest.fn();
const params = new URLSearchParams("status=published&q=lodge&page=4");
jest.mock("next/navigation", () => ({ usePathname: () => "/business/reviews", useSearchParams: () => params, useRouter: () => ({ push: mockPush }) }));
beforeAll(()=>{Element.prototype.scrollIntoView=jest.fn();});
it("sorts reviews with the shared Select, preserves facets, and resets the page", () => {
  render(<ReviewSort />);
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Sort reviews" }), { key: "ArrowDown" });
  fireEvent.click(screen.getByRole("option",{name:"Highest rating"}));
  expect(mockPush).toHaveBeenCalledWith("/business/reviews?status=published&q=lodge&sort=highest",{scroll:false});
});
