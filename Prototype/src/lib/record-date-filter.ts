export const RECORD_PERIODS = [
  { value: "ALL", label: "Any time" },
  { value: "7d", label: "Past 7 days" },
  { value: "30d", label: "Past 30 days" },
  { value: "90d", label: "Past 90 days" }
];

/** Rolling creation-date window, applied before pagination and facet counts. */
export function recordDateFilter(value?: string, now = new Date()) {
  const days = value === "7d" ? 7 : value === "30d" ? 30 : value === "90d" ? 90 : undefined;
  return days ? { createdAt: { gte: new Date(now.getTime() - days * 86_400_000), lte: now } } : {};
}
