import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ListingLocationFields } from "./listing-location-fields";
const result = {address:"KFC, Kampala, Uganda",city:"Kampala",latitude:0.35,longitude:32.6};
beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ok:true,json:async()=>({results:[result]})}); });
test("search selection fills coordinates and town while retaining directions", async () => {
  render(<ListingLocationFields initial={{locationDirections:"Opposite KFC"}} />);
  fireEvent.change(screen.getByRole("combobox"), {target:{value:"KFC Kampala"}});
  fireEvent.click(await screen.findByRole("option"));
  expect(screen.getByLabelText("Latitude")).toHaveValue("0.35");
  expect(screen.getByLabelText("Longitude")).toHaveValue("32.6");
  expect(screen.getByLabelText(/City/)).toHaveValue("Kampala");
  expect(screen.getByLabelText(/Directions/)).toHaveValue("Opposite KFC");
  fireEvent.change(screen.getByRole("combobox"), {target:{value:"Jinja"}});
  expect(screen.getByLabelText("Latitude")).toHaveValue("");
});
test("pasted pins auto-fill without selecting a suggestion", async () => {
  render(<ListingLocationFields />);
  fireEvent.change(screen.getByRole("combobox"), {target:{value:"https://maps.google.com/?q=0.35,32.6"}});
  expect(screen.getByLabelText("Latitude")).toHaveValue("0.35");
  await waitFor(() => expect(screen.getByRole("combobox")).toHaveValue(result.address));
});
test("location suggestions can be selected using the keyboard", async () => {
  render(<ListingLocationFields />);
  fireEvent.change(screen.getByRole("combobox"), {target:{value:"KFC Kampala"}});
  await screen.findByRole("option");
  fireEvent.keyDown(screen.getByRole("combobox"), {key:"ArrowDown"});
  fireEvent.keyDown(screen.getByRole("combobox"), {key:"Enter"});
  expect(screen.getByLabelText("Longitude")).toHaveValue("32.6");
});
test("unavailable search gives an error and leaves no stale coordinates", async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ok:false,json:async()=>({error:"Location search is unavailable."})});
  render(<ListingLocationFields initial={result} />);
  fireEvent.change(screen.getByRole("combobox"), {target:{value:"Another location"}});
  expect(await screen.findByText("Location search is unavailable.")).toBeInTheDocument();
  expect(screen.getByLabelText("Latitude")).toHaveValue("");
});
