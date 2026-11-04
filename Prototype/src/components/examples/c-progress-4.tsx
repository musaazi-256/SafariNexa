"use client";

import { useEffect, useState } from "react";

import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

const status = (p: number) => p < 20 ? "Preparing files…" : p < 60 ? "Uploading documents…" : p < 90 ? "Checking file types…" : p < 100 ? "Saving to private storage…" : "Upload complete";

/** ReUI c-progress-4 · Progress bar with status messages (simulated document upload). */
export function ProgressWithStatus() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setValue((v) => (v >= 100 ? 0 : Math.min(100, v + Math.random() * 3 + 1))), 150);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="w-full max-w-xs space-y-2">
      <Progress value={value}>
        <ProgressLabel>Verification documents</ProgressLabel>
        <ProgressValue />
      </Progress>
      <p className="text-xs text-muted-foreground" aria-live="polite">{status(value)}</p>
    </div>
  );
}
