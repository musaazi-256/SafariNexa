import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { Card, CardTitle } from "./card";
import { Textarea } from "./textarea";

describe("shared design system contracts", () => {
  it("keeps primary actions solid, keyboard-visible and disabled when requested", () => {
    render(<Button disabled>Save changes</Button>);
    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("bg-primary", "rounded-md", "focus-visible:ring-2");
    expect(button.className).not.toContain("bg-gradient");
  });

  it("retains link semantics for navigation actions", () => {
    render(<Button asChild variant="outline"><a href="/support">Contact support</a></Button>);
    expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute("href", "/support");
  });

  it("uses bordered card surfaces and a consistent form focus treatment", () => {
    const { container } = render(<Card><CardTitle>Details</CardTitle><Textarea aria-label="Notes" /></Card>);
    expect(container.firstChild).toHaveClass("border", "rounded-xl", "shadow-sm");
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveClass("rounded-md", "focus-visible:ring-offset-2");
  });
});
