"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import { getThreadMessages, markThreadAsRead } from "@/lib/actions/messages";

type Thread = { id: string; updatedAt: Date | string; messages: Array<{id:string;senderId:string;content:string;createdAt:Date|string;readAt?:Date|string|null;sender:{name:string|null;image:string|null}}> };

/** Receipt and timestamp changes come from persisted messages, even when the count is unchanged. */
export function useConversationSync<T extends Thread>(activeId: string | null, sending: boolean, currentUserId: string, setThreads: Dispatch<SetStateAction<T[]>>) {
  useEffect(() => {
    if (!activeId || sending) return;
    let cancelled = false;
    async function refresh() {
      if (document.visibilityState !== "visible") return;
      try {
        let messages = await getThreadMessages(activeId!);
        if (messages.some(message => message.senderId !== currentUserId && !message.readAt)) {
          await markThreadAsRead(activeId!);
          messages = await getThreadMessages(activeId!);
        }
        if (!cancelled) setThreads(threads => threads.map(thread => thread.id === activeId ? {...thread, messages, updatedAt: messages.at(-1)?.createdAt ?? thread.updatedAt} : thread));
      } catch { /* Keep the last loaded conversation available during a connection failure. */ }
    }
    void refresh();
    const interval = setInterval(refresh, 4000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeId, sending, currentUserId, setThreads]);
}
