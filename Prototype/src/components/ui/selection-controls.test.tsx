import { fireEvent, render, screen } from "@testing-library/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

test("in-page tabs retain tab semantics and switch content without navigating", () => {
  render(<Tabs defaultValue="overview"><TabsList aria-label="Details">
    <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="details">Details</TabsTrigger>
  </TabsList><TabsContent value="overview">Overview content</TabsContent><TabsContent value="details">Details content</TabsContent></Tabs>);
  expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Details" }), { button: 0, ctrlKey: false });
  expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Details content");
});
