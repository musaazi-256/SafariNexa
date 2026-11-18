// Documented journeys: performs each flow for real across the customer website and
// the business and admin portals, capturing the screen after every step, so Figma
// shows the flow exactly as it happens.  node scripts/capture/journeys.mjs [journey-id,...]
// Writes design/handoff/journeys/captures/<step>.json and journeys/journeys.json.
// Each step label says what the screen shows, then "Next:" and the action.
import { chromium } from "playwright";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { BASE, HANDOFF, VIEW } from "./config.mjs";
import { signIn, settle, snap } from "./lib.mjs";

const out = HANDOFF + "journeys/captures/";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

const go = (path) => async (p, c) => p.goto(BASE + (typeof path === "function" ? path(c) : path), { timeout: 180000 });
const button = (name) => async (p) => p.getByRole("button", { name }).first().click();
const link = (name) => async (p) => p.getByRole("link", { name }).first().click();
const seq = (...fns) => async (p, c) => {
  for (const f of fns) {
    await f(p, c);
    await settle(p);
  }
};
// The detail link of a booking, found by its reference (e.g. "BK-8771F184"):
// the row's own reference link, not a page-level link that merely contains it.
const bookingHref = (prefix) => async (p, c) =>
  p.evaluate(
    ([prefix, ref]) => {
      const links = [...document.querySelectorAll(`a[href^='${prefix}']`)];
      const own = links.find((a) => a.textContent.trim() === ref) || links.find((a) => a.textContent.includes(ref) && a.textContent.length < 80);
      return own ? own.getAttribute("href").split("#")[0] : null;
    },
    [prefix, c.vars.ref],
  );

const JOURNEYS = [
  {
    id: "booking-loop",
    title: "A customer books a stay, the business accepts and the customer pays",
    summary:
      "Grace finds a lodge on the customer website, picks a room and dates, and sends a booking request with her traveller details. The lodge accepts it in the business portal, which asks her to pay; she pays with mobile money (simulated) and the booking is confirmed. Operations sees the payment in the admin portal, where it waits to be settled to the business.",
    steps: [
      { lane: "customer", act: seq(go("/accommodation"), async (p) => p.reload()), label: "Accommodation: verified stays with location, rating, availability and price per night. Next: open Murchison River Lodge." },
      { lane: "customer", act: go("/accommodation/demo-lodge"), label: "Listing page: photos, rooms with price and cancellation terms, amenities, policies and reviews. Next: Reserve a room." },
      { lane: "customer", act: button("Reserve"), label: "Reserve selects that room in the booking panel beside the listing: room type, guests, an availability calendar (booked nights are disabled) and add-ons. Next: choose check-in and check-out." },
      {
        lane: "customer",
        label: "Dates chosen: the panel shows the stay and total, with Add to cart, Save to favourites and Continue to checkout. Next: Continue to checkout.",
        // Check-in and check-out on two consecutive free days, from two months ahead.
        act: async (p) => {
          for (let month = 0; month < 14; month++) {
            await p.getByRole("button", { name: "Next month" }).first().click();
            await p.waitForTimeout(400);
            if (month < 1) continue;
            const days = await p.locator("main button[aria-label]:not([disabled])").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")).filter((l) => /^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(l)));
            const t = days.map((d) => Date.parse(d));
            const i = t.findIndex((x, k) => k + 1 < t.length && t[k + 1] - x === 86400000);
            if (i < 0) continue;
            await p.getByRole("button", { name: days[i], exact: true }).click();
            await p.getByRole("button", { name: days[i + 1], exact: true }).click();
            await p.getByRole("button", { name: "Continue to checkout" }).first().scrollIntoViewIfNeeded();
            return;
          }
          throw new Error("No two consecutive free nights in the next 14 months");
        },
      },
      {
        lane: "customer",
        label: "Checkout · Complete your booking: special requests and traveller details (prefilled from the profile; phone required), with the estimated total. Next: Continue to payment.",
        act: async (p) => {
          // The panel sometimes swallows the first click while it re-renders: try twice.
          for (let tries = 0; tries < 2 && !/\/checkout/.test(p.url()); tries++) {
            await p.getByRole("button", { name: "Continue to checkout" }).first().click();
            await p.waitForURL(/\/checkout/, { timeout: 30000 }).catch(() => undefined);
          }
          if (!/\/checkout/.test(p.url())) throw new Error("Checkout did not open");
          await settle(p);
          await p.locator("main input[type=tel]:visible").first().fill("+256772123456");
        },
      },
      {
        lane: "customer",
        label: "Booking status: the request is sent and awaits the business (with a response deadline). No payment is taken yet. Next: the business responds.",
        act: async (p, c) => {
          await button("Continue to payment")(p);
          await p.waitForURL(/\/payments/, { timeout: 120000 });
          await settle(p);
          c.vars.ref = (await p.locator("main").innerText()).match(/BK-[A-Z0-9]+/)[0];
        },
      },
      { lane: "system", label: "Booking created as Awaiting confirmation; the business is notified and has until the response deadline to accept or decline." },
      { lane: "business", act: go("/business/bookings"), label: (c) => `Business · Bookings: ${c.vars.ref} is listed as Awaiting confirmation, payment Not started. Next: open it.` },
      {
        lane: "business",
        label: "Business · Booking page: dates, room, traveller and customer details, the response deadline, Accept request — ask customer to pay, and Decline booking. Next: accept.",
        act: async (p, c) => {
          c.vars.business = await bookingHref("/business/bookings/")(p, c);
          await p.goto(BASE + c.vars.business, { timeout: 180000 });
        },
      },
      { lane: "business", act: button(/Accept request/), label: "Business · Accepted: the booking now shows Payment required with a payment deadline; the customer is asked to pay." },
      { lane: "customer", act: go((c) => c.vars.business.replace("/business", "")), label: "Customer · My booking: Payment required, the outstanding amount, Complete payment and Cancel booking. Next: Complete payment." },
      {
        lane: "customer",
        label: "Complete payment: MTN Mobile Money, Airtel Money, Visa / Mastercard or international card, an optional number for the prompt preview, the simulation result and the total due. MTN and Payment succeeds are selected. Next: Pay.",
        act: async (p) => {
          await link("Continue to payment")(p);
          await settle(p);
          await p.locator("input[name=method][value=mtn]").check({ force: true });
          await p.locator("select[name=outcome]").selectOption("success");
        },
      },
      {
        lane: "customer",
        label: "Payment successful: confirmation with a DEMO- payment reference; the booking is confirmed.",
        act: async (p) => {
          await p.getByRole("button", { name: /^Pay UGX/ }).click();
          await p.waitForURL((u) => !/\/payments$/.test(u.pathname) || u.search.includes("status"), { timeout: 120000 }).catch(() => undefined);
          await p.waitForTimeout(3000);
          await p.evaluate(() => window.scrollTo(0, 0));
        },
      },
      { lane: "system", label: "Payment recorded as Successful; the booking moves to Confirmed and the business's share becomes unsettled earnings." },
      { lane: "customer", act: go((c) => c.vars.business.replace("/business", "")), label: "Customer · My booking: confirmed and paid, with the payment in Payments & refunds." },
      { lane: "business", act: go((c) => c.vars.business), label: "Business · Booking page: confirmed and paid; refunds can be issued from Payments & refunds." },
      { lane: "admin", act: go("/admin/payments"), label: "Admin · Payments, refunds & payouts: the new payment at the top, and Settle payouts for eligible payments to verified businesses." },
      {
        lane: "admin",
        label: (c) => `Admin · Booking page for ${c.vars.ref}: customer, business, dates, traveller details, status, and the payment with its DEMO- reference.`,
        act: async (p, c) => {
          await p.goto(BASE + "/admin/bookings", { timeout: 180000 });
          await settle(p);
          const href = await bookingHref("/admin/bookings/")(p, c);
          if (href) await p.goto(BASE + href, { timeout: 180000 });
        },
      },
    ],
  },
];

async function run(j) {
  const ctx = { vars: {} };
  const pages = {};
  const page = async (lane) => {
    if (!pages[lane]) {
      const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });
      pages[lane] = await signIn(context, lane);
    }
    return pages[lane];
  };
  const steps = [];
  let n = 0;
  for (const st of j.steps) {
    const label = typeof st.label === "function" ? st.label(ctx) : st.label;
    try {
      if (st.lane === "system") {
        steps.push({ lane: "system", label });
      } else {
        const p = await page(st.lane);
        if (st.act) await st.act(p, ctx);
        await settle(p);
        const id = `j-${j.id}-${String(++n).padStart(2, "0")}`;
        const tree = await snap(p, false);
        writeFileSync(out + id + ".json", JSON.stringify({ id, ...tree }));
        if (process.env.CAPTURE_SHOTS) await p.screenshot({ path: process.env.CAPTURE_SHOTS + "/" + id + ".png" });
        steps.push({ lane: st.lane, label: typeof st.label === "function" ? st.label(ctx) : label, screen: id, route: new URL(p.url()).pathname });
      }
      console.log("  ✓", j.id, steps.length, steps[steps.length - 1].label.slice(0, 90));
    } catch (e) {
      console.log("  ✗", j.id, "step", steps.length + 1, `"${label.slice(0, 60)}"`, String(e.message || e).split("\n")[0]);
      break;
    }
  }
  for (const p of Object.values(pages)) await p.context().close();
  return { id: "j-" + j.id, title: j.title, summary: j.summary, steps, complete: steps.length === j.steps.length };
}

const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
const file = HANDOFF + "journeys/journeys.json";
const prev = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
const result = [];
let failed = false;
for (const j of JOURNEYS) {
  const old = prev.find((x) => x.id === "j-" + j.id);
  if (only && !only.has(j.id)) {
    if (old) result.push(old);
    continue;
  }
  console.log("▶", j.title);
  const r = await run(j);
  // A journey that stopped early keeps its last complete version in Figma.
  if (r.complete || !old) result.push(r);
  else {
    failed = true;
    result.push(old);
    console.log(`  ! stopped at step ${r.steps.length + 1}; keeping the previous complete version.`);
  }
}
writeFileSync(file, JSON.stringify(result.map(({ complete, ...r }) => r), null, 1));
await browser.close();
if (failed) process.exitCode = 1;
