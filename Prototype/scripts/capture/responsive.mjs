// Capture customer routes and responsive journeys without replacing desktop frames.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { BASE, CUSTOMER_VIEWPORTS, HANDOFF } from "./config.mjs";
import { cleanupResponsiveConversation, cleanupScreens, disconnect, setupResponsiveConversation, setupScreens } from "./fixtures.mjs";
import { HIDE, scrollSnapshots, snap } from "./lib.mjs";
import { routes } from "./routes.mjs";

const directory = HANDOFF + "customer/captures/";
const journeyDirectory = HANDOFF + "journeys/";
const indexPath = directory + "index.json";
const index = JSON.parse(readFileSync(indexPath, "utf8"));
const journeysOnly = process.argv.includes("--journeys-only");
const resume = process.argv.includes("--resume");
const pages = index.filter((entry) => entry.kind === "page");
const variants = index.filter((entry) => entry.kind === "state" && !entry.device && entry.route !== pages.find((page) => page.id === entry.parent)?.route && entry.parent);
for (const { id } of routes().filter((route) => route.portal === "customer")) {
  assert.ok(pages.some((page) => page.id === id), `Missing desktop route context for ${id}`);
}

function save(directory, id, tree) {
  writeFileSync(directory + id + ".json", JSON.stringify({ id, ...tree }));
  console.log("✓", id);
}

async function visit(page, route) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await page.goto(BASE + route, { timeout: 45000, waitUntil: "commit" });
      await page.locator("main, h1").first().waitFor({ state: "attached", timeout: 45000 });
      return response;
    } catch (error) {
      if (attempt === 1) throw error;
      console.log("↻", route, String(error.message).split("\n")[0]);
    }
  }
}

async function settle(page) {
  await page.addStyleTag({ content: HIDE });
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 500))]));
  await page.waitForTimeout(350);
}

async function openOverlay(trigger, overlay) {
  for (let attempt = 0; attempt < 8; attempt++) {
    if (await overlay.isVisible()) return;
    await trigger.tap();
    if (await overlay.waitFor({ timeout: 4000 }).then(() => true, () => false)) return;
  }
  throw new Error("The responsive overlay did not open");
}

async function replay(id, title, device, page, steps) {
  const frames = [];
  for (const [i, step] of steps.entries()) {
    await step.act(page);
    await settle(page);
    const screen = `j-responsive-${device}-${id}-${i + 1}`;
    save(journeyDirectory + "captures/", screen, await snap(page, false));
    frames.push({ lane: "customer", label: step.label, screen, route: new URL(page.url()).pathname });
  }
  return { id: `j-responsive-${device}-${id}`, title: `${device === "phone" ? "Phone" : "Tablet"} · ${title}`, device, steps: frames };
}

async function captureDevice(browser, device, viewport, message) {
  const options = { viewport, hasTouch: true, deviceScaleFactor: 1 };
  // Mobile emulation also exercises touch and the app's viewport metadata.
  if (device === "phone") options.isMobile = true;
  const signedIn = await browser.newContext(options);
  const signedOut = await browser.newContext(options);
  const guest = await signedOut.newPage();
  const customer = await signedIn.newPage();
  const entries = [];
  const journeys = [];
  let pagesComplete = false;
  try {
    console.log(`▶ Signing in at ${viewport.width}px`);
    await visit(customer, "/auth/sign-in");
    await customer.getByRole("button", { name: "Continue as customer" }).click({ timeout: 15000 });
    await customer.waitForURL(new URL("/", BASE).href, { timeout: 30000, waitUntil: "domcontentloaded" });
    async function captureScreen(page, base) {
      const response = await visit(page, base.route);
      const expected = base.redirect ?? new URL(base.route, BASE).pathname;
      if (base.redirect) await page.waitForURL((url) => url.pathname === expected, { waitUntil: "commit", timeout: 60000 });
      await settle(page);
      const actual = new URL(page.url()).pathname;
      assert.equal(actual, expected, `${device} ${base.id}`);
      assert.ok(response?.ok(), `${device} ${base.id}: HTTP ${response?.status()}`);
      const name = device === "phone" ? "Phone" : "Tablet";
      const frame = { ...base, id: `${base.id}--${device}`, parent: base.parent ?? base.id, kind: "state", name: `${base.name} · ${name} ${viewport.width}px`, device, viewport };
      const tree = await snap(page);
      assert.equal(tree.w, viewport.width);
      const routeEntries = [frame];
      save(directory, frame.id, tree);
      if (base.kind === "page" && !base.redirect) {
        for (const scroll of await scrollSnapshots(page)) {
          const id = `${frame.id}-${scroll.suffix}`;
          routeEntries.push({ ...frame, id, name: `${frame.name} · ${scroll.name}`, scrollY: scroll.offset });
          save(directory, id, scroll.tree);
        }
      }
      entries.push(...routeEntries);
    }
    if (!journeysOnly) {
      const pending = [...pages, ...variants].filter((base) => !resume || !index.some((entry) => entry.id === `${base.id}--${device}`));
      const errors = [];
      const work = async (signedInPage, signedOutPage) => {
        while (pending.length) {
          const base = pending.shift();
          try {
            await captureScreen(base.signedOut ? signedOutPage : signedInPage, base);
          } catch (error) {
            console.error("✗", device, base.id, error.message);
            errors.push(error);
          }
        }
      };
      await Promise.all([
        work(customer, guest),
        work(await signedIn.newPage(), await signedOut.newPage()),
      ]);
      if (errors.length) return { entries, journeys, error: new AggregateError(errors, `${device} screen capture failed`) };
    }
    pagesComplete = true;

    const filterDialog = (page) => page.getByRole("dialog", { name: "Filter results" });
    journeys.push(await replay("search", "Filter listings in a sheet", device, customer, [
      { label: "Search results. Open Filters to narrow the list.", act: (page) => visit(page, "/search?category=accommodation") },
      { label: "The filter sheet opens over the results.", act: async (page) => {
        await openOverlay(page.getByRole("button", { name: "Filters", exact: true }), filterDialog(page));
      } },
      { label: "Select a price range. The sheet stays open with the selection checked.", act: async (page) => {
        await filterDialog(page).getByRole("checkbox", { name: "Under UGX 200,000" }).tap();
        await page.waitForURL((url) => url.searchParams.has("price"), { timeout: 60000, waitUntil: "domcontentloaded" });
        await filterDialog(page).waitFor();
      } },
      { label: "Tap Show results to close the sheet and view the filtered list.", act: async (page) => {
        await filterDialog(page).getByRole("button", { name: "Show results" }).tap();
        await filterDialog(page).waitFor({ state: "hidden" });
      } },
    ]));

    if (device === "phone") {
      journeys.push(await replay("navigation", "Go from the mobile menu to the sign-in form", device, guest, [
        { label: "Signed-out home with phone navigation.", act: (page) => visit(page, "/") },
        { label: "Tap Open menu to reveal navigation and account links.", act: async (page) => {
          await openOverlay(page.getByRole("button", { name: "Open menu" }), page.getByRole("dialog"));
        } },
        { label: "Tap Log in from the menu to open the sign-in form.", act: async (page) => {
          await page.getByRole("dialog").getByRole("link", { name: "Log in" }).tap();
          await page.waitForURL("**/auth/sign-in", { waitUntil: "domcontentloaded" });
        } },
      ]));
      journeys.push(await replay("messages", "Switch between a conversation and the inbox", device, customer, [
        { label: "Open Messages. The active conversation occupies the phone screen.", act: async (page) => {
          await visit(page, "/profile/messages");
          await page.getByText(message, { exact: true }).last().waitFor();
        } },
        { label: "Tap Back to conversations to reveal the inbox list.", act: async (page) => {
          await page.getByRole("button", { name: "Back to conversations" }).tap();
          await page.getByRole("textbox", { name: "Search conversations" }).waitFor();
        } },
        { label: "Tap a conversation to reopen its thread.", act: async (page) => {
          await page.getByRole("button").filter({ hasText: message }).tap();
          await page.getByRole("button", { name: "Back to conversations" }).waitFor();
        } },
      ]));
      journeys.push(await replay("stay", "Inspect a room and reach the reservation controls", device, customer, [
        { label: "Open the accommodation listing and scroll to the room options.", act: async (page) => {
          await visit(page, "/accommodation/demo-lodge");
          await page.getByRole("button", { name: "Reserve", exact: true }).first().scrollIntoViewIfNeeded();
        } },
        { label: "Open More details to inspect the room.", act: async (page) => {
          await openOverlay(page.getByRole("button", { name: /More details/ }).first(), page.getByRole("dialog"));
        } },
        { label: "Close the room detail and return to the room options.", act: async (page) => {
          const dialog = page.getByRole("dialog");
          await dialog.getByRole("button", { name: "Close", exact: true }).tap();
          await dialog.waitFor({ state: "hidden" });
        } },
        { label: "Tap Reserve and reach the date and guest controls further down the phone page.", act: async (page) => {
          const room = page.getByRole("button", { name: "Reserve", exact: true }).first();
          await room.tap();
          await page.locator("#reservation-card").scrollIntoViewIfNeeded();
          await page.getByLabel("Check-in", { exact: true }).waitFor();
        } },
      ]));
    }
    return { entries, journeys };
  } catch (error) {
    if (!pagesComplete) throw error;
    return { entries, journeys, error };
  } finally {
    await signedIn.close();
    await signedOut.close();
  }
}

const browser = await chromium.launch({ channel: "chrome" });
try {
  await cleanupResponsiveConversation();
  await setupScreens();
  const message = await setupResponsiveConversation();
  const results = await Promise.allSettled(Object.entries(CUSTOMER_VIEWPORTS).map(([device, viewport]) => captureDevice(browser, device, viewport, message)));
  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length) throw new AggregateError(failures.map((failure) => failure.reason), "Responsive capture failed");
  const completed = results.map((result) => result.value);
  if (!journeysOnly) {
    const fresh = completed.flatMap((result) => result.entries);
    writeFileSync(indexPath, JSON.stringify([...index.filter((entry) => !entry.device || resume), ...fresh], null, 1));
  }
  const captureErrors = completed.flatMap((result) => result.error ? [result.error] : []);
  if (captureErrors.length) throw new AggregateError(captureErrors, "Responsive capture incomplete. Retry with --resume.");
  writeFileSync(journeyDirectory + "responsive.json", JSON.stringify(completed.flatMap((result) => result.journeys), null, 1));
} finally {
  await browser.close();
  try {
    await cleanupResponsiveConversation();
    await cleanupScreens();
  } finally {
    await disconnect();
  }
}
