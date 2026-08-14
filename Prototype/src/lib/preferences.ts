import type { NotificationType } from "@prisma/client";

export const NOTIFICATION_TYPES: NotificationType[] = [
  "BOOKING_UPDATE",
  "PAYMENT_UPDATE",
  "REVIEW_PROMPT",
  "SUPPORT_UPDATE",
  "SAFETY_ADVISORY",
  "SYSTEM"
];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  BOOKING_UPDATE: "Booking updates",
  PAYMENT_UPDATE: "Payment updates",
  REVIEW_PROMPT: "Review prompts",
  SUPPORT_UPDATE: "Support updates",
  SAFETY_ADVISORY: "Safety advisories",
  SYSTEM: "System announcements"
};

export type NotificationPreferences = Record<NotificationType, boolean>;

export type CustomerPreferences = {
  notify: NotificationPreferences;
};

export function defaultPreferences(): CustomerPreferences {
  return {
    notify: Object.fromEntries(NOTIFICATION_TYPES.map((type) => [type, true])) as NotificationPreferences
  };
}

/** CustomerProfile.preferences is a loosely-typed Json column — this fills in any
 * missing keys against the default so older or never-set rows still round-trip safely. */
export function parsePreferences(json: unknown): CustomerPreferences {
  const defaults = defaultPreferences();
  if (!json || typeof json !== "object") return defaults;

  const raw = json as { notify?: Partial<NotificationPreferences> };
  return { notify: { ...defaults.notify, ...raw.notify } };
}
