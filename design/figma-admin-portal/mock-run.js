// Minimal Figma Plugin API mock with strict-ish validation, to smoke-test code.js in Node.
const fs = require("fs");
const vm = require("vm");
const loaded = new Set();
let idc = 0, nodeCount = 0;
const AUTO = (n) => n && (n.type === "FRAME" || n.type === "COMPONENT" || n.type === "COMPONENT_SET" || n.type === "INSTANCE") && n.layoutMode && n.layoutMode !== "NONE";
function fail(msg) { throw new Error(msg); }

class Node {
  constructor(type) {
    this.type = type; this.id = "n" + (++idc); nodeCount++;
    this.children = []; this.parent = null; this.name = type;
    this.width = 100; this.height = 100; this.x = 0; this.y = 0;
    this._lsh = "FIXED"; this._lsv = "FIXED";
    this.layoutMode = "NONE"; this.fills = []; this.strokes = []; this.effects = [];
    this.inInstance = false;
  }
  get absoluteTransform() { let x = 0, y = 0, n = this; while (n) { x += n.x || 0; y += n.y || 0; n = n.parent; } return [[1, 0, x], [0, 1, y]]; }
  appendChild(c) {
    if (this.type === "TEXT" || this.type === "VECTOR" || this.type === "RECTANGLE") fail("cannot append to " + this.type);
    if (this.inInstance || this.type === "INSTANCE") fail("cannot append into instance");
    if (this.type === "COMPONENT_SET" && c.type !== "COMPONENT") fail("component set children must be components");
    if (c.parent) c.parent.children.splice(c.parent.children.indexOf(c), 1);
    c.parent = this; this.children.push(c);
    if (c.type !== "TEXT" && c._lsh === "FILL" && !AUTO(this)) c._lsh = "FIXED";
  }
  resize(w, h) { if (!(w >= 0.01 && h >= 0.01)) fail(`resize(${w},${h}) invalid on ${this.name}`); this.width = w; this.height = h; }
  resizeWithoutConstraints(w, h) { this.resize(w, h); }
  rescale(s) { if (!(s > 0)) fail("rescale invalid"); this.width *= s; this.height *= s; }
  set layoutSizingHorizontal(v) { this._check(v, "H"); this._lsh = v; }
  get layoutSizingHorizontal() { return this._lsh; }
  set layoutSizingVertical(v) { this._check(v, "V"); this._lsv = v; }
  get layoutSizingVertical() { return this._lsv; }
  _check(v, axis) {
    if (!["FIXED", "HUG", "FILL"].includes(v)) fail("bad sizing " + v);
    if (v === "HUG" && !(this.type === "TEXT" || AUTO(this))) fail(`HUG on non-auto-layout ${this.type} "${this.name}"`);
    if (v === "FILL" && !AUTO(this.parent)) fail(`FILL on "${this.name}" whose parent "${this.parent && this.parent.name}" is not auto-layout`);
  }
  set characters(s) {
    if (this.type !== "TEXT") fail("characters on non-text");
    if (!loaded.has(JSON.stringify(this.fontName))) fail("font not loaded: " + JSON.stringify(this.fontName));
    if (typeof s !== "string") fail("characters must be string");
    this._chars = s; this.width = Math.max(1, s.length * 7); this.height = 20;
  }
  get characters() { return this._chars || ""; }
  findAll(fn) { const out = []; const walk = n => { for (const c of n.children) { if (fn(c)) out.push(c); walk(c); } }; walk(this); return out; }
  findOne(fn) { return this.findAll(fn)[0] || null; }
  createInstance() {
    if (this.type !== "COMPONENT") fail("createInstance on " + this.type);
    const clone = (n, root) => { const m = new Node(root ? "INSTANCE" : n.type); Object.assign(m, { name: n.name, width: n.width, height: n.height, layoutMode: n.layoutMode, fontName: n.fontName, _chars: n._chars }); m.inInstance = !root; for (const c of n.children) { const k = clone(c, false); k.parent = m; m.children.push(k); } return m; };
    const inst = clone(this, true); inst.mainComponent = this; return inst;
  }
  remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
}
// Props that are only valid on auto-layout frames
for (const p of ["itemSpacing", "primaryAxisAlignItems", "counterAxisAlignItems", "layoutWrap", "counterAxisSpacing"]) {
  Object.defineProperty(Node.prototype, p, { set(v) { if (this.layoutMode === "NONE") fail(p + " set on non-auto-layout " + this.name); if (p === "layoutWrap" && v === "WRAP" && this.layoutMode !== "HORIZONTAL") fail("WRAP needs HORIZONTAL"); this["_" + p] = v; }, get() { return this["_" + p]; } });
}
Object.defineProperty(Node.prototype, "textAutoResize", { set(v) { if (this.type !== "TEXT") fail("textAutoResize on non-text"); this._tar = v; }, get() { return this._tar; } });
Object.defineProperty(Node.prototype, "minHeight", { set(v) { if (!AUTO(this)) fail("minHeight on non-auto-layout " + this.name); this._minH = v; }, get() { return this._minH; } });
Object.defineProperty(Node.prototype, "fontName", { set(v) { if (this.type === "TEXT" && !loaded.has(JSON.stringify(v))) fail("fontName not loaded " + JSON.stringify(v)); this._font = v; }, get() { return this._font; } });

const pages = [];
const figma = {
  root: { children: pages },
  createFrame: () => new Node("FRAME"),
  createComponent: () => new Node("COMPONENT"),
  createRectangle: () => new Node("RECTANGLE"),
  createVector: () => new Node("VECTOR"),
  createText: () => { const t = new Node("TEXT"); t._font = { family: "Inter", style: "Regular" }; t.fontSize = 12; return t; },
  createSection: () => new Node("SECTION"),
  createPage: () => { const p = new Node("PAGE"); pages.push(p); return p; },
  createNodeFromSvg: (svg) => { if (!/^<svg[\s\S]*<\/svg>$/.test(svg.trim())) fail("bad svg"); const f = new Node("FRAME"); const n = (svg.match(/<(path|rect|circle|g)\b/g) || []).length; for (let i = 0; i < n; i++) f.appendChild(new Node("VECTOR")); f.resize(24, 24); return f; },
  flatten: (nodes, parent) => { if (!nodes.length) fail("flatten empty"); const v = new Node("VECTOR"); for (const n of nodes) n.remove(); (parent || nodes[0].parent).appendChild(v); return v; },
  createComponentFromNode: (n) => { const c = new Node("COMPONENT"); Object.assign(c, { name: n.name, width: n.width, height: n.height }); for (const k of [...n.children]) c.appendChild(k); const par = n.parent; if (par) { par.appendChild(c); n.remove(); } return c; },
  combineAsVariants: (comps, parent) => { for (const c of comps) if (c.type !== "COMPONENT") fail("combine non-component"); for (const c of comps) if (!/=/.test(c.name)) fail("variant name missing = " + c.name); const s = new Node("COMPONENT_SET"); for (const c of comps) s.appendChild(c); parent.appendChild(s); return s; },
  loadFontAsync: async (f) => { if (f.family === "Inter" || f.family === "Roboto Mono") loaded.add(JSON.stringify(f)); else throw new Error("no font"); },
  notify: (m) => console.log("[notify]", m),
  closePlugin: (m) => { console.log("[closePlugin]", m); done(m); },
  setCurrentPageAsync: async (p) => { if (p.type !== "PAGE") fail("not a page"); },
  viewport: { scrollAndZoomIntoView: () => {} }
};
let done;
const finished = new Promise(r => { done = r; });
const warnings = [];
const sandbox = { figma, console: { log: console.log, warn: (m) => warnings.push(m), error: (...a) => console.error("[error]", ...a.map(x => x && x.stack || x)) }, Promise, Math, JSON, String, Object, Array, Number, parseInt, setTimeout };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(process.argv[2], "utf8"), sandbox, { filename: "code.js" });
finished.then((m) => {
  console.log("pages:", pages.map(p => p.name + " [" + p.children.length + "]").join("\n  "));
  console.log("nodes created:", nodeCount, "warnings:", warnings.length);
  const uniq = [...new Set(warnings)];
  console.log(uniq.slice(0, 30).join("\n"));
  const errs = [];
  for (const p of pages) for (const n of p.findAll(n => /generation error/.test(n.name))) errs.push(n.name);
  console.log("error frames:", errs.length, errs.join("\n"));
});
