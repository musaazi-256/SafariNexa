"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

/** True while the page holds work the user hasn't saved: an edited field, or an element
 * that asks to pause refreshing (data-live-refresh="pause"), such as a review in progress.
 * A refresh re-renders the page and would otherwise throw that work away. */
function hasUnsavedWork() {
  if (document.querySelector('[data-live-refresh="pause"]')) return true;
  return [...document.querySelectorAll("input, textarea, select")].some((el) => {
    if (el instanceof HTMLInputElement) {
      if (el.type === "file") return Boolean(el.files?.length);
      if (["hidden", "submit", "button", "reset", "image"].includes(el.type)) return false;
      if (el.type === "checkbox" || el.type === "radio") return el.checked !== el.defaultChecked;
      return el.value !== el.defaultValue;
    }
    if (el instanceof HTMLTextAreaElement) return el.value !== el.defaultValue;
    if (el instanceof HTMLSelectElement) return [...el.options].some((o) => o.selected !== o.defaultSelected);
    return false;
  });
}

/** Refresh server-backed portal data every minute, skipping while the user has unsaved work on the page. */
export function LiveRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const refresh = () => {
      if (!pending && document.visibilityState === "visible" && navigator.onLine && !hasUnsavedWork()) startTransition(() => router.refresh());
    };
    const timer = setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [router, pending]);
  return null;
}
