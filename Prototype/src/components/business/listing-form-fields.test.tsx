import {render,screen} from "@testing-library/react";
import "@testing-library/jest-dom";
import {AccommodationTypeFields,TourTypeFields,TransportTypeFields,RestaurantTypeFields} from "./listing-form-fields";
test("editing does not silently replace a previously saved custom tour type",()=>{render(<TourTypeFields initial={{tourType:"Canoe day trip",difficulty:"Custom gentle pace",durationDays:1,groupSizeMin:1,groupSizeMax:6}} guides={[]}/>);expect(screen.getByLabelText(/Safari type/)).toHaveValue("Canoe day trip");expect(screen.getByLabelText(/Difficulty/)).toHaveValue("Custom gentle pace");});
test("editing preserves custom property types and amenities with removable controls",()=>{render(<AccommodationTypeFields initial={{propertyType:"Eco Cottage",amenities:["Lake access","wifi"],maxGuests:2}}/>);expect(screen.getByLabelText(/Property type/)).toHaveValue("Eco Cottage");expect(screen.getByLabelText("Lake access")).toBeChecked();});
test("transport and restaurant legacy option values remain selected",()=>{const view=render(<TransportTypeFields initial={{vehicleType:"Private 4x4",capacity:4}}/>);expect(screen.getByLabelText(/Vehicle type/)).toHaveValue("Private 4x4");view.unmount();render(<RestaurantTypeFields initial={{cuisineType:"Local fusion",priceRange:"UGX 20,000 – 45,000",openingHours:"Daily · 09:00 - 21:00"}}/>);expect(screen.getByRole("checkbox", {name:"Local fusion"})).toBeChecked();expect(screen.getByLabelText(/Price \/ price range/)).toHaveValue("UGX 20,000 – 45,000");});
test("restaurants allow multiple cuisines and manually entered prices",()=>{
 render(<RestaurantTypeFields initial={{cuisineType:"local, indian",priceRange:"UGX 17,500–92,000 per meal"}}/>);
 expect(screen.getByRole("checkbox",{name:"Local Ugandan"})).toBeChecked();
 expect(screen.getByRole("checkbox",{name:"Indian"})).toBeChecked();
 expect(screen.getByRole("checkbox",{name:"Continental"})).not.toBeChecked();
 expect(screen.getByLabelText(/Price \/ price range/)).toHaveValue("UGX 17,500–92,000 per meal");
 expect(screen.getByLabelText(/Price \/ price range/).tagName).toBe("INPUT");
});
test("new restaurant prices and cuisine choices are not preselected",()=>{
 render(<RestaurantTypeFields/>);
 expect(screen.getByLabelText(/Price \/ price range/)).toHaveValue("");
 for(const checkbox of screen.getAllByRole("checkbox").slice(0,4)) expect(checkbox).not.toBeChecked();
});
