import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { PhoneInput } from "./phone-input";
import { Progress, ProgressLabel, ProgressValue } from "./progress";
import { StarRating } from "./star-rating";
import { Stepper, StepperContent, StepperIndicator, StepperItem, StepperNav, StepperPanel, StepperTitle, StepperTrigger } from "./stepper";
import { Toaster, toast } from "./toast";

it("star rating: read-only announces the value; editable is a keyboard radio group that submits", () => {
  const { rerender } = render(<StarRating rating={4.6} />);
  expect(screen.getByRole("img", { name: "4.6 out of 5" })).toBeInTheDocument();

  function Editable() {
    const [r, setR] = useState(0);
    return <form><StarRating rating={r} onRatingChange={setR} editable name="rating" label="Your rating" /></form>;
  }
  rerender(<Editable />);
  const group = screen.getByRole("radiogroup", { name: "Your rating" });
  fireEvent.click(screen.getByRole("radio", { name: "3 stars" }));
  expect(screen.getByRole("radio", { name: "3 stars" })).toHaveAttribute("aria-checked", "true");
  fireEvent.keyDown(screen.getByRole("radio", { name: "3 stars" }), { key: "ArrowRight" });
  expect(screen.getByRole("radio", { name: "4 stars" })).toHaveAttribute("aria-checked", "true");
  expect(group.parentElement!.querySelector("input[name=rating]")).toHaveValue("4");
});

it("progress exposes progressbar semantics and an optional label/value header", () => {
  render(<Progress value={40}><ProgressLabel>Uploading</ProgressLabel><ProgressValue /></Progress>);
  const bar = screen.getByRole("progressbar", { name: "Uploading" });
  expect(bar).toHaveAttribute("aria-valuenow", "40");
  expect(screen.getByText("40%")).toBeInTheDocument();
});

const steps = ["Details", "Payment", "Confirm"];
function Steps({ interactive }: { interactive: boolean }) {
  const [v, setV] = useState(2);
  return (
    <Stepper value={v} onValueChange={interactive ? setV : undefined}>
      <StepperNav>{steps.map((s, i) => <StepperItem key={s} step={i + 1}><StepperTrigger><StepperIndicator>{i + 1}</StepperIndicator><StepperTitle>{s}</StepperTitle></StepperTrigger></StepperItem>)}</StepperNav>
      <StepperPanel>{steps.map((s, i) => <StepperContent key={s} value={i + 1}>{s} panel</StepperContent>)}</StepperPanel>
    </Stepper>
  );
}

it("stepper: read-only shows progress without tabs; interactive switches panels", () => {
  const { unmount } = render(<Steps interactive={false} />);
  expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  expect(screen.getByText("Payment").closest("li")).toHaveAttribute("aria-current", "step");
  expect(screen.getByText("Details").closest("li")).toHaveAttribute("data-state", "completed");
  unmount();
  render(<Steps interactive />);
  expect(screen.getByRole("tab", { name: /Payment/ })).toHaveAttribute("aria-selected", "true");
  fireEvent.click(screen.getByRole("tab", { name: /Confirm/ }));
  expect(screen.getByRole("tabpanel")).toHaveTextContent("Confirm panel");
});

it("phone input submits the E.164 value through a hidden field", () => {
  const { container } = render(<form><PhoneInput name="phone" defaultValue="+256772123456" aria-label="Phone" /></form>);
  expect(container.querySelector("input[type=hidden][name=phone]")).toHaveValue("+256772123456");
  expect(screen.getByRole("combobox", { name: "Country calling code" })).toHaveValue("UG");
});

it("toast.add shows a toast with its action; toast.close dismisses it", () => {
  jest.useFakeTimers();
  render(<Toaster />);
  let id = "";
  act(() => { id = toast.add({ title: "Booking request sent", actionProps: { children: "Undo" } }); });
  expect(screen.getByText("Booking request sent")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
  act(() => { toast.close(id); jest.advanceTimersByTime(300); });
  expect(screen.queryByText("Booking request sent")).not.toBeInTheDocument();
  jest.useRealTimers();
});

it("normalises stored phone formats to E.164 and drops unreadable ones", async () => {
  const { toE164 } = await import("./phone-input");
  expect(toE164("0772 123 456")).toBe("+256772123456");
  expect(toE164("256772123456")).toBe("+256772123456");
  expect(toE164("+256 772-123-456")).toBe("+256772123456");
  expect(toE164("00254712345678")).toBe("+254712345678");
  expect(toE164("call me")).toBe("");
  expect(toE164(null)).toBe("");
});

it("phone input loads a local-format saved number as international", () => {
  const { container } = render(<PhoneInput name="phone" defaultValue="0772 123 456" aria-label="Phone" />);
  expect(container.querySelector("input[type=hidden][name=phone]")).toHaveValue("+256772123456");
});

it("a required phone input is invalid until a real number is entered (the +256 prefix alone does not count)", () => {
  const { container } = render(<form><PhoneInput name="phone" required aria-label="Phone" /></form>);
  const box = container.querySelector<HTMLInputElement>("input[type=tel]")!;
  expect(box.value).toMatch(/^\+256/);
  expect(box.validity.valid).toBe(false);
  const { container: filled } = render(<form><PhoneInput name="phone" required defaultValue="+256772123456" aria-label="Phone 2" /></form>);
  expect(filled.querySelector<HTMLInputElement>("input[type=tel]")!.validity.valid).toBe(true);
});
