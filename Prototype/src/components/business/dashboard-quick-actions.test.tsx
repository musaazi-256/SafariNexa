import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { DashboardQuickActions } from "./dashboard-quick-actions";

jest.mock("./verification-modals", () => ({ VerificationActionModal: () => null }));

describe("business dashboard shortcuts", () => {
  it("routes the calendar shortcut to the actual calendar", () => {
    render(<DashboardQuickActions verificationStatus="APPROVED" />);
    expect(screen.getByRole("link", { name: "Booking calendar" })).toHaveAttribute("href", "/business/bookings/calendar");
    expect(screen.getByRole("link", { name: "Add a listing" })).toHaveAttribute("href", "/business/listings/new");
    expect(screen.getByRole("link", { name: "Respond to reviews" })).toHaveAttribute("href", "/business/reviews");
    expect(screen.getByRole("link", { name: "Payments & refunds" })).toHaveAttribute("href", "/business/payments");
    expect(screen.getByRole("link", { name: "Business settings" })).toHaveAttribute("href", "/business/settings");
  });

  it("does not present unavailable promotional or download actions", () => {
    render(<DashboardQuickActions verificationStatus="PENDING" />);
    expect(screen.queryByText("Create promotion")).not.toBeInTheDocument();
    expect(screen.queryByText("Download report")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Booking calendar" })).toBeVisible();
  });
});
