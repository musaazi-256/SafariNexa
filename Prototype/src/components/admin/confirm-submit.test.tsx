import { fireEvent, render, screen, within } from "@testing-library/react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "./confirm-submit";

const formStatus = jest.mocked(useFormStatus);
beforeEach(() => formStatus.mockReturnValue({ pending: false, data: null, method: null, action: null }));

function renderForm(onSubmit: (data: FormData) => void, required = false) {
  render(
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const data = new FormData(event.currentTarget);
        if (submitter?.name) data.set(submitter.name, submitter.value);
        onSubmit(data);
      }}
    >
      <textarea name="notes" aria-label="Notes" required={required} defaultValue={required ? "" : "Missing licence"} />
      <ConfirmSubmit
        name="status"
        value="REJECTED"
        title="Reject this submission?"
        description="The business will be told."
        previewField="notes"
        confirmLabel="Reject submission"
        trigger={<Button variant="destructive">Reject</Button>}
      />
    </form>
  );
}

it("asks before submitting, then submits with the chosen decision", () => {
  const onSubmit = jest.fn();
  renderForm(onSubmit);
  fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  expect(onSubmit).not.toHaveBeenCalled();
  const dialog = screen.getByRole("dialog", { name: "Reject this submission?" });
  expect(within(dialog).getByText("Missing licence")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reject submission" }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0][0].get("status")).toBe("REJECTED");
});

it("cancelling does not submit", () => {
  const onSubmit = jest.fn();
  renderForm(onSubmit);
  fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("does not open while required fields are empty", () => {
  const onSubmit = jest.fn();
  renderForm(onSubmit, true);
  fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
