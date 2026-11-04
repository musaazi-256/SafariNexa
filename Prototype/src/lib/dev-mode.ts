/** This repository is a demo by default, including deployed preview builds.
 * Set SAFARINEXA_DEMO_MODE=false explicitly to use live integrations. */
export function isDemoMode() {
  return process.env.SAFARINEXA_DEMO_MODE !== "false";
}

export function isAuthDevMode() {
  return isDemoMode();
}

/**
 * Session-signing secret. Live mode requires AUTH_SECRET. Demo mode falls back
 * to a fixed, public secret so a hosted demo works with no configuration —
 * acceptable only because demo mode already lets anyone sign in as any seeded
 * account, so a forgeable session grants nothing extra.
 */
export const DEMO_AUTH_SECRET = "safarinexa-public-demo-secret-not-for-live-use";

export function getAuthSecret() {
  return process.env.AUTH_SECRET || (isDemoMode() ? DEMO_AUTH_SECRET : undefined);
}
