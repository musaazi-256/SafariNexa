"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Toast with the `toast.add({...})` / `toast.close(id)` API from the pasted example,
 * rendered with Radix Toast. Mount <Toaster /> once (e.g. in a layout) before calling toast.add.
 */
type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  type?: "default" | "success" | "error";
  timeout?: number;
  actionProps?: { children: React.ReactNode; onClick?: () => void };
};
type ToastItem = ToastInput & { id: string; open: boolean };

let items: ToastItem[] = [];
const listeners = new Set<(items: ToastItem[]) => void>();
const emit = () => listeners.forEach((listener) => listener(items));
let counter = 0;

const toast = {
  add(input: ToastInput) {
    const id = `toast-${++counter}`;
    items = [...items, { ...input, id, open: true }];
    emit();
    return id;
  },
  close(id: string) {
    items = items.map((item) => (item.id === id ? { ...item, open: false } : item));
    emit();
    setTimeout(() => { items = items.filter((item) => item.id !== id); emit(); }, 200);
  }
};

function Toaster() {
  const [list, setList] = React.useState<ToastItem[]>(items);
  React.useEffect(() => { listeners.add(setList); return () => { listeners.delete(setList); }; }, []);
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {list.map((item) => (
        <ToastPrimitive.Root
          key={item.id}
          open={item.open}
          duration={item.timeout ?? 5000}
          onOpenChange={(open) => { if (!open) toast.close(item.id); }}
          className={cn(
            "flex w-full items-start gap-3 rounded-2xl border bg-white p-4 shadow-floating data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4",
            item.type === "error" ? "border-destructive/30" : item.type === "success" ? "border-success/30" : "border-border"
          )}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {item.title ? <ToastPrimitive.Title className="text-sm font-semibold">{item.title}</ToastPrimitive.Title> : null}
            {item.description ? <ToastPrimitive.Description className="text-sm text-muted-foreground">{item.description}</ToastPrimitive.Description> : null}
          </div>
          {item.actionProps ? (
            <ToastPrimitive.Action altText={String(item.actionProps.children)} asChild>
              <button type="button" onClick={item.actionProps.onClick} className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary">
                {item.actionProps.children}
              </button>
            </ToastPrimitive.Action>
          ) : null}
          <ToastPrimitive.Close aria-label="Dismiss" className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none" />
    </ToastPrimitive.Provider>
  );
}

export { toast, Toaster };
