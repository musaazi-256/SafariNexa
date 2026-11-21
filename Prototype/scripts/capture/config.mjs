// Shared settings for capturing the running app into the Figma handoff.
// Each portal becomes one bundle (design/handoff/<portal>/<portal>-captured.json)
// that its Figma plugin loads from GitHub main.
import { fileURLToPath } from "node:url";

export const APP = fileURLToPath(new URL("../..", import.meta.url)); // Prototype/
export const REPO = fileURLToPath(new URL("../../..", import.meta.url)); // repo root
export const HANDOFF = REPO + "design/handoff/";
export const BASE = process.env.CAPTURE_BASE || "http://localhost:3000";

export const VIEW = { width: 1440, height: 900 };
export const CUSTOMER_VIEWPORTS = {
  phone: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
};
// Pages are captured at full length up to this height; dialogs and menus at the window size.
export const MAX_HEIGHT = 6000;

export const PORTALS = {
  admin: { title: "SafariNexa · Admin portal", account: "admin", home: "/admin/dashboard", prefix: "/admin" },
  business: { title: "SafariNexa · Business portal", account: "business", home: "/business/dashboard", prefix: "/business" },
  customer: { title: "SafariNexa · Customer website", account: "customer", home: "/", prefix: "" },
};

export const portalOf = (route) => (route === "/admin" || route.startsWith("/admin/") ? "admin" : route === "/business" || route.startsWith("/business/") ? "business" : "customer");

// Not designed screens: OAuth hand-offs, the demo inbox, engineering docs and the component sandbox.
export const SKIP = [/\/auth\/google/, /^\/demo(\/|$)/, /^\/docs(\/|$)/, /^\/ui-kit$/, /^\/api\//];

// Shown signed out: sign-in, account creation and password recovery.
export const SIGNED_OUT = [/^\/auth\//, /^\/admin\/login$/, /^\/admin\/auth\//, /^\/business\/auth\//];

// Static siblings of a dynamic segment ("/bookings/calendar" is not a booking id).
export const NOT_IDS = new Set(["new", "calendar", "edit", "review", "availability", "setup", "verification", "multi", "success", "cancelled", "receipt"]);
