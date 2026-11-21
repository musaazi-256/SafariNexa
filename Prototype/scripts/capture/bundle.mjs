// Bundles one portal's captures and the journeys that touch it into the file its
// Figma plugin loads from GitHub main:  node scripts/capture/bundle.mjs [portal...]
// Writes design/handoff/<portal>/<portal>-captured.json.
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { HANDOFF, PORTALS, REPO } from "./config.mjs";
import { GROUPS } from "./groups.mjs";

const read = (p) => JSON.parse(readFileSync(p, "utf8"));

// Photos and logos repeat across screens: store each once and reference it by key.
function shareImages(tree, images) {
  const ref = (data) => {
    if (!data || !data.startsWith("data:")) return data;
    const key = createHash("sha1").update(data).digest("hex").slice(0, 16);
    images[key] = data;
    return "#" + key;
  };
  const walk = (n) => {
    if (n.k === "img") n.data = ref(n.data);
    if (n.bgImg) n.bgImg = ref(n.bgImg);
    for (const k of n.kids || []) walk(k);
  };
  walk(tree);
  return tree;
}

let commit = "";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: REPO, encoding: "utf8" }).trim();
} catch {
  commit = "";
}

const journeysFile = HANDOFF + "journeys/journeys.json";
const responsiveJourneys = HANDOFF + "journeys/responsive.json";
const journeys = [
  ...(existsSync(journeysFile) ? read(journeysFile) : []),
  ...(existsSync(responsiveJourneys) ? read(responsiveJourneys) : []),
];

for (const portal of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PORTALS)) {
  const dir = HANDOFF + portal + "/captures/";
  if (!existsSync(dir + "index.json")) {
    console.log("–", portal, "has no captures yet");
    continue;
  }
  const index = read(dir + "index.json");
  const images = {};
  const captures = {};
  for (const e of index) {
    if (!existsSync(dir + e.id + ".json")) continue;
    const { id, ...tree } = read(dir + e.id + ".json");
    captures[id] = shareImages(tree, images);
  }
  // Curated groups (one Figma page each); within a group, one section per page
  // holding the page and every tab, dialog and menu it opens.
  const spec = GROUPS[portal];
  const groups = spec.groups.map((g) => ({ ...g, sections: [] }));
  const other = { id: String(groups.length + 1).padStart(2, "0"), name: "Detected automatically · not yet grouped", routes: [], sections: [] };
  const shell = groups.find((g) => g.shell);
  const has = (e) => Boolean(captures[e.id]);
  for (const pg of index.filter((e) => e.kind === "page" && has(e))) {
    const g = groups.find((x) => x.routes.includes(pg.pattern)) || other;
    const states = index.filter((e) => e.parent === pg.id && has(e) && !(e.chrome && shell));
    g.sections.push({ title: pg.name, route: pg.route, pattern: pg.pattern, screens: [pg, ...states] });
  }
  if (shell) {
    const chrome = index.filter((e) => e.chrome && has(e));
    if (chrome.length) shell.sections.push({ title: "Header, sidebar & account menus", route: "", pattern: "", screens: chrome });
  }
  const order = (g) => (sec) => g.routes.indexOf(sec.pattern);
  for (const g of groups) g.sections.sort((a, b) => order(g)(a) - order(g)(b));
  const allGroups = [...groups, ...(other.sections.length ? [other] : [])].filter((g) => g.sections.length);
  if (other.sections.length) console.log(`  ! ${portal}: not yet grouped in groups.mjs: ${other.sections.map((s) => s.pattern).join(", ")}`);
  const flows = journeys.filter((j) => j.steps.some((s) => s.lane === portal));
  for (const f of flows)
    for (const s of f.steps) {
      const file = HANDOFF + "journeys/captures/" + s.screen + ".json";
      if (s.screen && existsSync(file)) {
        const { id, ...tree } = read(file);
        captures[id] = shareImages(tree, images);
      }
    }
  const bundle = {
    portal,
    title: PORTALS[portal].title,
    generatedAt: new Date().toISOString(),
    commit,
    eyebrow: spec.eyebrow,
    cover: spec.cover,
    entry: spec.entry,
    legacy: spec.legacy,
    groups: allGroups,
    flows,
    images,
    captures,
  };
  const file = HANDOFF + portal + "/" + portal + "-captured.json";
  writeFileSync(file, JSON.stringify(bundle));
  const mb = readFileSync(file).length / 1048576;
  console.log(`✓ ${portal}: ${index.length} screens, ${flows.length} flows, ${Object.keys(images).length} images · ${mb.toFixed(1)} MB`);
  if (mb > 90) throw new Error(portal + " bundle is over GitHub's 100 MB file limit; reduce image sizes in extract.js.");
}
