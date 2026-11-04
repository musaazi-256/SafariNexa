import { fireEvent, render, screen } from "@testing-library/react";
import { ConversationMessages, MessageComposer } from "./conversation";

test("read indicators only appear when receipt data is provided", () => {
  const { rerender } = render(<ConversationMessages currentUserId="me" messages={[{id:"1",senderId:"me",content:"Hello",createdAt:"2026-11-03T12:00:00Z"}]} />);
  expect(screen.queryByLabelText("Read")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Sent")).not.toBeInTheDocument();
  rerender(<ConversationMessages currentUserId="me" messages={[{id:"1",senderId:"me",content:"Hello",createdAt:"2026-11-03T12:00:00Z",readAt:"2026-11-03T12:01:00Z"}]} />);
  expect(screen.getByLabelText("Read")).toBeInTheDocument();
});
test("composer retains a failed draft and displays the send error", () => {
  render(<MessageComposer draft="Please help with my booking" onDraftChange={jest.fn()} onSubmit={jest.fn()} error="Your message could not be sent." />);
  expect(screen.getByRole("textbox",{name:"Message"})).toHaveValue("Please help with my booking");
  expect(screen.getByRole("alert")).toHaveTextContent("could not be sent");
});
test("pending sends cannot be submitted again", () => {
  render(<MessageComposer draft="Hello" onDraftChange={jest.fn()} onSubmit={jest.fn()} pending />);
  expect(screen.getByRole("button",{name:"Send message"})).toBeDisabled();
  expect(screen.getByRole("textbox",{name:"Message"})).toBeDisabled();
});

test("a colleague's outgoing reply retains its author without claiming a customer read receipt", () => {
  render(<ConversationMessages currentUserId="me" outgoingSenderIds={["colleague"]} messages={[{id:"1",senderId:"colleague",senderName:"Business colleague",content:"We can help with that.",createdAt:"2026-11-03T12:00:00Z",readAt:"2026-11-03T12:01:00Z"}]} />);
  expect(screen.getByText("Business colleague")).toBeInTheDocument();
  expect(screen.queryByText("You")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Read")).not.toBeInTheDocument();
});
