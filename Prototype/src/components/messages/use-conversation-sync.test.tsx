import { act, renderHook } from "@testing-library/react";
import { useConversationSync } from "./use-conversation-sync";
import { getThreadMessages, markThreadAsRead } from "@/lib/actions/messages";

jest.mock("@/lib/actions/messages", () => ({ getThreadMessages: jest.fn(), markThreadAsRead: jest.fn() }));
const original = { id: "thread", updatedAt: "2026-11-03T12:00:00Z", messages: [{id:"message",senderId:"me",content:"Hello",createdAt:"2026-11-03T12:00:00Z",readAt:null,sender:{name:"Me",image:null}}] };
beforeEach(() => { jest.clearAllMocks(); Object.defineProperty(document,"visibilityState",{configurable:true,value:"visible"}); });

test("refreshes a saved read receipt without requiring another message", async () => {
  const readAt = new Date("2026-11-03T12:01:00Z");
  (getThreadMessages as jest.Mock).mockResolvedValue([{...original.messages[0],readAt}]);
  const setThreads = jest.fn();
  const {unmount} = renderHook(() => useConversationSync("thread",false,"me",setThreads));
  await act(async () => { await Promise.resolve(); });
  const refreshed = setThreads.mock.calls[0][0]([original]);
  expect(refreshed[0].messages).toHaveLength(1);
  expect(refreshed[0].messages[0].readAt).toEqual(readAt);
  expect(markThreadAsRead).not.toHaveBeenCalled();
  unmount();
});

test("a failed read-receipt save does not invent a read timestamp", async () => {
  (getThreadMessages as jest.Mock).mockResolvedValue([{...original.messages[0],senderId:"other"}]);
  (markThreadAsRead as jest.Mock).mockRejectedValue(new Error("Offline"));
  const setThreads = jest.fn();
  const {unmount} = renderHook(() => useConversationSync("thread",false,"me",setThreads));
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  expect(setThreads).not.toHaveBeenCalled();
  unmount();
});
