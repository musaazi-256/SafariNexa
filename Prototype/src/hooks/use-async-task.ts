"use client";

import { useCallback, useRef, useState } from "react";

/** Keep controls busy for the complete request, including awaited work. */
export function useAsyncTask() {
  const [pending, setPending] = useState(false);
  const running = useRef(false);
  const run = useCallback(async (task: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setPending(true);
    try { await task(); }
    finally { running.current = false; setPending(false); }
  }, []);
  return [pending, run] as const;
}
