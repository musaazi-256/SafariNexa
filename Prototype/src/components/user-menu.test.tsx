import {fireEvent,render,screen} from "@testing-library/react";
import {UserMenu} from "./user-menu";
it("separates the business user's personal profile from the business profile",()=>{
  render(<UserMenu surface="business" name="Alex" />);
  fireEvent.keyDown(screen.getByRole("button",{name:"Account menu"}),{key:"Enter"});
  expect(screen.getByRole("menuitem",{name:"My profile"})).toHaveAttribute("href","/business/profile");
  expect(screen.getByRole("menuitem",{name:"Business profile"})).toHaveAttribute("href","/business/settings");
});
it("keeps the customer profile destination",()=>{
  render(<UserMenu surface="customer" name="Alex" />);
  fireEvent.keyDown(screen.getByRole("button",{name:"Account menu"}),{key:"Enter"});
  expect(screen.getByRole("menuitem",{name:"Profile"})).toHaveAttribute("href","/profile");
});
