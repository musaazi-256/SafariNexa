// Every page route in src/app, grouped by portal, with a section and a readable name.
// New pages are picked up automatically; nothing here needs editing when routes change.
import { readdirSync, statSync } from "node:fs";
import { APP, SKIP, SIGNED_OUT, portalOf, PORTALS } from "./config.mjs";

const title = (s) => s.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function pages(dir, rel = "") {
  let out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = dir + "/" + name;
    if (statSync(p).isDirectory()) {
      if (name.startsWith("_") || name.startsWith("@")) continue;
      // Route groups like (portal) don't appear in the URL.
      out = out.concat(pages(p, /^\(.*\)$/.test(name) ? rel : rel + "/" + name));
    } else if (/^page\.(t|j)sx?$/.test(name)) out.push(rel || "/");
  }
  return out;
}

export function routes({ includeExcluded = false } = {}) {
  return pages(APP + "src/app")
    .filter((r) => includeExcluded || !SKIP.some((re) => re.test(r)))
    .map((pattern) => {
      const portal = portalOf(pattern);
      const rest = pattern.slice(PORTALS[portal].prefix.length).split("/").filter(Boolean);
      const statics = rest.filter((s) => !s.startsWith("[") && s !== "auth");
      const section = rest[0] === "auth" || pattern === "/admin/login" ? "Access" : statics.length ? title(statics[0]) : "Home";
      const last = rest[rest.length - 1] || "";
      const name = !rest.length
        ? "Home"
        : last.startsWith("[")
          ? title(statics[statics.length - 1] || "item") + " · details"
          : statics.length > 1
            ? statics.map(title).join(" › ")
            : title(last);
      const id = portal + (rest.length ? "-" + rest.map((s) => s.replace(/[[\]]/g, "")).join("-") : "-home");
      return { id, portal, pattern, section, name, signedOut: SIGNED_OUT.some((re) => re.test(pattern)) };
    });
}
