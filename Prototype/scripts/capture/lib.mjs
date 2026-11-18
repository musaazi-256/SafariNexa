// Helpers shared by the screen runner (run.mjs) and the journeys (journeys.mjs).
import { readFileSync } from "node:fs";
import { BASE, PORTALS, VIEW, MAX_HEIGHT } from "./config.mjs";

export const extract = readFileSync(new URL("./extract.js", import.meta.url), "utf8").replace(/^(\s*\/\/[^\n]*\n)+/, "").trim().replace(/;$/, "");

// Next.js dev tools and route announcer are not part of the design.
export const HIDE = "nextjs-portal, [data-nextjs-toast], #__next-build-watcher, next-route-announcer { display: none !important; }";

export async function signIn(context, account) {
  const p = await context.newPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 180000 });
  await p.locator(`button[title="Switch to the ${account} account"]`).first().click();
  const home = PORTALS[account].home;
  await p.waitForURL((u) => home === "/" || u.pathname.startsWith(home), { timeout: 180000 });
  await p.waitForLoadState("networkidle", { timeout: 180000 }).catch(() => undefined);
  // The customer's home is "/", where the switch starts: wait until the header shows them signed in.
  if (home === "/") await p.getByRole("link", { name: "Log in", exact: true }).waitFor({ state: "detached", timeout: 120000 }).catch(() => undefined);
  return p;
}

export async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 120000 }).catch(() => undefined);
  await page.addStyleTag({ content: HIDE }).catch(() => undefined);
  await page.waitForTimeout(600);
}

// Full-length pages; overlays at the window size they open in.
export async function snap(page, full = true) {
  const v = { ...VIEW };
  const overlay = await page.evaluate(() => Boolean(document.querySelector("[role=dialog],[role=alertdialog],[role=menu],[role=listbox]")));
  if (full && !overlay) {
    v.height = Math.min(MAX_HEIGHT, Math.max(VIEW.height, await page.evaluate(() => Math.max(document.scrollingElement.scrollHeight, ...[...document.querySelectorAll("main")].map((m) => m.scrollHeight)))));
    if (v.height > VIEW.height) {
      await page.setViewportSize(v);
      await page.waitForTimeout(700);
    }
  }
  const tree = await page.evaluate(`(${extract})(${JSON.stringify(v)})`);
  if (v.height !== VIEW.height) await page.setViewportSize(VIEW);
  return tree;
}

