import { fireEvent, render, screen } from "@testing-library/react";
import { RecordFilter } from "./record-filter";
import { ResetRecordFilters } from "./reset-record-filters";

const mockPush = jest.fn();
let mockParams = new URLSearchParams();
jest.mock("next/navigation", () => ({
  usePathname: () => "/business/bookings",
  useSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush })
}));
const options = [{ value: "ALL", label: "All bookings", count: 20 }, { value: "PAYMENT_FAILED", label: "Payment failed", count: 2 }];
beforeEach(() => { mockPush.mockClear(); mockParams = new URLSearchParams("q=Nile+%26+Crater&status=confirmed&period=30d&sort=newest&page=4"); });
function open() { fireEvent.keyDown(screen.getByRole("button",{name:/Booking status:/}),{key:"Enter"}); }

test("a keyboard-operable filter changes only its own facet and resets pagination", () => {
  render(<RecordFilter label="Booking status" name="status" value="ALL" options={options} />);
  open();
  fireEvent.click(screen.getByRole("menuitemradio",{name:"Payment failed 2"}));
  expect(mockPush).toHaveBeenCalledWith("/business/bookings?q=Nile+%26+Crater&status=PAYMENT_FAILED&period=30d&sort=newest",{scroll:false});
});

test("All clears only status and keeps the selected item exposed to assistive technology", () => {
  render(<RecordFilter label="Booking status" name="status" value="PAYMENT_FAILED" options={options} />);
  open();
  expect(screen.getByRole("menuitemradio",{name:"Payment failed 2"})).toHaveAttribute("aria-checked","true");
  fireEvent.click(screen.getByRole("menuitemradio",{name:"All bookings 20"}));
  expect(mockPush).toHaveBeenCalledWith("/business/bookings?q=Nile+%26+Crater&period=30d&sort=newest",{scroll:false});
});

test("queues whose default is Submitted encode All explicitly", () => {
  render(<RecordFilter label="Booking status" name="status" value="PAYMENT_FAILED" options={options} defaultParamValue="all" />);
  open();
  fireEvent.click(screen.getByRole("menuitem",{name:"Reset booking status"}));
  expect(mockPush).toHaveBeenCalledWith("/business/bookings?q=Nile+%26+Crater&status=all&period=30d&sort=newest",{scroll:false});
});

test("reset all facets preserves search and sorting", () => {
  render(<ResetRecordFilters />);
  fireEvent.click(screen.getByRole("button",{name:"Reset filters"}));
  expect(mockPush).toHaveBeenCalledWith("/business/bookings?q=Nile+%26+Crater&sort=newest",{scroll:false});
});

test("restricted queue defaults remain visibly labelled",()=>{
  render(<RecordFilter label="Review stage" name="status" value="SUBMITTED" defaultValue="SUBMITTED" options={[{value:"SUBMITTED",label:"Submitted"},{value:"APPROVED",label:"Approved"}]} />);
  expect(screen.getByRole("button",{name:"Review stage: Submitted"})).toHaveTextContent("Submitted");
});
