"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageComposer } from "@/components/messages/conversation";

export function SupportReplyForm({ caseId, action }: { caseId: string; action: (formData: FormData) => void | Promise<void> }) {
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return <MessageComposer draft={draft} onDraftChange={setDraft} pending={pending} error={error} placeholder="Type your reply…" onSubmit={async event => {
    event.preventDefault();
    if (!draft.trim() || pending) return;
    setPending(true); setError("");
    const data = new FormData(event.currentTarget); data.set("caseId", caseId);
    try { await action(data); setDraft(""); router.refresh(); }
    catch { setError("Your reply could not be sent. Please try again."); }
    finally { setPending(false); }
  }} />;
}
