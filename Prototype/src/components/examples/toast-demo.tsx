"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/** Toast demo with an Undo action. Requires <Toaster /> mounted on the page or layout. */
export function ToastDemo() {
  function showToast() {
    const id = toast.add({
      title: "Booking request sent",
      description: "Murchison River Lodge · 9–11 Nov 2026",
      actionProps: { children: "Undo", onClick() { toast.close(id); } }
    });
  }
  return <Button variant="outline" onClick={showToast}>Show toast</Button>;
}
