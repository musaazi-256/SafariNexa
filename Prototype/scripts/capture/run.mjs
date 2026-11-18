// Captures every page of a portal from the running app, plus each tab, dialog and
// menu that page can open.  node scripts/capture/run.mjs <admin|business|customer> [screen-id,...]
// Writes design/handoff/<portal>/captures/<id>.json and captures/index.json.
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { BASE, HANDOFF, PORTALS, VIEW, NOT_IDS } from "./config.mjs";
import { signIn, settle, snap } from "./lib.mjs";
import { routes } from "./routes.mjs";

const portal = process.argv[2];
if (!PORTALS[portal]) throw new Error("Usage: run.mjs <" + Object.keys(PORTALS).join("|") + "> [ids]");
const only = process.argv[3] ? new Set(process.argv[3].split(",")) : null;
const out = HANDOFF + portal + "/captures/";
if (!only) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

const sessions = {};
async function session(signedOut) {
  const key = signedOut ? "out" : "in";
  if (sessions[key]) return sessions[key];
  const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });
  const page = signedOut ? await ctx.newPage() : await signIn(ctx, PORTALS[portal].account);
  return (sessions[key] = page);
}

// "/admin/bookings/[id]" → a real id from the first matching link on "/admin/bookings".
const ids = {};
async function resolve(page, pattern) {
  if (!pattern.includes("[")) return pattern;
  const segs = pattern.split("/");
  const at = segs.findIndex((s) => s.startsWith("["));
  const parent = segs.slice(0, at).join("/") || "/";
  if (!(parent in ids)) {
    await page.goto(BASE + parent, { timeout: 180000 });
    await settle(page);
    ids[parent] = await page.evaluate(
      ([prefix, bad]) => {
        for (const a of document.querySelectorAll("a[href]")) {
          const u = new URL(a.href, location.href);
          if (u.origin !== location.origin || !u.pathname.startsWith(prefix + "/")) continue;
          const seg = u.pathname.slice(prefix.length + 1).split("/")[0];
          if (seg && !bad.includes(seg)) return seg;
        }
        return null;
      },
      [parent === "/" ? "" : parent, [...NOT_IDS]],
    );
  }
  if (!ids[parent]) return null;
  segs[at] = ids[parent];
  return segs.join("/");
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const index = [];
const failed = [];
const seenChrome = new Set();
const save = (entry, tree) => {
  writeFileSync(out + entry.id + ".json", JSON.stringify({ id: entry.id, ...tree }));
  index.push(entry);
  console.log("✓", entry.id);
};

// Tabs, dialogs and menus reachable from the page without changing anything.
async function states(page, base, url) {
  const tabs = await page.locator("[role=tab]:visible").evaluateAll((els) => els.map((e) => ({ name: (e.textContent || "").trim(), selected: e.getAttribute("aria-selected") === "true" || e.getAttribute("data-state") === "active" })));
  for (const t of tabs.filter((t) => !t.selected && t.name).slice(0, 10)) {
    try {
      await page.getByRole("tab", { name: t.name, exact: true }).first().click();
      await page.waitForTimeout(900);
      save({ ...base, id: base.id + "--tab-" + slug(t.name), kind: "tab", name: base.name + " · " + t.name + " tab", parent: base.id }, await snap(page));
    } catch (e) {
      console.log("  ✗ tab", t.name, String(e.message).split("\n")[0]);
    }
  }
  if (tabs.length) {
    await page.goto(url, { timeout: 180000 });
    await settle(page);
  }
  const triggers = await page.locator("[aria-haspopup=dialog]:visible, [aria-haspopup=menu]:visible").evaluateAll((els) =>
    els.map((e, i) => ({ i, label: (e.getAttribute("aria-label") || e.getAttribute("title") || e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60), kind: e.getAttribute("aria-haspopup"), chrome: Boolean(e.closest("header, aside, nav")) })),
  );
  let n = 0;
  for (const t of triggers) {
    if (!t.label || n >= 12) continue;
    // Header and sidebar menus look the same on every page: capture them once.
    if (t.chrome) {
      if (seenChrome.has(t.label)) continue;
      seenChrome.add(t.label);
    }
    try {
      await page.locator("[aria-haspopup=dialog]:visible, [aria-haspopup=menu]:visible").nth(t.i).click({ timeout: 5000 });
      await page.waitForSelector("[role=dialog],[role=alertdialog],[role=menu]", { timeout: 4000 });
      await page.waitForTimeout(700);
      const kind = t.kind === "menu" ? "menu" : "dialog";
      save({ ...base, id: base.id + "--" + kind + "-" + slug(t.label), kind, name: (t.chrome ? t.label : base.name + " · " + t.label) + (kind === "menu" ? " menu" : " dialog"), parent: base.id, ...(t.chrome ? { chrome: true } : {}) }, await snap(page, false));
      n++;
    } catch (e) {
      // Not an overlay after all (or disabled): nothing to capture.
    }
    // Close whatever opened; reload if it won't close.
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForTimeout(400);
    if (await page.locator("[role=dialog]:visible,[role=alertdialog]:visible,[role=menu]:visible").count()) {
      await page.goto(url, { timeout: 180000 });
      await settle(page);
    }
  }
}

for (const r of routes().filter((r) => r.portal === portal)) {
  if (only && !only.has(r.id)) continue;
  try {
    const page = await session(r.signedOut);
    const route = await resolve(page, r.pattern);
    if (!route) {
      console.log("–", r.id, "(no example to open: the list is empty)");
      continue;
    }
    await page.goto(BASE + route, { timeout: 180000 });
    await settle(page);
    const landed = new URL(page.url()).pathname;
    const base = { id: r.id, section: r.section, name: r.name, route, pattern: r.pattern, kind: "page", signedOut: r.signedOut };
    if (landed !== route) base.redirect = landed;
    // The page's own heading and intro line document what it is for.
    Object.assign(
      base,
      await page.evaluate(() => {
        const h = document.querySelector("main h1, h1");
        // The first paragraph after the heading, within a few levels of its wrapper.
        let p = null;
        for (let a = h && h.parentElement, i = 0; a && i < 3 && !p; a = a.parentElement, i++)
          p = [...a.querySelectorAll("p")].find((x) => h.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING) || null;
        const t = (e) => (e ? e.textContent.replace(/\s+/g, " ").trim() : undefined);
        return { heading: t(h), purpose: t(p) };
      }),
    );
    save(base, await snap(page));
    if (!r.signedOut && landed === route) await states(page, base, BASE + route);
  } catch (e) {
    failed.push(r.id);
    console.log("✗", r.id, String(e.message || e).split("\n")[0]);
    const key = r.signedOut ? "out" : "in";
    await sessions[key]?.context().close().catch(() => undefined);
    delete sessions[key];
  }
}

// Partial runs update their entries in the existing index.
let all = index;
if (only) {
  let prev = [];
  try {
    prev = JSON.parse(readFileSync(out + "index.json", "utf8"));
  } catch {
    prev = [];
  }
  const fresh = new Set(index.map((e) => e.id));
  all = [...prev.filter((e) => !fresh.has(e.id) && !(e.parent && only.has(e.parent))), ...index];
}
writeFileSync(out + "index.json", JSON.stringify(all, null, 1));
await browser.close();
if (failed.length) {
  console.log("Not captured:", failed.join(", "));
  process.exitCode = 1;
}
