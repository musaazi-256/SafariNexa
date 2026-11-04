// Helpers shared by business screens (stat cards, panels, auth card, charts, dialogs).

const BIZ_NAMES = ["Nile & Crater Lodges", "Uganda Trails Safaris", "Kampala Table Group", "Kampala Transit Co"];
const BIZ_TYPES = ["Accommodation", "Tours & guiding", "Restaurants", "Transport"];
const PAGE_BG = "#F8F9FA";

function statCard(s, w, h, compact) {
  const link = s.action ? H({ gap: 4 }, [T(s.action, { size: 12, w: 500, color: C.primary, underline: true }), I("arrow-up-right", 14, C.primary)]) : null;
  return card([
    V({ name: compact ? "StatCard · compact" : "StatCard", pad: compact ? 12 : 20, gap: 0, fillW: true, minH: h || compact ? null : 160, fillH: !!h }, [
      H({ fillW: true, cross: "start", main: "between", gap: 12 }, [
        s.help ? helpLabel(s.label) : T(s.label, { size: 12, w: 500, color: C.s500, lh: 20 }),
        s.icon ? F({ w: compact ? 24 : 32, h: compact ? 24 : 32, radius: 8, fill: C.s50, stroke: C.s100, main: "center", cross: "center" }, [I(s.icon, compact ? 14 : 16, C.s500)]) : null
      ]),
      spacer(1, compact ? 4 : 12),
      T(s.value, { size: compact ? 18 : 24, w: 600, color: C.s800, lh: compact ? 24 : 30, ls: -2.5 }),
      spacer(1, compact ? 4 : 8),
      T(s.desc, { size: 12, color: C.s500, lh: compact ? 16 : 20, fillW: true }),
      s.action && h ? grow({ fillH: true }) : null,
      link ? (compact ? V({ pt: 8, fillW: true }, [link]) : V({ pt: 16, fillW: true }, [V({ pt: 12, stroke: C.s100, sides: { t: 1 }, fillW: true }, [link])])) : null
    ])
  ], { w: w, h: h });
}
function statGrid(stats, cw, cols, compact) {
  cols = cols || 4;
  const w = Math.floor((cw - 16 * (cols - 1)) / cols);
  return H({ name: "StatGrid", gap: 16, wrap: true, w: cw, rowGap: 16, cross: "start" }, stats.map(function (s) { return statCard(s, w, null, compact); }));
}
function listRow(title, sub, right, o) {
  o = o || {};
  return H({ name: "Row · " + title, fillW: true, py: 10, gap: 8, stroke: C.s100, sides: o.last ? {} : { b: 1 } }, [
    o.lead || null,
    V({ fillW: true, gap: 0 }, [T(title, { size: o.size || 12, w: 500, color: C.s900, fillW: true }), sub ? T(sub, { size: 12, color: C.s500, fillW: true }) : null]),
    right || null
  ]);
}
function miniBtn(label, color) { return H({ h: 24, px: 10, radius: 6, stroke: C.border }, [T(label, { size: 12, w: 500, color: color || C.fg })]); }
function imagePh(w, h, label) {
  return F({ name: "Image placeholder", w: w, h: h, fill: C.s100, main: "center", cross: "center", gap: 6 }, [I("image", 24, C.s400), label ? T(label, { size: 11, color: C.s400 }) : null]);
}
function avatar(initials, size) {
  size = size || 40;
  return F({ name: "Avatar", w: size, h: size, radius: size / 2, fill: C.s200, main: "center", cross: "center" }, [T(initials, { size: Math.round(size * 0.35), w: 600, color: C.s600 })]);
}
function stars(n, size) {
  size = size || 14;
  const kids = [];
  for (let i = 1; i <= 5; i++) kids.push(I("star", size, i <= n ? "#FBBF24" : C.s300, { filled: i <= n }));
  return H({ name: "Rating · " + n, gap: 2 }, kids);
}
function confirmDialog(title, desc, confirm, o) {
  o = o || {};
  return dialog(title, desc, o.body || null, [btn(o.cancel || "Cancel", { variant: "outline", size: "sm" }), btn(confirm, { variant: o.variant || "destructive", size: "sm" })], { icon: o.icon || "alert-triangle", iconBg: o.iconBg, iconColor: o.iconColor, w: o.w });
}
function sectionCard(title, desc, kids, o) {
  o = o || {};
  return card([cardHeader(title, desc, { icon: o.icon, right: o.right }), cardContent(kids, { gap: o.gap != null ? o.gap : 16 })], { w: o.w });
}
function pill(label, tone) {
  const tones = { green: [C.successSoft, C.success], amber: ["#FEF3C7", "#92400E"], red: [C.red50, C.red600], grey: [C.s100, C.s600], blue: ["#DBEAFE", "#1D4ED8"] };
  const t = tones[tone || "grey"];
  return H({ name: "Pill · " + label, h: 22, px: 8, radius: 999, fill: t[0] }, [T(label, { size: 12, w: 500, color: t[1] })]);
}
function kv(label, value, o) {
  o = o || {};
  return V({ gap: 2, fillW: !o.w, w: o.w }, [T(label, { size: 12, w: 500, color: C.s500 }), typeof value === "string" ? T(value, { size: 14, w: o.w ? 500 : 500, color: C.s900, fillW: true }) : value]);
}

// ---------- charts (static drawings of the recharts output) ----------
function chartFrame(w, h, name) {
  const f = figma.createFrame();
  f.name = name || "Chart";
  f.resize(w, h);
  f.fills = [];
  f.clipsContent = false;
  return f;
}
function gridLines(f, w, h, rows) {
  for (let i = 0; i <= rows; i++) {
    const r = figma.createRectangle(); r.name = "Grid line"; r.resize(w, 1); r.fills = paint(C.s100); f.appendChild(r); r.x = 0; r.y = Math.round(i * (h / rows));
  }
}
function lineChart(w, h, series) {
  const f = chartFrame(w, h, "LineChart");
  gridLines(f, w, h, 4);
  for (const s of series) {
    const pts = s.values.map(function (v, i) { return [Math.round(i * (w / (s.values.length - 1))), Math.round(h - v * h)]; });
    const d = "M" + pts.map(function (p) { return p[0] + " " + p[1]; }).join(" L");
    const node = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '"><path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linejoin="round"/></svg>');
    node.name = "Series · " + s.name; node.fills = [];
    f.appendChild(node); node.x = 0; node.y = 0;
  }
  return f;
}
function barChart(w, h, values, color) {
  const f = chartFrame(w, h, "BarChart");
  gridLines(f, w, h, 4);
  const step = w / values.length;
  values.forEach(function (v, i) {
    const r = figma.createRectangle(); r.name = "Bar"; const bh = Math.max(2, Math.round(v * h));
    r.resize(16, bh); r.fills = paint(color || C.chat); r.topLeftRadius = 2; r.topRightRadius = 2;
    f.appendChild(r); r.x = Math.round(i * step + (step - 16) / 2); r.y = h - bh;
  });
  return f;
}
function legend(items) {
  return H({ name: "Legend", gap: 16 }, items.map(function (it) { return H({ gap: 6 }, [dot(8, it[1]), T(it[0], { size: 12, color: C.s500 })]); }));
}
function axisLabels(labels, w) {
  return H({ name: "X axis", w: w, main: "between" }, labels.map(function (l) { return T(l, { size: 12, color: C.s500 }); }));
}

// ---------- auth card (components/auth-card.tsx, business surface) ----------
function authCard(o) {
  o = o || {};
  const demo = o.demo !== false;
  const surface = o.surface || "business";
  const label = surface + " account";
  const demoEmail = surface === "customer" ? "customer@safarinexa.test" : "business@dev.test";
  return card([
    V({ name: "CardHeader", gap: 6, pad: 24, fillW: true }, [
      type.eyebrow(surface + " authentication"),
      T("Sign in to your " + label, { size: 30, w: 600, lh: 36, ls: -2.5, fillW: true }),
      type.body(demo ? "This is a demo. The details below are filled in for you, so just continue." : "Continue with Google or your SafariNexa email.", { fillW: true })
    ]),
    cardContent([
      o.error ? alertBox(o.error, "destructive") : null,
      o.hideGoogle || demo ? null : btn("Continue with Google", { variant: "secondary", fillW: true }),
      o.hideGoogle || demo ? null : H({ gap: 12, fillW: true }, [hr(), T("OR", { size: 12, w: 500, color: C.muted }), hr()]),
      V({ gap: 12, fillW: true }, [
        V({ gap: 6, fillW: true }, [fieldLabel("Email"), inputBox({ placeholder: "you@example.com", value: demo ? demoEmail : o.email, readonly: demo, error: o.fieldError })]),
        V({ gap: 6, fillW: true }, [fieldLabel("Password"), inputBox({ placeholder: "Your password", value: demo || o.email ? "••••••••••" : "", readonly: demo, error: o.fieldError })]),
        V({ pt: 4, fillW: true }, [o.loading ? btnRaw(demo ? "Continue as " + surface : "Sign in with email", { loading: true, fillW: true, disabled: true }) : btn(demo ? "Continue as " + surface : "Sign in with email", { fillW: true })])
      ]),
      surface === "business" ? H({ gap: 4, main: "center", fillW: true }, [T("New business?", { size: 14, color: C.muted }), T("Start onboarding", { size: 14, w: 600, color: C.primary })]) : null
    ], { gap: 16 })
  ], { w: 448 });
}
function authPage(name, cardNode) {
  return bareScreen(name, [siteHeader(), V({ name: "Container", w: 1180, py: 56, cross: "center", minH: 680, main: "center" }, [cardNode])]);
}
