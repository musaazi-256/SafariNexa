// Read-only inventory of the frames and journeys the generated plugins can load.
// Usage: node scripts/capture/audit.mjs [--strict]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { HANDOFF, PORTALS } from "./config.mjs";
import { routes } from "./routes.mjs";

const { uiFingerprint } = createRequire(import.meta.url)("./fingerprint.cjs");
const read = (relative) => JSON.parse(readFileSync(HANDOFF + relative, "utf8"));
const allRoutes = routes({ includeExcluded: true });
const included = routes();
const source = read("source.json");
const journeys = read("journeys/journeys.json");
const fingerprintMatches = source.fingerprint === uiFingerprint();
let gaps = Number(!fingerprintMatches);

// These routes represent distinct screens only with the required URL context.
const requiredQuery = {
  "/checkout": ["listingId"],
  "/payments": ["bookingId", "orderId"],
  "/payments/receipt": ["bookingId", "orderId"],
  "/payments/success": ["bookingId", "orderId"],
  "/reviews/new": ["bookingId"],
  "/auth/reset-password": ["token"],
  "/business/auth/accept": ["token"],
  "/admin/auth/accept": ["token"]
};

console.log(`Capture recorded ${source.capturedAt}. UI fingerprint ${fingerprintMatches ? "matches" : "differs"}.`);
console.log("\nExcluded page routes:");
const includedPatterns = new Set(included.map(({ pattern }) => pattern));
for (const { pattern } of allRoutes) {
  if (!includedPatterns.has(pattern)) console.log(" ", pattern);
}

for (const portal of Object.keys(PORTALS)) {
  const bundle = read(`${portal}/${portal}-captured.json`);
  const index = read(`${portal}/captures/index.json`);
  const screens = bundle.groups.flatMap((group) => group.sections.flatMap((section) => section.screens));
  const screenIds = new Set(screens.map(({ id }) => id));
  const expected = included.filter((route) => route.portal === portal);
  const pages = new Map(screens.filter(({ kind }) => kind === "page").map((screen) => [screen.pattern, screen]));
  console.log(`\n${portal}: ${pages.size}/${expected.length} page patterns, ${screens.length} frames, ${bundle.flows.length} journeys (bundle ${bundle.generatedAt}, source ${bundle.commit})`);

  for (const { pattern } of expected) {
    const screen = pages.get(pattern);
    if (!screen) {
      console.log("  Missing page:", pattern);
      gaps++;
      continue;
    }
    if (screen.redirect) console.log("  Redirect:", pattern, "→", screen.redirect);
    if (screen.heading === "Page or record not found") {
      console.log("  Not-found frame:", pattern);
      gaps++;
    }
    const keys = requiredQuery[pattern];
    if (keys && !keys.some((key) => new URL(screen.route, "http://capture.invalid").searchParams.get(key))) {
      console.log("  Missing scenario parameter:", pattern, keys.join(" or "));
      gaps++;
    }
  }

  for (const screen of index) {
    if (!screenIds.has(screen.id)) {
      console.log("  Indexed frame missing from bundle:", screen.id);
      gaps++;
    }
  }
  for (const screen of screens) {
    if (!bundle.captures[screen.id]) {
      console.log("  Missing frame data:", screen.id);
      gaps++;
    }
  }
  for (const journey of journeys.filter(({ steps }) => steps.some(({ lane }) => lane === portal))) {
    const flow = bundle.flows.find(({ id }) => id === journey.id);
    if (!flow || JSON.stringify(flow.steps) !== JSON.stringify(journey.steps)) {
      console.log("  Journey missing or different from index:", journey.id);
      gaps++;
    }
  }
  for (const flow of bundle.flows) {
    for (const [index, step] of flow.steps.entries()) {
      if (step.lane !== "system" && (!step.screen || !bundle.captures[step.screen])) {
        console.log("  Journey step missing frame data:", flow.id, index + 1);
        gaps++;
      }
    }
  }
}

console.log("\nRecorded journeys:");
for (const journey of journeys) {
  console.log(`  ${journey.id}: ${journey.steps.length} steps, ${journey.steps.filter(({ screen }) => screen).length} UI frames`);
}
console.log(`\n${gaps} findings across bundles. State and action coverage requires a scenario inventory and assertions.`);
if (gaps && process.argv.includes("--strict")) process.exitCode = 1;
