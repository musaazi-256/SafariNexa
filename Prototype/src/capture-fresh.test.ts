/** @jest-environment node */
// The Figma plugins rebuild screens from design/handoff, captured from the running
// app by `npm run capture`. This fails when the UI changed since the last capture.
import { readFileSync } from "node:fs";
import path from "node:path";
const { uiFingerprint } = require("../scripts/capture/fingerprint.cjs");

test("Figma captures match the current UI code", () => {
  const source = JSON.parse(readFileSync(path.join(__dirname, "../../design/handoff/source.json"), "utf8"));
  if (source.fingerprint !== uiFingerprint()) throw new Error("UI code changed since the last capture. Run `npm run capture` in Prototype and commit design/handoff.");
});
