import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { EditCartItemModal } from "./edit-cart-item-modal";
import { useCartStore, type CartItem } from "@/lib/cart";

const base: CartItem = { id: "demo", listingId: "listing", title: "Demo service", type: "restaurant", participants: 2, addOnIds: [], startDate: "2099-11-19", endDate: "2099-11-19", time: "18:00", unitPriceMinor: 40000, totalMinor: 0 };

afterEach(() => { cleanup(); useCartStore.setState({ items: [] }); });

function edit(item: CartItem) {
  useCartStore.setState({ items: [item] });
  render(<EditCartItemModal item={item} isOpen onClose={jest.fn()} />);
}

test("editing a restaurant party size keeps the reservation free", () => {
  edit(base);
  fireEvent.change(screen.getByRole("combobox", { name: "Guests / Participants" }), { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(useCartStore.getState().items[0]).toMatchObject({ participants: 4, totalMinor: 0 });
});

test("extending accommodation preserves selected nightly add-ons in the estimate", () => {
  edit({ ...base, type: "accommodation", time: undefined, endDate: "2099-11-21", unitPriceMinor: 100000, totalMinor: 240000, addOnIds: ["breakfast"], roomTypeName: "Standard" });
  fireEvent.click(screen.getByTitle("Add 1 night"));
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(useCartStore.getState().items[0]).toMatchObject({ endDate: "2099-11-22", totalMinor: 360000, addOnIds: ["breakfast"] });
});

test("fixed-fare transport does not multiply the fare by passengers", () => {
  edit({ ...base, type: "transport", pricingBasis: "fixed", unitPriceMinor: 120000, totalMinor: 120000 });
  fireEvent.change(screen.getByRole("combobox", { name: "Guests / Participants" }), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(useCartStore.getState().items[0].totalMinor).toBe(120000);
});

test("invalid accommodation dates cannot be saved", () => {
  edit({ ...base, type: "accommodation", time: undefined, endDate: "2099-11-18" });
  expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
});
