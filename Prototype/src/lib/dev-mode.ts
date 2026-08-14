/**
 * When AUTH_DEV_MODE=true, the Credentials providers in src/auth.ts accept
 * any email/password (creating a User on the fly if needed) instead of
 * checking a real password hash. Lets you click through every surface
 * without configuring Google OAuth or hand-seeding accounts. Never enable
 * this in production — it is intentionally opt-in via an explicit env var
 * rather than NODE_ENV, so a forgotten `.env` doesn't silently disable auth
 * checks on a real deployment.
 */
export function isAuthDevMode() {
  if (process.env.NODE_ENV === "production" && process.env.AUTH_DEV_MODE === "true") {
    throw new Error("AUTH_DEV_MODE is true in a production environment. This is a critical security risk. Refusing to start.");
  }
  return process.env.AUTH_DEV_MODE === "true";
}
