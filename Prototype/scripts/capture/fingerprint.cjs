// A hash of every file that shapes what the app looks like. When it changes, the
// Figma captures are out of date (checked by src/capture-fresh.test.ts).
const { createHash } = require("node:crypto");
const { readdirSync, readFileSync, statSync } = require("node:fs");
const path = require("node:path");

const APP = path.join(__dirname, "../..");
const INPUTS = ["src", "public", "tailwind.config.ts"];

function files(rel) {
  const abs = path.join(APP, rel);
  let st;
  try {
    st = statSync(abs);
  } catch {
    return [];
  }
  if (!st.isDirectory()) return [rel];
  return readdirSync(abs)
    .sort()
    .flatMap((n) => (/\.test\.|\.DS_Store$/.test(n) ? [] : files(rel + "/" + n)));
}

function uiFingerprint() {
  const h = createHash("sha256");
  for (const f of INPUTS.flatMap(files)) h.update(f + "\0").update(readFileSync(path.join(APP, f)));
  return h.digest("hex").slice(0, 16);
}

module.exports = { uiFingerprint };
