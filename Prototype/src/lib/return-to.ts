/**
 * Guest users can browse everything; only a handful of "protected actions"
 * (book, pay, save, message, review, manage bookings, ...) require an
 * account. When a guest hits one of those, we route them to auth with the
 * exact path they came from as `returnTo`, and resume there after auth
 * succeeds instead of dropping them on a generic dashboard.
 */
export function safeReturnTo(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  // Only allow same-origin relative paths — never redirect off SafariNexa.
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
