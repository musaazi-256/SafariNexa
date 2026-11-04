import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TableColumnLabel } from "./table-column-label";

it("exposes column help on keyboard focus and dismisses it with Escape", async () => {
  render(<TableColumnLabel help="Includes selected add-ons; check payment details for the amount paid.">Total</TableColumnLabel>);
  const trigger = screen.getByRole("button", { name: "About Total" });
  fireEvent.focus(trigger);
  expect(await screen.findByRole("tooltip")).toHaveTextContent("Includes selected add-ons");
  fireEvent.keyDown(trigger, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
});
