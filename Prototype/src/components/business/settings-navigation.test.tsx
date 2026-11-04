import { render, screen } from "@testing-library/react";
import { BusinessSettingsNavigation } from "./settings-navigation";
let mockPath = "/business/settings";
let mockParams = new URLSearchParams();
jest.mock("next/navigation", () => ({ usePathname: () => mockPath, useSearchParams: () => mockParams }));
beforeEach(() => { mockPath = "/business/settings"; mockParams = new URLSearchParams(); });

test("verification retains settings navigation and one active destination", () => {
  mockPath = "/business/settings/verification";
  render(<BusinessSettingsNavigation />);
  expect(screen.getByRole("link", { name: "Verification & documents" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Business profile" })).toHaveAttribute("href", "/business/settings");
  expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
});

test("URL changes restore the selected settings section", () => {
  mockParams = new URLSearchParams("tab=team");
  const { rerender } = render(<BusinessSettingsNavigation />);
  expect(screen.getByRole("link", { name: "Staff access" })).toHaveAttribute("aria-current", "page");
  mockParams = new URLSearchParams("tab=notifications");
  rerender(<BusinessSettingsNavigation />);
  expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Staff access" })).not.toHaveAttribute("aria-current");
});

test("old staff query links still select Staff access", () => {
  mockParams = new URLSearchParams("tab=staff");
  render(<BusinessSettingsNavigation />);
  expect(screen.getByRole("link", { name: "Staff access" })).toHaveAttribute("aria-current", "page");
});
