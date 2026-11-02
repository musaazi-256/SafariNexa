/**
 * Legacy development flag validator. Authentication always checks existing
 * credentials and roles, even locally. A stale development flag must never
 * be accepted by a production deployment.
 */
export function isAuthDevMode() {
  if (process.env.NODE_ENV === "production" && process.env.AUTH_DEV_MODE === "true") {
    throw new Error("AUTH_DEV_MODE is true in a production environment. This is a critical security risk. Refusing to start.");
  }
  return process.env.AUTH_DEV_MODE === "true";
}
