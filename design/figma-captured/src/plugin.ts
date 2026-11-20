// SafariNexa captured-design plugin (one build per portal; see build.mjs).
// Loads design/handoff/<portal>/<portal>-captured.json from GitHub main, which
// `npm run capture` records from the running app, and rebuilds every screen,
// state and journey as editable layers. Each run replaces the pages it made before.
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const PORTAL: string;
declare const SOURCE: string;

const TAG = "sn-captured";
const WEIGHT: Record<number, string> = { 100: "Thin", 200: "Extra Light", 300: "Light", 400: "Regular", 500: "Medium", 600: "Semi Bold", 700: "Bold", 800: "Extra Bold", 900: "Black" };
declare const LOGO: string;
// Colours from the hand-built SafariNexa plugins (design/figma-admin-portal/src/lib.js),
// which take them from globals.css / tailwind.config.ts.
const C = {
  white: "#FFFFFF", primary: "#087A3E", secondary: "#F4F1E9", border: "#E2E8F0", bizGreen: "#1E613C",
  s50: "#F8FAFC", s400: "#94A3B8", s500: "#64748B", s600: "#475569", s700: "#334155", s900: "#0F172A", proposed: "#7C3AED",
};
const LANE: Record<string, { name: string; color: string }> = {
  customer: { name: "Customer website", color: C.primary },
  business: { name: "Business portal", color: C.bizGreen },
  admin: { name: "Admin portal", color: C.s900 },
  system: { name: "System", color: C.s500 },
};
const KIND: Record<string, string> = { page: "Page", tab: "Tab", dialog: "Dialog", menu: "Menu" };

let IMAGES: Record<string, string> = {};
const imageHash = new Map<string, string>();
const fontOk = new Map<string, FontName>();

// ------------------------------------------------------------------ helpers
function rgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
}
function solid(hex: string, opacity = 1): SolidPaint {
  return { type: "SOLID", color: rgb(hex), opacity };
}
async function font(family: string, weight: number, italic: boolean): Promise<FontName> {
  const style = (WEIGHT[Math.min(900, Math.max(100, Math.round(weight / 100) * 100))] || "Regular") + (italic ? " Italic" : "");
  const want = /inter/i.test(family) ? "Inter" : /^(system-ui|-apple-system|blinkmacsystemfont|sf pro|ui-sans-serif)/i.test(family) ? "SF Pro" : family;
  const key = want + "|" + style;
  const hit = fontOk.get(key);
  if (hit) return hit;
  const tries: FontName[] = [{ family: want, style }, { family: want, style: style.replace("Semi Bold", "Semibold") }, { family: "Inter", style }, { family: "Inter", style: "Regular" }];
  for (const f of tries) {
    try {
      await figma.loadFontAsync(f);
      fontOk.set(key, f);
      return f;
    } catch {
      // Next fallback.
    }
  }
  return { family: "Inter", style: "Regular" };
}
function cssColor(c: string): { color: RGB; a: number } | null {
  const m = String(c || "").match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { color: { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255 }, a: p.length > 3 ? p[3] : 1 };
}
function cssPaint(c: string): SolidPaint | null {
  const x = cssColor(c);
  return x && x.a > 0 ? { type: "SOLID", color: x.color, opacity: x.a } : null;
}
function cssGradient(g: string): GradientPaint | null {
  const m = g.match(/linear-gradient\((.*)\)$/);
  if (!m) return null;
  const parts = m[1].split(/,(?![^(]*\))/).map((s) => s.trim());
  let deg = 180;
  if (/deg$/.test(parts[0])) deg = parseFloat(parts.shift() as string);
  else if (/^to /.test(parts[0])) {
    const d = parts.shift() as string;
    deg = /right/.test(d) ? 90 : /left/.test(d) ? 270 : /top/.test(d) ? 0 : 180;
  }
  const stops = parts.map((s, i) => {
    const col = cssColor(s);
    const pos = s.match(/([\d.]+)%\s*$/);
    const c = col ? col.color : { r: 0, g: 0, b: 0 };
    return { position: pos ? parseFloat(pos[1]) / 100 : i / Math.max(1, parts.length - 1), color: { r: c.r, g: c.g, b: c.b, a: col ? col.a : 1 } };
  });
  const a = (deg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const L = Math.abs(dx) + Math.abs(dy);
  return {
    type: "GRADIENT_LINEAR",
    gradientStops: stops,
    gradientTransform: [
      [dx / L, dy / L, 0.5 - (0.5 * dx + 0.5 * dy) / L],
      [-dy / L, dx / L, 0.5 - (-0.5 * dy + 0.5 * dx) / L],
    ],
  };
}
function cssShadows(s: string): Effect[] {
  const out: Effect[] = [];
  s.split(/,(?![^(]*\))/).forEach((one) => {
    const col = cssColor(one);
    const nums = (one.replace(/rgba?\([^)]*\)/, "").match(/-?[\d.]+px/g) || []).map(parseFloat);
    if (!col || nums.length < 2 || col.a === 0) return;
    out.push({ type: /inset/.test(one) ? "INNER_SHADOW" : "DROP_SHADOW", color: { r: col.color.r, g: col.color.g, b: col.color.b, a: col.a }, offset: { x: nums[0], y: nums[1] }, radius: nums[2] || 0, spread: nums[3] || 0, visible: true, blendMode: "NORMAL" });
  });
  return out;
}
// Images are shared across screens in the bundle ("#<key>" → IMAGES[key]).
function imagePaint(ref: string, mode: "FILL" | "FIT"): ImagePaint | null {
  if (!ref) return null;
  const data = ref.charAt(0) === "#" ? IMAGES[ref.slice(1)] : ref;
  let hash = imageHash.get(ref);
  if (!hash) {
    const b64 = String(data || "").split(",")[1];
    if (!b64) return null;
    try {
      hash = figma.createImage(figma.base64Decode(b64)).hash;
      imageHash.set(ref, hash);
    } catch {
      return null;
    }
  }
  return { type: "IMAGE", imageHash: hash, scaleMode: mode };
}

// ------------------------------------------------------- captured screens
async function capNode(n: any, parent: FrameNode, ox: number, oy: number, maxY: number): Promise<void> {
  if (n.y > maxY) return;
  if (n.k === "text") {
    const t = figma.createText();
    const st = n.st;
    t.fontName = await font(st.f, st.w, !!st.i);
    t.characters = st.tt === "uppercase" ? n.t.toUpperCase() : st.tt === "lowercase" ? n.t.toLowerCase() : st.tt === "capitalize" ? n.t.replace(/\b\w/g, (c: string) => c.toUpperCase()) : n.t;
    t.fontSize = Math.max(1, st.s);
    const p = cssPaint(st.c);
    t.fills = p ? [p] : [];
    if (st.lh) t.lineHeight = { value: st.lh, unit: "PIXELS" };
    if (st.ls) t.letterSpacing = { value: st.ls, unit: "PIXELS" };
    if (st.td === "underline") t.textDecoration = "UNDERLINE";
    if (st.td === "line-through") t.textDecoration = "STRIKETHROUGH";
    t.name = n.t.slice(0, 40);
    parent.appendChild(t);
    if (n.lines > 1) {
      t.textAlignHorizontal = st.a === "center" ? "CENTER" : st.a === "right" || st.a === "end" ? "RIGHT" : "LEFT";
      t.resize(Math.ceil(n.w) + 1, Math.max(1, n.h));
      t.textAutoResize = "HEIGHT";
    } else t.textAutoResize = "WIDTH_AND_HEIGHT";
    t.x = n.x - ox;
    t.y = n.y - oy + (n.lines > 1 ? 0 : (n.h - t.height) / 2);
    return;
  }
  if (n.k === "svg") {
    try {
      const v = figma.createNodeFromSvg(n.svg);
      v.name = n.n && n.n !== "svg" ? n.n : "Icon";
      parent.appendChild(v);
      v.x = n.x - ox;
      v.y = n.y - oy;
      if (n.o !== undefined && n.o < 1) v.opacity = n.o;
    } catch {
      // Unsupported SVG feature: skip the icon rather than fail the screen.
    }
    return;
  }
  if (n.k === "img") {
    const r = figma.createRectangle();
    r.name = n.n && n.n !== "img" ? n.n : "Image";
    r.resize(Math.max(1, n.w), Math.max(1, n.h));
    const paint = imagePaint(n.data, n.fit === "contain" ? "FIT" : "FILL");
    r.fills = paint ? [paint] : [solid("#E5E7EB")];
    if (n.r) r.cornerRadius = n.r;
    if (n.o !== undefined && n.o < 1) r.opacity = n.o;
    parent.appendChild(r);
    r.x = n.x - ox;
    r.y = n.y - oy;
    return;
  }
  const f = figma.createFrame();
  f.name = n.n && n.n !== "div" ? n.n : "Box";
  f.resize(Math.max(0.01, n.w), Math.max(0.01, n.h));
  const fills: Paint[] = [];
  const bg = n.bg && cssPaint(n.bg);
  if (bg) fills.push(bg);
  const gr = n.grad && cssGradient(n.grad);
  if (gr) fills.push(gr);
  const im = n.bgImg && imagePaint(n.bgImg, /contain/.test(n.bgSize || "") ? "FIT" : "FILL");
  if (im) fills.push(im);
  f.fills = fills;
  if (n.rad) {
    f.topLeftRadius = n.rad[0];
    f.topRightRadius = n.rad[1];
    f.bottomRightRadius = n.rad[2];
    f.bottomLeftRadius = n.rad[3];
  }
  if (n.bw) {
    const sp = cssPaint(n.bc);
    if (sp) {
      f.strokes = [sp];
      f.strokeAlign = "INSIDE";
      f.strokeTopWeight = n.bw[0];
      f.strokeRightWeight = n.bw[1];
      f.strokeBottomWeight = n.bw[2];
      f.strokeLeftWeight = n.bw[3];
      if (n.dash) f.dashPattern = [4, 4];
    }
  }
  if (n.sh) f.effects = cssShadows(n.sh);
  if (n.o !== undefined) f.opacity = n.o;
  f.clipsContent = !!n.clip;
  parent.appendChild(f);
  f.x = n.x - ox;
  f.y = n.y - oy;
  for (const k of n.kids || []) await capNode(k, f, n.x, n.y, maxY);
}
// maxH crops long pages (used for flow thumbnails, which only show the top).
async function drawCapture(cap: any, name: string, maxH = Infinity): Promise<FrameNode> {
  const f = figma.createFrame();
  f.name = name;
  f.resize(cap.w, Math.min(cap.h, maxH));
  const bg = cssPaint(cap.bg);
  f.fills = bg ? [bg] : [solid("#FFFFFF")];
  f.clipsContent = true;
  for (const k of cap.kids || []) await capNode(k, f, 0, 0, maxH);
  return f;
}

// ------------------------------------------------------------- page layout
// Same layout as the hand-built SafariNexa plugins: a page header, one Figma
// section per page ("07.1 · Bookings"), numbered captions ("07.1.2") above each frame.
const GAP_X = 120;
const GAP_Y = 240;
const PAD = 120;

type Opts = { w?: number; h?: number; gap?: number; pad?: number; px?: number; py?: number; fill?: string; stroke?: string; radius?: number; wrap?: boolean; name?: string };
function stack(dir: "VERTICAL" | "HORIZONTAL", o: Opts, kids: (SceneNode | null)[]): FrameNode {
  const f = figma.createFrame();
  f.name = o.name || (dir === "VERTICAL" ? "Stack" : "Row");
  f.layoutMode = dir;
  f.itemSpacing = o.gap || 0;
  f.paddingTop = f.paddingBottom = o.py !== undefined ? o.py : o.pad || 0;
  f.paddingLeft = f.paddingRight = o.px !== undefined ? o.px : o.pad || 0;
  f.fills = o.fill ? [solid(o.fill)] : [];
  if (o.stroke) f.strokes = [solid(o.stroke)];
  if (o.radius) f.cornerRadius = o.radius;
  if (dir === "HORIZONTAL") f.counterAxisAlignItems = "CENTER";
  if (o.wrap) f.layoutWrap = "WRAP";
  for (const k of kids) if (k) f.appendChild(k);
  f.primaryAxisSizingMode = o.w && dir === "HORIZONTAL" ? "FIXED" : "AUTO";
  f.counterAxisSizingMode = o.w && dir === "VERTICAL" ? "FIXED" : "AUTO";
  if (o.w) f.resize(o.w, Math.max(1, f.height));
  if (o.wrap) f.counterAxisSpacing = o.gap || 0;
  return f;
}
const V = (o: Opts, kids: (SceneNode | null)[]) => stack("VERTICAL", o, kids);
const H = (o: Opts, kids: (SceneNode | null)[]) => stack("HORIZONTAL", o, kids);
async function T(chars: string, size: number, weight = 400, color: string = C.s900, width?: number, lh?: number): Promise<TextNode> {
  const t = figma.createText();
  t.fontName = await font("Inter", weight, false);
  t.characters = chars || " ";
  t.fontSize = size;
  t.fills = [solid(color)];
  if (lh) t.lineHeight = { value: lh, unit: "PIXELS" };
  else if (width) t.lineHeight = { value: 150, unit: "PERCENT" };
  if (width) {
    t.resize(width, t.height);
    t.textAutoResize = "HEIGHT";
  }
  return t;
}
function own<N extends SceneNode | PageNode>(n: N): N {
  n.setPluginData(TAG, PORTAL);
  return n;
}
async function newPage(name: string): Promise<PageNode> {
  const p = own(figma.createPage());
  p.name = name;
  await figma.setCurrentPageAsync(p);
  return p;
}
let progress: NotificationHandler | null = null;
function say(msg: string): void {
  if (progress) progress.cancel();
  progress = figma.notify(msg, { timeout: Infinity });
}
function logo(height: number): SceneNode | null {
  try {
    const l = figma.createNodeFromSvg(LOGO);
    l.name = "Logo";
    l.rescale(height / l.height);
    return l;
  } catch {
    return null;
  }
}
function makeSection(page: PageNode, name: string, x: number, y: number, w: number, h: number): SectionNode | FrameNode {
  let s: SectionNode | FrameNode;
  try {
    s = figma.createSection();
    s.name = name;
    s.resizeWithoutConstraints(w, h);
  } catch {
    s = figma.createFrame();
    s.name = name;
    s.resize(w, h);
    s.cornerRadius = 24;
  }
  s.fills = [solid("#F1F3F5")];
  page.appendChild(s);
  s.x = x;
  s.y = y;
  return s;
}
const describe = (s: any): string =>
  [s.purpose, s.kind === "page" ? s.route + (s.redirect ? " → redirects to " + s.redirect : "") + (s.signedOut ? " · signed out" : "") : (KIND[s.kind] || "State") + " on " + s.route].filter(Boolean).join("\n");
async function caption(num: string, title: string, note: string, w: number): Promise<FrameNode> {
  return V({ name: "Caption · " + num, w, gap: 10 }, [
    H({ px: 0, gap: 12 }, [H({ px: 12, py: 6, radius: 8, fill: C.s900 }, [await T(num, 20, 700, C.white)]), await T(title, 32, 700)]),
    note ? await T(note, 18, 400, C.s600, Math.min(w, 1300)) : null,
  ]);
}
const count = (g: any) => g.sections.reduce((n: number, s: any) => n + s.screens.length, 0);
async function pageHeader(bundle: any, g: any): Promise<FrameNode> {
  const chips: SceneNode[] = [];
  for (let i = 0; i < g.sections.length; i++) {
    const s = g.sections[i];
    chips.push(
      H({ gap: 10, px: 20, py: 14, radius: 14, fill: C.white, stroke: C.border }, [
        await T(g.id + "." + (i + 1), 18, 700, C.primary),
        await T(s.title + "  (" + s.screens.length + ")", 18, 500, C.s700),
        i < g.sections.length - 1 ? await T("→", 22, 400, C.s400) : null,
      ]),
    );
  }
  // A white card, like the cover and journey boards, so it reads on a dark canvas too.
  return V({ name: "Flow header", w: 2400, gap: 20, pad: 64, fill: C.white, stroke: C.border, radius: 32 }, [
    await T(bundle.eyebrow, 24, 600, C.primary),
    await T(g.id + " · " + g.name, 72, 700, C.s900, undefined, 80),
    g.routes.length ? await T(g.routes.join(" · "), 24, 400, C.s500, 2400 - 128) : null,
    await T(count(g) + " screens & states · captured from the running app on " + new Date(bundle.generatedAt).toLocaleDateString(), 20, 400, C.s500),
    H({ gap: 16, wrap: true, w: 2400 - 128 }, chips),
  ]);
}

async function buildGroup(bundle: any, g: any): Promise<string[]> {
  const page = await newPage(g.id + " · " + g.name);
  const header = await pageHeader(bundle, g);
  page.appendChild(header);
  const index: string[] = [];
  let y = header.height + 160;
  for (let si = 0; si < g.sections.length; si++) {
    const sec = g.sections[si];
    const built: { node: FrameNode; cap: FrameNode }[] = [];
    for (let i = 0; i < sec.screens.length; i++) {
      const s = sec.screens[i];
      const num = g.id + "." + (si + 1) + "." + (i + 1);
      say(`${g.id} · ${g.name}: ${s.name}`);
      const cap = bundle.captures[s.id];
      const node = await drawCapture(cap, num + " — " + s.name);
      built.push({ node, cap: await caption(num, s.name, describe(s), cap.w) });
      index.push(num + "  " + s.name);
    }
    const capH = Math.max(...built.map((b) => b.cap.height));
    const maxH = Math.max(...built.map((b) => b.node.height));
    const w = PAD * 2 + built.reduce((n, b) => n + b.node.width, 0) + GAP_X * (built.length - 1);
    const h = PAD * 2 + 80 + capH + 48 + maxH;
    const section = makeSection(page, g.id + "." + (si + 1) + " · " + sec.title, 0, y, w, h);
    const title = await T(g.id + "." + (si + 1) + "  " + sec.title + (sec.route ? "   " + sec.route : ""), 40, 700);
    section.appendChild(title);
    title.x = PAD;
    title.y = PAD - 40;
    let x = PAD;
    for (const b of built) {
      section.appendChild(b.cap);
      b.cap.x = x;
      b.cap.y = PAD + 60;
      section.appendChild(b.node);
      b.node.x = x;
      b.node.y = PAD + 80 + capH + 48;
      x += b.node.width + GAP_X;
    }
    y += h + GAP_Y;
  }
  return index;
}

// ------------------------------------------------------------------- journeys
async function arrow(parent: FrameNode, x1: number, y: number, x2: number, color: string): Promise<void> {
  const v = figma.createVector();
  v.name = "Arrow";
  parent.appendChild(v);
  await v.setVectorNetworkAsync({ vertices: [{ x: x1, y }, { x: x2, y, strokeCap: "ARROW_EQUILATERAL" }], segments: [{ start: 0, end: 1 }] });
  v.strokes = [solid(color)];
  v.strokeWeight = 3;
}
const CARD_W = 760;
async function flowBoard(bundle: any, flow: any, num: string): Promise<FrameNode> {
  const board = figma.createFrame();
  board.name = num + " · " + flow.title;
  board.fills = [solid(C.white)];
  board.strokes = [solid(C.border)];
  board.cornerRadius = 32;
  const head = V({ gap: 16, w: Math.max(1600, Math.min(3200, flow.steps.length * (CARD_W + GAP_X))) }, [
    await T(num + " · " + flow.title, 48, 700),
    await T(flow.summary || "", 20, 400, C.s600, Math.min(2400, Math.max(1500, flow.steps.length * (CARD_W + GAP_X)))),
    H({ gap: 12 }, await Promise.all(["customer", "business", "admin", "system"].filter((l) => flow.steps.some((s: any) => s.lane === l)).map(async (l) => H({ px: 14, py: 6, radius: 999, fill: LANE[l].color }, [await T(LANE[l].name, 16, 500, C.white)])))),
  ]);
  board.appendChild(head);
  head.x = 64;
  head.y = 64;
  const top = head.y + head.height + 56;
  let x = 64;
  let maxH = 0;
  const cards: FrameNode[] = [];
  for (let i = 0; i < flow.steps.length; i++) {
    const st = flow.steps[i];
    say(`${flow.title}: step ${i + 1} of ${flow.steps.length}`);
    const lane = LANE[st.lane] || LANE.system;
    const cap = st.screen && bundle.captures[st.screen];
    let shot: FrameNode | null = null;
    if (cap) {
      // The screen as the user first sees it (window height).
      shot = await drawCapture(cap, num + "." + (i + 1) + " — " + st.screen, 900);
      shot.rescale((CARD_W - 40) / cap.w);
      shot.strokes = [solid(C.border)];
    }
    const card = V({ name: "Step " + (i + 1), w: CARD_W, gap: 14, pad: 20, fill: C.white, stroke: lane.color, radius: 20 }, [
      H({ gap: 10 }, [H({ px: 12, py: 6, radius: 8, fill: C.s900 }, [await T(num + "." + (i + 1), 18, 700, C.white)]), H({ px: 12, py: 6, radius: 999, fill: lane.color }, [await T(lane.name, 14, 600, C.white)])]),
      await T(st.label, 20, 600, C.s900, CARD_W - 40),
      st.api ? await T(st.api, 15, 500, C.s500, CARD_W - 40) : null,
      shot,
      st.route ? await T(st.route, 14, 500, C.s500) : null,
    ]);
    card.strokeWeight = 2;
    board.appendChild(card);
    card.x = x;
    card.y = top;
    cards.push(card);
    maxH = Math.max(maxH, card.height);
    x += CARD_W + GAP_X;
  }
  for (let i = 1; i < cards.length; i++) await arrow(board, cards[i - 1].x + CARD_W + 16, top + 40, cards[i].x - 16, (LANE[flow.steps[i].lane] || LANE.system).color);
  board.resize(Math.max(x - GAP_X + 64, head.width + 128), top + maxH + 64);
  return board;
}
async function buildFlows(bundle: any, id: string): Promise<string[]> {
  await newPage(id + " · Journeys");
  const index: string[] = [];
  let y = 0;
  for (let i = 0; i < bundle.flows.length; i++) {
    const num = id + "." + (i + 1);
    const b = await flowBoard(bundle, bundle.flows[i], num);
    figma.currentPage.appendChild(b);
    b.y = y;
    y += b.height + GAP_Y;
    index.push(num + "  " + bundle.flows[i].title);
  }
  return index;
}

// ---------------------------------------------------------------------- cover
async function buildCover(bundle: any, page: PageNode, rows: { id: string; name: string; routes: string; index: string[] }[]): Promise<FrameNode> {
  await figma.setCurrentPageAsync(page);
  const total = rows.reduce((n, r) => n + r.index.length, 0);
  const cover = V({ name: "Cover", w: 1920, pad: 96, gap: 24, fill: C.white, radius: 32, stroke: C.border }, [
    logo(56),
    await T(bundle.cover, 80, 700, C.s900, undefined, 88),
    await T(
      "Captured SafariNexa screens, states and scripted journeys rebuilt as editable layers. " + total + (total === 1 ? " frame" : " frames") + " across " + rows.length + (rows.length === 1 ? " page." : " pages.") + " Run `npm run capture` in Prototype and push to main, then run this plugin again to refresh; it replaces the pages it made and leaves your own pages alone.",
      24,
      400,
      C.s600,
      1500,
    ),
    H({ gap: 16 }, [
      H({ px: 16, py: 10, radius: 999, fill: C.s900 }, [await T("1440 × full-length desktop frames", 16, 500, C.white)]),
      H({ px: 16, py: 10, radius: 999, fill: C.primary }, [await T("Captured " + new Date(bundle.generatedAt).toLocaleString() + (bundle.commit ? " · commit " + bundle.commit : ""), 16, 500, C.white)]),
    ]),
  ]);
  page.appendChild(cover);
  const rowNodes: SceneNode[] = [];
  for (const r of rows) {
    const chain: SceneNode[] = [];
    for (let j = 0; j < r.index.length; j++)
      chain.push(H({ gap: 8 }, [H({ px: 12, py: 8, radius: 10, fill: C.s50, stroke: C.border }, [await T(r.index[j], 14, 500, C.s700)]), j < r.index.length - 1 ? await T("→", 16, 400, C.s400) : null]));
    rowNodes.push(
      V({ name: "Flow row · " + r.name, gap: 12, w: 3472 }, [
        H({ gap: 12 }, [H({ px: 10, py: 4, radius: 8, fill: C.primary }, [await T(r.id, 18, 700, C.white)]), await T(r.name, 24, 700), await T(r.routes, 14, 400, C.s500)]),
        H({ gap: 8, wrap: true, w: 3472 }, chain),
      ]),
    );
  }
  const map = V({ name: "Flow map", w: 3600, pad: 64, gap: 28, fill: C.white, radius: 32, stroke: C.border }, [await T("Flow map", 48, 700), await T(bundle.entry, 20, 400, C.s600, 2400), ...rowNodes]);
  page.appendChild(map);
  map.y = cover.height + 120;
  return cover;
}

async function run(): Promise<void> {
  say("Loading the latest captured designs from GitHub…");
  let bundle: any;
  try {
    const res = await fetch(SOURCE + "?t=" + Date.now());
    if (!res.ok) throw new Error("HTTP " + res.status);
    bundle = await res.json();
  } catch (e) {
    figma.closePlugin("Couldn't load the captured designs from GitHub (" + String(e) + "). Check your connection and run the plugin again.");
    return;
  }
  if (!bundle || bundle.portal !== PORTAL || !Array.isArray(bundle.groups)) {
    figma.closePlugin("The file on GitHub isn't a " + PORTAL + " capture bundle.");
    return;
  }
  IMAGES = bundle.images || {};
  await figma.loadAllPagesAsync();
  // This plugin's previous pages, plus the hand-built plugin's pages they supersede
  // (matched by name: another plugin's markers can't be read). "00 · Design system" stays.
  const legacy = new Set<string>(bundle.legacy || []);
  const old = figma.root.children.filter((p) => p.getPluginData(TAG) === PORTAL || legacy.has(p.name));
  const coverPage = await newPage("00 · Cover & flow map");
  const rows: { id: string; name: string; routes: string; index: string[] }[] = [];
  for (const g of bundle.groups) rows.push({ id: g.id, name: g.name, routes: g.routes.join(" · "), index: await buildGroup(bundle, g) });
  if (bundle.flows.length) {
    const id = String(Number(bundle.groups[bundle.groups.length - 1].id) + 1).padStart(2, "0");
    rows.push({ id, name: "Journeys", routes: "Step-by-step flows across the customer website, business and admin portals", index: await buildFlows(bundle, id) });
  }
  const cover = await buildCover(bundle, coverPage, rows);
  // Swap: remove the previous run's pages only once the new ones exist.
  for (const p of old) p.remove();
  await figma.setCurrentPageAsync(coverPage);
  figma.viewport.scrollAndZoomIntoView([cover]);
  if (progress) progress.cancel();
  figma.closePlugin(`Done: ${rows.length} pages captured on ${new Date(bundle.generatedAt).toLocaleString()}.`);
}

run().catch((e) => figma.closePlugin("Generation failed: " + String((e && e.message) || e)));
