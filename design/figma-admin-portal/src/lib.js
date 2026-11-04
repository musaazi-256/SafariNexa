// SafariNexa Admin Portal → Figma generator: primitives, tokens, components.
// Mirrors Prototype/src/app/globals.css + tailwind.config.ts + components/ui/*.

const SCREEN_W = 1440;
const SIDEBAR_W = 256;
const CONTENT_PAD = 24;
const CONTENT_W = SCREEN_W - SIDEBAR_W - CONTENT_PAD * 2; // 1136

const C = {
  white: "#FFFFFF",
  fg: "#151A17",
  primary: "#087A3E",
  primaryDark: "#0C763A",
  secondary: "#F4F1E9",
  secondaryFg: "#0B4928",
  mutedBg: "#F3F1EC",
  muted: "#6B6F68",
  accent: "#FFCE06",
  destructive: "#BB1B1B",
  success: "#1E8A4F",
  successSoft: "#ECF8F1",
  warning: "#F59E0B",
  warningFg: "#171C19",
  border: "#E2E8F0",
  input: "#94A3B8",
  sidebar: "#FAFAFA",
  sidebarAccent: "#F4F4F5",
  sidebarFg: "#3F3F46",
  sidebarBorder: "#E5E7EB",
  s50: "#F8FAFC", s100: "#F1F5F9", s200: "#E2E8F0", s300: "#CBD5E1", s400: "#94A3B8",
  s500: "#64748B", s600: "#475569", s700: "#334155", s800: "#1E293B", s900: "#0F172A",
  emerald100: "#D1FAE5", emerald600: "#059669", emerald800: "#065F46",
  amber600: "#D97706", orange600: "#EA580C", red50: "#FEF2F2", red100: "#FEE2E2", red600: "#DC2626",
  link: "#286047", chat: "#0B4928", chatBg: "#FAFBFA", bizTint: "#E4F2E8", bizGreen: "#1E613C",
  proposed: "#7C3AED"
};

const DOT = { success: "#6B967B", warning: "#B39562", destructive: "#B67D7D", default: "#78918A", secondary: "#94A3B8" };

function rgb(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
}
function paint(hex, opacity) {
  return [{ type: "SOLID", color: rgb(hex), opacity: opacity == null ? 1 : opacity }];
}
function gradient(a, b) {
  const ca = rgb(a), cb = rgb(b);
  return [{ type: "GRADIENT_LINEAR", gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [
    { position: 0, color: { r: ca.r, g: ca.g, b: ca.b, a: 1 } },
    { position: 1, color: { r: cb.r, g: cb.g, b: cb.b, a: 1 } }
  ] }];
}
function shadow(y, blur, alpha, spread, base) {
  const c = rgb(base || "#0F172A");
  return { type: "DROP_SHADOW", color: { r: c.r, g: c.g, b: c.b, a: alpha }, offset: { x: 0, y: y }, radius: blur, spread: spread || 0, visible: true, blendMode: "NORMAL" };
}
const SHADOWS = {
  card: [shadow(1, 3, 0.04)],
  sm: [shadow(1, 2, 0.05, 0, "#000000")],
  md: [shadow(3, 10, 0.07)],
  floating: [shadow(20, 40, 0.16, -10, "#000000"), shadow(8, 16, 0.08, -4, "#000000")]
};

// ---------- auto-layout engine ----------
const PENDING_FILL = [];
function markFill(node, h, v) { PENDING_FILL.push({ node: node, h: h, v: v }); }
function depthOf(n) { let d = 0; while (n.parent) { d++; n = n.parent; } return d; }
function applyFills() {
  const list = PENDING_FILL.splice(0, PENDING_FILL.length);
  list.sort(function (a, b) { return depthOf(a.node) - depthOf(b.node); });
  for (const p of list) {
    const parent = p.node.parent;
    if (!parent) { PENDING_FILL.push(p); continue; }
    if (!("layoutMode" in parent) || parent.layoutMode === "NONE") continue;
    try {
      if (p.h) p.node.layoutSizingHorizontal = "FILL";
      if (p.v) p.node.layoutSizingVertical = "FILL";
      if (p.node.type === "TEXT" && p.h) p.node.textAutoResize = "HEIGHT";
    } catch (e) { console.warn("fill failed on " + p.node.name + ": " + e.message); }
  }
}

const MAIN = { start: "MIN", center: "CENTER", end: "MAX", between: "SPACE_BETWEEN" };
const CROSS = { start: "MIN", center: "CENTER", end: "MAX", baseline: "BASELINE" };

function pads(o) {
  if (Array.isArray(o.pad)) return o.pad.length === 2 ? [o.pad[0], o.pad[1], o.pad[0], o.pad[1]] : o.pad;
  const p = o.pad || 0;
  const py = o.py != null ? o.py : p, px = o.px != null ? o.px : p;
  return [o.pt != null ? o.pt : py, o.pr != null ? o.pr : px, o.pb != null ? o.pb : py, o.pl != null ? o.pl : px];
}

/** Auto-layout frame. o.dir: "V" (default) | "H" | "NONE". */
function F(o, kids) {
  if (Array.isArray(o)) { kids = o; o = {}; }
  o = o || {};
  kids = (kids || []).flat(Infinity).filter(Boolean);
  const f = o.component ? figma.createComponent() : figma.createFrame();
  f.name = o.name || (o.dir === "H" ? "Row" : "Stack");
  f.fills = o.gradient ? o.gradient : o.fill ? paint(o.fill, o.fo) : [];
  f.clipsContent = !!o.clip;
  if (o.dir !== "NONE") {
    f.layoutMode = o.dir === "H" ? "HORIZONTAL" : "VERTICAL";
    f.itemSpacing = o.gap || 0;
    const p = pads(o);
    f.paddingTop = p[0]; f.paddingRight = p[1]; f.paddingBottom = p[2]; f.paddingLeft = p[3];
    f.primaryAxisAlignItems = MAIN[o.main || "start"];
    f.counterAxisAlignItems = CROSS[o.cross || "start"];
    if (o.wrap) { f.layoutWrap = "WRAP"; f.counterAxisSpacing = o.rowGap != null ? o.rowGap : (o.gap || 0); }
  }
  if (o.radius != null) f.cornerRadius = o.radius;
  if (o.stroke) {
    f.strokes = paint(o.stroke, o.so);
    f.strokeAlign = "INSIDE";
    if (o.sides) {
      f.strokeTopWeight = o.sides.t || 0; f.strokeRightWeight = o.sides.r || 0;
      f.strokeBottomWeight = o.sides.b || 0; f.strokeLeftWeight = o.sides.l || 0;
    } else f.strokeWeight = o.sw || 1;
    if (o.dash) f.dashPattern = [4, 4];
  }
  if (o.shadow) f.effects = SHADOWS[o.shadow];
  if (o.opacity != null) f.opacity = o.opacity;
  for (const k of kids) f.appendChild(k);
  if (o.dir === "NONE") {
    f.resize(o.w || 100, o.h || 100);
  } else {
    if (o.w) { f.resize(o.w, Math.max(1, f.height)); f.layoutSizingHorizontal = "FIXED"; } else f.layoutSizingHorizontal = "HUG";
    if (o.h) { f.resize(Math.max(1, f.width), o.h); f.layoutSizingVertical = "FIXED"; } else f.layoutSizingVertical = "HUG";
  }
  if (o.minH) f.minHeight = o.minH;
  if (o.fillW || o.fillH) markFill(f, !!o.fillW, !!o.fillH);
  return f;
}
function H(o, kids) { if (Array.isArray(o)) { kids = o; o = {}; } return F(Object.assign({ dir: "H", cross: "center" }, o), kids); }
function V(o, kids) { if (Array.isArray(o)) { kids = o; o = {}; } return F(Object.assign({ dir: "V" }, o), kids); }
function spacer(w, h) { return F({ name: "Spacer", w: w || 1, h: h || 1 }); }
function grow(o) { return F(Object.assign({ name: "Spacer", h: 1, fillW: true }, o || {})); }
function hr(color, o) { return F(Object.assign({ name: "Divider", h: 1, fill: color || C.border, fillW: true }, o || {})); }
function dot(size, color) { return F({ name: "Dot", w: size, h: size, radius: size / 2, fill: color }); }

// ---------- text ----------
const STYLE = { 400: "Regular", 500: "Medium", 600: "Semi Bold", 700: "Bold" };
const LH = { 11: 16, 12: 16, 13: 20, 14: 20, 15: 22, 16: 24, 18: 28, 20: 28, 24: 32, 30: 36, 36: 40 };
let MONO = { family: "Inter", style: "Regular" };

function T(s, o) {
  o = o || {};
  const t = figma.createText();
  const weight = o.w || 400;
  t.fontName = o.mono ? MONO : { family: "Inter", style: o.italic ? (weight === 400 ? "Italic" : STYLE[weight] + " Italic") : STYLE[weight] };
  t.characters = String(s);
  t.fontSize = o.size || 14;
  t.fills = paint(o.color || C.fg, o.opacity);
  if (o.relaxed) t.lineHeight = { value: 162.5, unit: "PERCENT" };
  else if (o.lh) t.lineHeight = { value: o.lh, unit: "PIXELS" };
  else if (LH[t.fontSize]) t.lineHeight = { value: o.tight ? Math.round(t.fontSize * 1.25) : LH[t.fontSize], unit: "PIXELS" };
  if (o.ls) t.letterSpacing = { value: o.ls, unit: "PERCENT" };
  if (o.upper) t.textCase = "UPPER";
  if (o.capitalize) t.textCase = "TITLE";
  if (o.underline) t.textDecoration = "UNDERLINE";
  if (o.strike) t.textDecoration = "STRIKETHROUGH";
  if (o.align) t.textAlignHorizontal = o.align === "center" ? "CENTER" : o.align === "right" ? "RIGHT" : "LEFT";
  t.textAutoResize = "WIDTH_AND_HEIGHT";
  if (o.width) { t.resize(o.width, Math.max(1, t.height)); t.textAutoResize = "HEIGHT"; }
  if (o.fillW) markFill(t, true, false);
  t.name = o.name || String(s).slice(0, 40);
  return t;
}
// Typography presets from globals.css
const type = {
  page: function (s, o) { return T(s, Object.assign({ size: 30, w: 600, lh: 36, ls: -2.5, color: C.fg }, o)); },
  section: function (s, o) { return T(s, Object.assign({ size: 24, w: 600, lh: 32, ls: -2.5 }, o)); },
  card: function (s, o) { return T(s, Object.assign({ size: 18, w: 600, lh: 24, ls: -2.5 }, o)); },
  eyebrow: function (s, o) { return T(s, Object.assign({ size: 12, w: 500, lh: 20, upper: true, ls: 5, color: C.primary }, o)); },
  body: function (s, o) { return T(s, Object.assign({ size: 14, relaxed: true, color: C.muted }, o)); },
  caption: function (s, o) { return T(s, Object.assign({ size: 12, lh: 20, color: C.s500 }, o)); }
};

// ---------- icons (lucide geometry, 24×24 stroke 2) ----------
const SHIELD = '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>';
const CAL = '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>';
const ICONS = {
  "layout-dashboard": '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  "building-2": '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  "shield-check": SHIELD + '<path d="m9 12 2 2 4-4"/>',
  "shield-x": SHIELD + '<path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/>',
  "shield-alert": SHIELD + '<path d="M12 8v4"/><path d="M12 16h.01"/>',
  "clipboard-check": '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
  "banknote": '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  "key-round": '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5"/>',
  "star": '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  "life-buoy": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/>',
  "gauge": '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  "bell": '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  "bell-off": '<path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5"/><path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="m2 2 20 20"/>',
  "settings": '<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  "user-circle": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>',
  "user": '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  "filter": '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  "calendar": CAL,
  "calendar-check": CAL + '<path d="m9 16 2 2 4-4"/>',
  "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  "chevron-left": '<path d="m15 18-6-6 6-6"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  "mail": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  "external-link": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  "send": '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  "trending-up": '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  "percent": '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  "landmark": '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 20 7H4z"/>',
  "undo-2": '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
  "x-circle": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
  "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  "book-open": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  "panel-left": '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
  "credit-card": '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  "square": '<rect x="3" y="3" width="18" height="18" rx="2"/>',
  "check": '<path d="M20 6 9 17l-5-5"/>',
  "check-check": '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
  "loader": '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  "alert-triangle": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  "image": '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  "google": '<circle cx="12" cy="12" r="9"/><path d="M12 12h8"/>'
};
const ICON_COMPS = {};

function svgDoc(inner) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
}
function setScaleConstraints(node) {
  if ("constraints" in node) { try { node.constraints = { horizontal: "SCALE", vertical: "SCALE" }; } catch (e) {} }
  if ("children" in node) for (const c of node.children) setScaleConstraints(c);
}
function buildIconLibrary(page) {
  const holder = H({ name: "Icons (lucide)", gap: 16, wrap: true, w: 760, pad: 24, fill: C.white, radius: 16, stroke: C.border, rowGap: 16 }, []);
  for (const name of Object.keys(ICONS)) {
    try {
      const node = figma.createNodeFromSvg(svgDoc(ICONS[name]));
      if (node.children.length > 1) { try { figma.flatten(node.children.slice(), node); } catch (e) {} }
      node.fills = [];
      const comp = figma.createComponentFromNode(node);
      comp.name = "icon/" + name;
      setScaleConstraints(comp);
      for (const c of comp.children) setScaleConstraints(c);
      holder.appendChild(comp);
      ICON_COMPS[name] = comp;
    } catch (e) { console.warn("icon failed " + name + ": " + e.message); }
  }
  page.appendChild(holder);
  return holder;
}
function I(name, size, color, o) {
  size = size || 16; o = o || {};
  const comp = ICON_COMPS[name] || ICON_COMPS.square;
  if (!comp) return F({ name: "icon/" + name, w: size, h: size, radius: 3, stroke: color || C.s500 });
  const inst = comp.createInstance();
  inst.rescale(size / 24);
  const paintC = paint(color || C.s500);
  for (const v of inst.findAll(function (n) { return n.type === "VECTOR"; })) {
    v.strokes = paintC;
    if (o.filled) v.fills = paintC;
  }
  inst.name = "icon/" + name;
  return inst;
}

// ---------- logo ----------
let LOGO_COMP = null;
function buildLogo(page) {
  const node = figma.createNodeFromSvg(LOGO_SVG);
  const comp = figma.createComponentFromNode(node);
  comp.name = "brand/SafariNexa logo (horizontal-white.svg)";
  setScaleConstraints(comp);
  page.appendChild(comp);
  LOGO_COMP = comp;
  return comp;
}
function logo(height) {
  if (!LOGO_COMP) return T("SafariNexa", { size: 16, w: 700, color: C.primary });
  const inst = LOGO_COMP.createInstance();
  inst.rescale(height / LOGO_COMP.height);
  inst.name = "Logo";
  return inst;
}

// ---------- components: badge ----------
const BADGE_TONES = {
  default: { fill: C.primary, fo: 0.1, color: C.primary },
  secondary: { fill: C.secondary, color: C.secondaryFg, stroke: C.border },
  success: { fill: C.success, fo: 0.1, color: C.success },
  warning: { fill: C.warning, fo: 0.15, color: C.warningFg },
  destructive: { fill: C.destructive, fo: 0.1, color: C.destructive }
};
function badgeRaw(label, tone, ctx, asComponent) {
  const t = BADGE_TONES[tone] || BADGE_TONES.secondary;
  if (ctx === "table") {
    return H({ component: asComponent, name: "Badge", gap: 6, px: 8, py: 4, radius: 6, fill: C.s50, stroke: C.s200 }, [
      dot(6, DOT[tone] || DOT.secondary), T(label, { size: 12, color: C.s600, lh: 15, name: "label" })
    ]);
  }
  return H({ component: asComponent, name: "Badge", gap: 6, px: 10, py: 4, radius: 999, fill: t.fill, fo: t.fo, stroke: t.stroke }, [
    dot(6, DOT[tone] || DOT.secondary), T(label, { size: 12, w: 500, color: t.color, lh: 12, name: "label" })
  ]);
}
const BADGE_COMPS = {};
function buildBadgeSet(page) {
  const comps = [];
  for (const ctx of ["pill", "table"]) for (const tone of Object.keys(BADGE_TONES)) {
    const c = badgeRaw(tone.charAt(0).toUpperCase() + tone.slice(1), tone, ctx, true);
    c.name = "tone=" + tone + ", context=" + ctx;
    page.appendChild(c);
    comps.push(c);
    BADGE_COMPS[tone + "|" + ctx] = c;
  }
  const set = figma.combineAsVariants(comps, page);
  set.name = "Status badge";
  set.layoutMode = "HORIZONTAL"; set.layoutWrap = "WRAP"; set.itemSpacing = 12; set.counterAxisSpacing = 12;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 16;
  set.resize(640, 100); set.layoutSizingVertical = "HUG";
  set.strokes = paint(C.proposed, 0.6); set.dashPattern = [4, 4]; set.cornerRadius = 8;
  return set;
}
function badge(label, tone, ctx) {
  ctx = ctx || "pill";
  const comp = BADGE_COMPS[(tone || "secondary") + "|" + ctx];
  if (!comp) return badgeRaw(label, tone, ctx);
  const inst = comp.createInstance();
  const t = inst.findOne(function (n) { return n.type === "TEXT"; });
  if (t) t.characters = label;
  inst.name = "Badge · " + label;
  return inst;
}
// Status metadata mirrors src/lib/status.ts
const STATUS = {
  booking: {
    PENDING_PAYMENT: ["Payment required", "warning"], AWAITING_BUSINESS_CONFIRMATION: ["Awaiting confirmation", "warning"],
    CONFIRMED: ["Confirmed", "success"], COMPLETED: ["Completed", "success"], REVIEW_PENDING: ["Review pending", "secondary"],
    REVIEWED: ["Reviewed", "secondary"], CANCELLED_BY_CUSTOMER: ["Cancelled by customer", "secondary"],
    CANCELLED_BY_BUSINESS: ["Cancelled by business", "destructive"], CANCELLED_BY_ADMIN: ["Cancelled by admin", "destructive"],
    PAYMENT_FAILED: ["Payment failed", "destructive"], REFUND_REQUESTED: ["Refund requested", "warning"]
  },
  payment: { SUCCESSFUL: ["Successful", "success"], PROCESSING: ["Processing", "warning"], PENDING_PROVIDER_CONFIRMATION: ["Awaiting provider", "warning"], FAILED: ["Failed", "destructive"], REFUNDED: ["Refunded", "secondary"], PARTIALLY_REFUNDED: ["Partially refunded", "warning"], CANCELLED: ["Cancelled", "secondary"] },
  verification: { NOT_STARTED: ["Not started", "secondary"], DRAFT: ["Draft", "secondary"], SUBMITTED: ["Submitted", "warning"], UNDER_REVIEW: ["Under review", "warning"], NEEDS_CHANGES: ["Needs changes", "destructive"], APPROVED: ["Approved", "success"], REJECTED: ["Rejected", "destructive"], SUSPENDED: ["Suspended", "destructive"] },
  admin: { ACTIVE: ["Active", "success"], INVITED: ["Invited", "warning"], SUSPENDED: ["Suspended", "destructive"], INACTIVE: ["Inactive", "secondary"] },
  review: { PENDING: ["Pending", "secondary"], PUBLISHED: ["Published", "success"], HIDDEN: ["Hidden", "secondary"], FLAGGED: ["Flagged", "destructive"] },
  support: { OPEN: ["Open", "warning"], IN_PROGRESS: ["In progress", "warning"], WAITING_ON_CUSTOMER: ["Waiting on customer", "warning"], RESOLVED: ["Resolved", "success"], CLOSED: ["Closed", "secondary"] },
  refund: { REQUESTED: ["Requested", "warning"], PROCESSING: ["Processing", "warning"], COMPLETED: ["Completed", "success"], REJECTED: ["Rejected", "destructive"] }
};
function sb(kind, status, ctx) { const m = STATUS[kind][status] || ["Unknown status", "secondary"]; return badge(m[0], m[1], ctx); }

// ---------- components: button ----------
const BTN_SIZES = { md: { h: 44, px: 24, size: 14 }, sm: { h: 36, px: 16, size: 14 }, lg: { h: 48, px: 32, size: 16 }, xs: { h: 32, px: 12, size: 12 }, xxs: { h: 28, px: 12, size: 12 } };
function btnStyle(variant) {
  switch (variant) {
    case "outline": return { fill: C.white, stroke: C.input, color: C.fg };
    case "secondary": return { fill: C.secondary, color: C.secondaryFg };
    case "ghost": return { color: C.fg };
    case "destructive": return { fill: C.destructive, color: C.white };
    case "link": return { color: C.primary, underline: true };
    case "pill": return { fill: C.white, stroke: C.border, color: C.s700 }; // portal toolbar buttons
    default: return { gradient: gradient(C.primary, C.primaryDark), color: C.white, shadow: "sm" };
  }
}
/** Button. o: {variant,size,icon,iconRight,fillW,disabled,loading,radius,color,stroke,fill,textSize,w} */
function btnRaw(label, o, asComponent) {
  o = o || {};
  const st = btnStyle(o.variant);
  const sz = BTN_SIZES[o.size || "md"];
  const color = o.color || st.color;
  const kids = [];
  if (o.loading) kids.push(I("loader", 16, color));
  if (o.icon) kids.push(I(o.icon, o.iconSize || 16, o.iconColor || color));
  if (label) kids.push(T(label, { size: o.textSize || sz.size, w: o.weight || 500, color: color, underline: st.underline, name: "label" }));
  if (o.iconRight) kids.push(I(o.iconRight, o.iconSize || 16, o.iconColor || color));
  if (o.badge != null) kids.push(H({ name: "Count", px: 6, py: 2, radius: 999, fill: C.s900 }, [T(String(o.badge), { size: 12, w: 500, color: C.white, lh: 12 })]));
  const b = H({
    component: asComponent, name: "Button · " + (label || o.icon), gap: o.gap || 8, main: "center",
    h: o.h || (o.variant === "link" ? undefined : sz.h), px: o.variant === "link" ? 0 : (o.px != null ? o.px : sz.px),
    radius: o.radius != null ? o.radius : 999, fill: o.fill || st.fill, gradient: o.fill ? null : st.gradient,
    stroke: o.stroke || st.stroke, shadow: st.shadow, opacity: o.disabled ? 0.5 : null, fillW: o.fillW, w: o.w
  }, kids);
  return b;
}
const BTN_COMPS = {};
function buildButtonSet(page) {
  const comps = [];
  for (const variant of ["default", "outline", "secondary", "ghost", "destructive", "link"]) for (const size of ["md", "sm"]) {
    const c = btnRaw("Button", { variant: variant, size: size }, true);
    c.name = "variant=" + variant + ", size=" + size;
    page.appendChild(c);
    comps.push(c);
    BTN_COMPS[variant + "|" + size] = c;
  }
  const set = figma.combineAsVariants(comps, page);
  set.name = "Button";
  set.layoutMode = "HORIZONTAL"; set.layoutWrap = "WRAP"; set.itemSpacing = 16; set.counterAxisSpacing = 16;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 16;
  set.counterAxisAlignItems = "CENTER";
  set.resize(760, 100); set.layoutSizingVertical = "HUG";
  set.strokes = paint(C.proposed, 0.6); set.dashPattern = [4, 4]; set.cornerRadius = 8;
  return set;
}
function btn(label, o) {
  o = o || {};
  const key = (o.variant || "default") + "|" + (o.size || "md");
  const plain = !o.icon && !o.iconRight && !o.loading && o.badge == null && !o.color && !o.fill && !o.stroke && !o.h && o.px == null && o.radius == null && !o.textSize && !o.w && !o.weight;
  if (plain && BTN_COMPS[key]) {
    const inst = BTN_COMPS[key].createInstance();
    const t = inst.findOne(function (n) { return n.type === "TEXT"; });
    if (t) t.characters = label;
    inst.name = "Button · " + label;
    if (o.disabled) inst.opacity = 0.5;
    if (o.fillW) markFill(inst, true, false);
    return inst;
  }
  return btnRaw(label, o);
}
/** Rounded-full h-9 toolbar buttons used by Export / Filters (portal-tools.tsx). */
function toolBtn(label, icon, o) {
  return btnRaw(label, Object.assign({ variant: "pill", size: "sm", px: 14, icon: icon, iconSize: 14, iconColor: C.s500, gap: 6 }, o || {}));
}

// ---------- form controls ----------
function fieldLabel(s, o) { return T(s, Object.assign({ size: 14, w: 500, color: C.fg, lh: 20 }, o)); }
function inputBox(o) {
  o = o || {};
  const value = o.value != null && o.value !== "";
  const kids = [];
  if (o.icon) kids.push(I(o.icon, 14, C.s400));
  kids.push(T(value ? o.value : (o.placeholder || ""), { size: 14, color: o.disabled ? C.muted : value ? C.fg : C.muted, fillW: true, name: value ? "value" : "placeholder" }));
  if (o.select) kids.push(I("chevron-down", 16, C.s500));
  if (o.trailing) kids.push(o.trailing);
  if (o.focus) kids.push(F({ name: "caret", w: 1, h: 18, fill: C.fg }));
  return H({
    name: o.select ? "Select" : "Input", gap: 8, h: o.h || 44, px: 12, radius: 12,
    fill: o.disabled ? C.s50 : C.white, stroke: o.error ? C.destructive : o.focus ? C.primary : C.input,
    sw: 1, opacity: o.disabled ? 0.6 : null, fillW: o.w ? false : true, w: o.w
  }, kids);
}
function field(label, o) {
  o = o || {};
  return V({ name: "Field · " + label, gap: o.gap || 8, fillW: !o.w, w: o.w }, [
    label ? H({ gap: 8 }, [o.labelIcon ? I(o.labelIcon, 16, C.s400) : null, fieldLabel(label, { color: o.labelColor || C.fg })]) : null,
    inputBox(o),
    o.help ? T(o.help, { size: 12, color: o.error ? C.destructive : C.s500, fillW: true }) : null
  ]);
}
function textarea(o) {
  o = o || {};
  const value = o.value != null && o.value !== "";
  return V({ name: "Textarea", pad: 12, radius: 12, fill: C.white, stroke: o.error ? C.destructive : o.focus ? C.primary : C.input, h: o.h || 96, fillW: !o.w, w: o.w }, [
    T(value ? o.value : (o.placeholder || ""), { size: 14, color: value ? C.fg : C.muted, fillW: true, relaxed: true })
  ]);
}
function checkbox(checked, label, sub, o) {
  o = o || {};
  const box = F({ name: checked ? "Checkbox · checked" : "Checkbox", w: 16, h: 16, radius: 4, fill: checked ? C.primary : C.white, stroke: checked ? C.primary : C.s500, dir: "V", main: "center", cross: "center" }, checked ? [I("check", 12, C.white)] : []);
  return H({ name: "Checkbox row", gap: 12, cross: "start", fillW: true }, [
    V({ pt: 2 }, [box]),
    V({ gap: 2, fillW: true }, [T(label, { size: 14, w: o.w || 500, color: C.s700, fillW: true, relaxed: !!o.relaxed }), sub ? T(sub, { size: 12, mono: true, color: C.s500 }) : null])
  ]);
}
function searchBox(placeholder, o) {
  o = o || {};
  const val = o.value;
  return H({ name: "PortalSearch", gap: 8, h: 36, w: o.w || 288, pl: 12, pr: 8, radius: 12, fill: C.white, stroke: o.focus ? C.primary : C.input }, [
    I("search", 14, C.s400),
    T(val || placeholder, { size: 14, color: val ? C.fg : C.muted, fillW: true }),
    val ? I("x", 14, C.s500) : null,
    T("↵", { size: 12, color: C.s500 })
  ]);
}

// ---------- layout atoms ----------
function card(kids, o) {
  o = o || {};
  return V(Object.assign({ name: "Card", radius: 16, fill: C.white, stroke: C.border, shadow: "card", fillW: !o.w, clip: true }, o), kids);
}
function cardHeader(title, desc, o) {
  o = o || {};
  return V({ name: "CardHeader", gap: 6, pad: 24, fillW: true }, [
    H({ gap: 8, fillW: true }, [o.icon ? I(o.icon, 20, C.primary) : null, type.card(title, { fillW: !o.right }), o.right ? grow() : null, o.right || null]),
    desc ? type.body(desc, { fillW: true }) : null
  ]);
}
function cardContent(kids, o) { return V(Object.assign({ name: "CardContent", px: 24, pb: 24, gap: 16, fillW: true }, o || {}), kids); }
function panelHeader(title, icon, right) {
  return H({ name: "Panel header", px: 24, py: 16, fill: C.s50, fo: 0.5, stroke: C.border, sides: { b: 1 }, fillW: true, gap: 8 }, [
    icon ? I(icon, 16, C.s400) : null, T(title, { size: 16, w: 600, color: C.s900 }), right ? grow() : null, right || null
  ]);
}
function pageHero(eyebrow, title, desc, o) {
  o = o || {};
  return V({ name: "PageHero", gap: 4, pt: 8, pb: 24, fillW: !o.w, w: o.w }, [
    eyebrow ? type.eyebrow(eyebrow) : null,
    type.page(title),
    desc ? type.body(desc, { fillW: !o.w, width: o.w }) : null
  ]);
}
function emptyState(title, desc, o) {
  o = o || {};
  return V({ name: "EmptyState", gap: 12, px: 24, py: 56, radius: 16, stroke: C.border, dash: true, fill: C.white, fo: 0.6, cross: "center", fillW: true }, [
    o.icon ? F({ w: 48, h: 48, radius: 24, fill: C.secondary, main: "center", cross: "center" }, [I(o.icon, 24, C.muted)]) : null,
    T(title, { size: 16, w: 600, align: "center" }),
    desc ? T(desc, { size: 14, relaxed: true, color: C.muted, align: "center", width: 384 }) : null,
    o.action || null
  ]);
}
function filterTabs(tabs, active) {
  return H({ name: "FilterTabs", gap: 6, wrap: true }, tabs.map(function (tab) {
    const label = Array.isArray(tab) ? tab[0] : tab;
    const count = Array.isArray(tab) ? tab[1] : null;
    const on = label === active;
    return H({ name: "Tab · " + label + (on ? " (active)" : ""), gap: 6, h: 36, px: 14, radius: 999, fill: on ? C.s900 : C.white, stroke: on ? C.s900 : C.border }, [
      T(label, { size: 14, w: 500, color: on ? C.white : C.s600 }),
      count != null ? H({ px: 6, py: 2, radius: 999, fill: on ? C.white : C.s100, fo: on ? 0.2 : 1 }, [T(String(count), { size: 12, w: 600, color: on ? C.white : C.s600, lh: 12 })]) : null
    ]);
  }));
}
function pagination(current, total) {
  const items = [H({ name: "Prev", w: 36, h: 36, radius: 999, stroke: C.border, main: "center", opacity: current === 1 ? 0.4 : null }, [I("chevron-left", 16, C.fg)])];
  for (let p = 1; p <= Math.min(total, 5); p++) {
    const on = p === current;
    items.push(H({ name: "Page " + p, w: 36, h: 36, radius: 999, main: "center", fill: on ? C.primary : null, stroke: on ? null : C.border }, [T(String(p), { size: 14, w: 600, color: on ? C.white : C.fg })]));
  }
  items.push(H({ name: "Next", w: 36, h: 36, radius: 999, stroke: C.border, main: "center", opacity: current === total ? 0.4 : null }, [I("chevron-right", 16, C.fg)]));
  return H({ name: "Pagination", gap: 6 }, items);
}
function tableFooter(text, current, total) {
  return H({ name: "Pagination footer", px: 24, py: 16, fill: C.s50, fo: 0.3, stroke: C.border, sides: { t: 1 }, fillW: true, main: "between" }, [
    T(text, { size: 14, w: 600, color: C.s500 }), pagination(current || 1, total || 1)
  ]);
}
function helpLabel(label, o) {
  o = o || {};
  return H({ name: "TableColumnLabel", gap: 6 }, [T(label, { size: o.size || 12, w: 500, color: o.color || C.s500 }), V({ name: "Info · " + label, w: 24, h: 24, main: "center", cross: "center" }, [I("info", 14, C.s500)])]);
}
function linkText(s, o) { return T(s, Object.assign({ size: 14, color: C.link, underline: true }, o || {})); }
function tableAction(label) {
  return H({ name: "table-action", gap: 6, h: 32, px: 10, radius: 6, stroke: C.s200, fill: C.white }, [T(label || "View", { size: 13, color: C.s600 }), I("arrow-up-right", 14, C.s600)]);
}
/** Data table (components/ui/table.tsx). cols: [{label, help, weight, align}] rows: [[cell...]] */
function table(cols, rows, o) {
  o = o || {};
  const w = o.w || CONTENT_W;
  const total = cols.reduce(function (s, c) { return s + (c.weight || 1); }, 0);
  const widths = cols.map(function (c) { return Math.floor((w - 2) * (c.weight || 1) / total); });
  function cell(content, i, header) {
    const col = cols[i];
    let node;
    if (content == null) node = T("—", { size: 14, color: C.s500 });
    else if (typeof content === "string" || typeof content === "number") {
      node = header ? (col.help ? helpLabel(String(content)) : T(String(content), { size: 12, w: 500, color: C.s500 }))
        : T(String(content), { size: 14, color: C.s600, width: widths[i] - 32 });
    } else node = content;
    return H({ name: header ? "TableHead" : "TableCell", w: widths[i], h: header ? 48 : undefined, px: 16, py: header ? 0 : 16, main: col.align === "right" ? "end" : col.align === "center" ? "center" : "start" }, [node]);
  }
  const head = H({ name: "TableHeader", fill: C.s50, fo: 0.7, stroke: C.border, sides: { b: 1 }, fillW: true }, cols.map(function (c, i) { return cell(c.label, i, true); }));
  const body = rows.map(function (r, ri) {
    if (r.colspan) return H({ name: "TableRow · empty", fillW: true, py: 40, main: "center" }, [T(r.colspan, { size: 14, color: C.s600 })]);
    return H({ name: "TableRow " + (ri + 1), fillW: true, stroke: C.s100, sides: { b: ri === rows.length - 1 ? 0 : 1 }, fill: r.hover ? C.s50 : null, fo: 0.7 }, r.map(function (c, i) { return cell(c, i, false); }));
  });
  return V({ name: o.name || "Table", w: w, radius: 16, stroke: C.border, fill: C.white, clip: true }, [head].concat(body, o.footer ? [o.footer] : []));
}
function dl(items, o) {
  o = o || {};
  const cols = o.cols || 2;
  const colW = Math.floor(((o.w || 600) - (cols - 1) * (o.gapX || 24)) / cols);
  return H({ name: "Description list", wrap: true, gap: o.gapX || 24, rowGap: o.gapY || 20, w: o.w || 600 }, items.map(function (it) {
    return V({ name: "dt/dd · " + it[0], gap: 4, w: it[2] === "full" ? (o.w || 600) : colW }, [
      T(it[0], { size: 12, w: o.dtWeight || 400, color: C.muted }),
      typeof it[1] === "string" ? T(it[1], { size: 14, w: it[3] || 600, color: it[1] === "Not provided" ? C.muted : C.fg, width: it[2] === "full" ? (o.w || 600) : colW }) : it[1]
    ]);
  }));
}
function alertBox(msg, tone, icon) {
  const map = { destructive: [C.destructive, 0.1, C.destructive], warning: [C.warning, 0.1, C.warningFg], red: [C.red50, 1, C.red600] };
  const m = map[tone || "destructive"];
  return H({ name: "Alert · " + tone, gap: 8, px: 14, py: 10, radius: 12, fill: m[0], fo: m[1], stroke: tone === "red" ? null : m[0], so: 0.3, fillW: true, cross: icon ? "start" : "center" }, [
    icon ? I(icon, 16, m[2]) : null, T(msg, { size: 14, w: 500, color: m[2], relaxed: true, fillW: true })
  ]);
}
function tooltip(text, w) {
  return V({ name: "Tooltip", px: 12, py: 6, radius: 8, fill: C.s900, w: w || 260, shadow: "md" }, [T(text, { size: 12, color: C.white, relaxed: true, fillW: true })]);
}
