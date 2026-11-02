"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
/** Refresh server-backed portal data without reloading the page or clearing client forms. */
export function LiveRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    const refresh = () => {
      if (!pending && document.visibilityState === "visible" && navigator.onLine) startTransition(() => router.refresh());
    };
    const timer = setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [router, pending]);
  return null;
}
