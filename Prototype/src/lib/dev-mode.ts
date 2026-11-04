/** This repository is a demo by default, including deployed preview builds.
 * Set SAFARINEXA_DEMO_MODE=false explicitly to use live integrations. */
export function isDemoMode() {
  return process.env.SAFARINEXA_DEMO_MODE !== "false";
}

export function isAuthDevMode() {
  return isDemoMode();
}
