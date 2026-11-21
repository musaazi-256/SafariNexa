// npm run capture: refreshes the Figma handoff from the running app in one go.
// Starts `next dev` if nothing answers on CAPTURE_BASE (default :3000), captures
// every page, tab, dialog and menu of the admin portal, business portal and customer
// website, replays the documented journeys, rebuilds the three bundles the Figma
// plugins load from GitHub main, then records which UI code was captured
// (checked by src/capture-fresh.test.ts).
// Capturing creates demo bookings and payments in the local database.
import { spawn, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { APP, BASE, HANDOFF, PORTALS } from "./config.mjs";

const { uiFingerprint } = createRequire(import.meta.url)("./fingerprint.cjs");
const up = async () => {
  try {
    await fetch(BASE + "/api/health", { signal: AbortSignal.timeout(5000) });
    return true;
  } catch {
    return false;
  }
};

let server = null;
if (!(await up())) {
  console.log("• Starting the app (npm run dev)");
  server = spawn("npm", ["run", "dev"], { cwd: APP, stdio: "ignore", detached: true });
  const deadline = Date.now() + 180000;
  while (!(await up())) {
    if (Date.now() > deadline) throw new Error("The app did not start on " + BASE);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

const node = (...args) => spawnSync(process.execPath, args, { cwd: APP, stdio: "inherit" }).status;
let status = 0;
try {
  for (const portal of Object.keys(PORTALS)) {
    console.log(`\n▶ Capturing the ${portal} screens`);
    status ||= node("scripts/capture/run.mjs", portal);
  }
  console.log("\n▶ Replaying the journeys");
  status ||= node("scripts/capture/journeys.mjs");
  console.log("\n▶ Capturing customer phone and tablet screens and journeys");
  status ||= node("scripts/capture/responsive.mjs");
  console.log("\n▶ Building the Figma bundles");
  status ||= node("scripts/capture/bundle.mjs");
  if (!status) writeFileSync(HANDOFF + "source.json", JSON.stringify({ fingerprint: uiFingerprint(), capturedAt: new Date().toISOString() }, null, 1) + "\n");
} finally {
  if (server) process.kill(-server.pid);
}
console.log(status ? "\nCapture finished with errors (see above)." : "\nCaptures are up to date. Commit design/handoff and push to main, then run each plugin in Figma.");
process.exit(status);
