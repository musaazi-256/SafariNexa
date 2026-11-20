// Helpers shared by the screen runner (run.mjs) and the journeys (journeys.mjs).
import { readFileSync } from "node:fs";
import { BASE, PORTALS, VIEW, MAX_HEIGHT } from "./config.mjs";

export const extract = readFileSync(new URL("./extract.js", import.meta.url), "utf8").replace(/^(\s*\/\/[^\n]*\n)+/, "").trim().replace(/;$/, "");

// Next.js dev tools and route announcer are not part of the design.
export const HIDE = "nextjs-portal, [data-nextjs-toast], #__next-build-watcher, next-route-announcer { display: none !important; }";

// First-time guides and feature tips (business portal) open by themselves on a fresh
// browser; screen captures turn them off so pages are captured without a modal over them. The guides are
// still captured as dialogs from the header's ? button, and in the first-time journey.
export async function signIn(context, account, { guides = false } = {}) {
  if (!guides) await context.addInitScript(() => { try { localStorage.setItem("safarinexa:guides:off", "1"); localStorage.setItem("safarinexa:tips:off", "1"); } catch {} });
  const p = await context.newPage();
  await p.goto(BASE + "/", { waitUntil: "networkidle", timeout: 180000 });
  const home = PORTALS[account].home;
  // Wait for the switch request itself to finish (it sets the session cookie): moving on
  // earlier cancels it, which a slow dev server makes likely (the customer's home is "/",
  // where the switch starts, so there is no URL change to wait for).
  for (let tries = 0; tries < 3; tries++) {
    const switched = p.waitForResponse((r) => r.request().method() === "POST" && r.status() === 303, { timeout: 180000 }).catch(() => null);
    await p.locator(`button[title="Switch to the ${account} account"]`).first().click();
    await switched;
    if ((await context.cookies()).some((c) => c.name.endsWith("session-token"))) break;
  }
  await p.goto(BASE + home, { waitUntil: "networkidle", timeout: 180000 });
  return p;
}

export async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 120000 }).catch(() => undefined);
  await page.addStyleTag({ content: HIDE }).catch(() => undefined);
  await page.waitForTimeout(600);
}

// Full-length pages and menus; dialogs at the window size they open in.
export async function snap(page, full = true) {
  const v = { ...VIEW };
  // Dialogs sit in the middle of the window, so they're captured at window size; menus
  // open beside their trigger and are captured with the full page behind them.
  const overlay = await page.evaluate(() => Boolean(document.querySelector("[role=dialog],[role=alertdialog]")));
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

