import { fireEvent, render, screen } from "@testing-library/react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

const formStatus = jest.mocked(useFormStatus);
beforeEach(() => formStatus.mockReturnValue({ pending: false, data: null, method: null, action: null }));

it("blocks disabled navigation actions and removes them from the tab sequence", () => {
  const onClick = jest.fn();
  render(<Button asChild disabled><a href="/support" onClick={onClick}>Contact support</a></Button>);
  const link = screen.getByRole("link", { name: "Contact support" });
  expect(link).toHaveAttribute("aria-disabled", "true");
  expect(link).toHaveAttribute("tabindex", "-1");
  fireEvent.click(link);
  expect(onClick).not.toHaveBeenCalled();
});

it("keeps the action name while busy and blocks repeat submission", () => {
  const onClick = jest.fn();
  render(<Button loading loadingText="Saving changes…" onClick={onClick}>Save changes</Button>);
  const button = screen.getByRole("button", { name: "Saving changes…" });
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
  fireEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
});

it("locks sibling decisions while only marking the submitted decision busy", () => {
  const data = new FormData(); data.set("decision", "APPROVED");
  formStatus.mockReturnValue({ pending: true, data, method: "post", action: "/review" });
  render(<><Button name="decision" value="APPROVED">Approve</Button><Button name="decision" value="REJECTED">Reject</Button><Button type="button">Help</Button></>);
  expect(screen.getByRole("button", { name: "Approve" })).toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("button", { name: "Approve" })).toHaveAttribute("value", "APPROVED");
  expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Reject" })).not.toHaveAttribute("aria-busy");
  expect(screen.getByRole("button", { name: "Help" })).toBeEnabled();
});
