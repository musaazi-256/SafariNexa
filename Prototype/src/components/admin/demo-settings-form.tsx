"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Device-local settings preview: never changes the booking ledger or live configuration. */
export function DemoSettingsForm({ storageKey, children }: { storageKey: string; children: ReactNode }) {
  const form = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      for (const input of form.current?.querySelectorAll("input[id]") ?? []) {
        if (input instanceof HTMLInputElement && typeof saved[input.id] === "string") input.value = saved[input.id];
      }
    } catch {
      setMessage("Saved settings could not be loaded. Please save them again.");
    }
  }, [storageKey]);

  return <form ref={form} onSubmit={event => {
    event.preventDefault();
    const values = Object.fromEntries([...event.currentTarget.querySelectorAll("input[id]")].map(input => [input.id, (input as HTMLInputElement).value]));
    try {
      localStorage.setItem(storageKey, JSON.stringify(values));
      setMessage("Settings saved on this device.");
    } catch {
      setMessage("Your browser could not save these settings. Allow local storage and try again.");
    }
  }}>
    {children}
    <p role="status" className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">{message}</p>
  </form>;
}
