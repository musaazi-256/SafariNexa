// App shell: AdminSidebar + header (app/admin/(portal)/layout.tsx, components/admin/admin-sidebar.tsx)

const NAV = [
  { items: [["Dashboard", "layout-dashboard"]] },
  { label: "Platform", items: [["Businesses", "building-2"], ["Business verification", "shield-check"], ["Listing reviews", "clipboard-check"]] },
  { label: "Operations", items: [["Bookings", "clipboard-check"], ["Payments", "banknote"]] },
  { label: "Community", items: [["Users", "users"], ["Roles & permissions", "key-round"], ["Reviews", "star"], ["Support", "life-buoy"], ["Audit trail", "gauge"]] },
  { label: "Insights", items: [["Notifications", "bell"], ["Settings", "settings"]] }
];

function navItem(label, icon, active, collapsed, o) {
  o = o || {};
  const color = o.danger ? C.destructive : active ? "#18181B" : C.sidebarFg;
  if (collapsed) {
    return H({ name: "Nav · " + label + (active ? " (active)" : ""), w: 32, h: 32, radius: 6, main: "center", fill: active ? C.sidebarAccent : null }, [I(icon, 16, color)]);
  }
  return H({ name: "Nav · " + label + (active ? " (active)" : ""), gap: 8, h: 32, px: 8, radius: 6, fillW: true, fill: active ? C.sidebarAccent : null }, [
    I(icon, 16, color), T(label, { size: 14, w: active ? 500 : 400, color: color })
  ]);
}

function sidebar(active, o) {
  o = o || {};
  const collapsed = !!o.collapsed;
  const groups = NAV.map(function (g, i) {
    return V({ name: "SidebarGroup" + (g.label ? " · " + g.label : ""), pad: 8, gap: 4, fillW: true, cross: collapsed ? "center" : "start" }, [
      g.label && !collapsed ? H({ h: 32, px: 8, fillW: true }, [T(g.label, { size: 12, w: 500, color: C.sidebarFg, opacity: 0.7 })]) : null,
      g.label && collapsed ? hr(C.sidebarBorder, { name: "Group separator" }) : null
    ].concat(g.items.map(function (it) { return navItem(it[0], it[1], it[0] === active, collapsed); })));
  });
  const header = collapsed
    ? V({ name: "SidebarHeader", pad: 8, cross: "center", fillW: true }, [F({ name: "Logo mark", w: 32, h: 32, radius: 8, fill: C.bizTint, main: "center", cross: "center" }, [T("S", { size: 14, w: 700, color: C.primary })])])
    : V({ name: "SidebarHeader", pad: 8, gap: 8, fillW: true }, [
      H({ px: 6, pb: 0 }, [logo(24)]),
      V({ pl: 8, gap: 4 }, [T("Admin Portal", { size: 14, w: 500, color: C.s900, lh: 14 }), T("SafariNexa", { size: 12, w: 500, color: C.s500 })])
    ]);
  const footer = V({ name: "SidebarFooter", pad: collapsed ? 8 : 16, gap: 16, fillW: true, cross: collapsed ? "center" : "start" }, [
    collapsed ? null : V({ name: "System health", px: 12, py: 12, radius: 12, stroke: C.s200, fill: C.s50, fo: 0.7, fillW: true, gap: 4 }, [
      T("System health", { size: 12, w: 500, color: C.s700 }), T("Monitoring data is unavailable.", { size: 12, color: C.s500, lh: 20 })
    ]),
    V({ gap: 4, fillW: true, cross: collapsed ? "center" : "start" }, [
      navItem("Profile", "user-circle", active === "Profile", collapsed),
      navItem("Sign out", "log-out", false, collapsed, { danger: true })
    ])
  ]);
  return V({ name: collapsed ? "AdminSidebar · collapsed (icon)" : "AdminSidebar", w: collapsed ? 48 : SIDEBAR_W, fill: C.sidebar, stroke: C.sidebarBorder, sides: { r: 1 }, fillH: true }, [
    header, V({ name: "SidebarContent", fillW: true, gap: 0 }, groups), grow({ fillH: true, name: "flex" }), footer
  ]);
}

function bellNode(unread) {
  const b = H({ name: "NotificationBell", w: 36, h: 36, radius: 8, main: "center" }, [I("bell", 16, C.s500)]);
  if (!unread) return b;
  const wrap = figma.createFrame();
  wrap.name = "NotificationBell · " + unread + " unread";
  wrap.fills = [];
  wrap.resize(36, 36);
  wrap.clipsContent = false;
  wrap.appendChild(b);
  const count = H({ name: "Unread count", px: 4, radius: 999, fill: C.primary, h: 16, main: "center" }, [T(unread > 99 ? "99+" : String(unread), { size: 12, color: C.white, lh: 16 })]);
  wrap.appendChild(count);
  count.x = 36 - count.width + 4; count.y = -4;
  return wrap;
}

function topHeader(o) {
  o = o || {};
  return H({ name: "Header", h: 56, px: 16, gap: 8, stroke: C.border, sides: { b: 1 }, fillW: true }, [
    H({ name: "SidebarTrigger", w: 28, h: 28, radius: 6, main: "center" }, [I("panel-left", 16, C.fg)]),
    T("Admin portal", { size: 14, w: 600, color: C.muted }),
    grow(),
    o.demo === false ? null : H({ name: "DemoToolbar", gap: 8 }, [
      H({ h: 36, px: 8, main: "center" }, [T("Customer", { size: 12, w: 500, color: C.muted })]),
      H({ h: 36, px: 8, main: "center" }, [T("Business", { size: 12, w: 500, color: C.muted })])
    ]),
    bellNode(o.unread == null ? 3 : o.unread)
  ]);
}

/** Build a full 1440 admin screen. kids go into the centred content column (width = cw). */
function screen(name, active, kidsFn, o) {
  o = o || {};
  const cw = Math.min(o.maxW || CONTENT_W, o.collapsed ? SCREEN_W - 48 - 48 : CONTENT_W);
  const kids = kidsFn(cw);
  const content = V({ name: "Page content", fillW: true, pad: CONTENT_PAD, cross: "center" }, [
    V({ name: "Container (max-w " + cw + ")", w: cw, gap: o.gap != null ? o.gap : 24 }, kids)
  ]);
  const root = H({ name: name, w: SCREEN_W, fill: C.white, cross: "start", clip: true }, [
    sidebar(active, { collapsed: o.collapsed }),
    V({ name: "SidebarInset", fillW: true }, [topHeader(o), content])
  ]);
  root.minHeight = o.minH || 900;
  applyFills();
  return root;
}

/** Full-bleed page without the portal shell (auth pages). */
function bareScreen(name, kids, o) {
  o = o || {};
  const root = V({ name: name, w: SCREEN_W, fill: o.fill || C.white, cross: "center", clip: true, minH: 900 }, kids);
  applyFills();
  return root;
}
function siteHeader() {
  return H({ name: "SiteHeader", h: 72, w: SCREEN_W, px: 130, stroke: C.border, sides: { b: 1 }, fill: C.white, gap: 32 }, [
    logo(32), grow(),
    H({ gap: 28 }, ["Stays", "Tours", "Dining", "Transport", "Guides"].map(function (s) { return T(s, { size: 14, w: 500, color: C.s700 }); })),
    btn("Sign in", { variant: "outline", size: "sm" })
  ]);
}

/** Overlay a dialog / popover over a built screen. */
function withOverlay(base, layer, o) {
  o = o || {};
  applyFills();
  const wrap = figma.createFrame();
  wrap.name = base.name;
  base.name = "Underlying page";
  wrap.fills = [];
  wrap.clipsContent = true;
  wrap.resize(base.width, base.height);
  wrap.appendChild(base);
  base.x = 0; base.y = 0;
  if (!o.noScrim) {
    const scrim = figma.createRectangle();
    scrim.name = "Dialog overlay · foreground/40 + blur 2";
    scrim.resize(base.width, base.height);
    scrim.fills = paint(C.fg, 0.4);
    scrim.effects = [{ type: "BACKGROUND_BLUR", radius: 2, visible: true }];
    wrap.appendChild(scrim);
  }
  wrap.appendChild(layer);
  applyFills();
  if (o.anchor) {
    const target = base.findOne(function (n) { return n.name === o.anchor; });
    if (target) {
      const ax = target.absoluteTransform[0][2] - wrap.absoluteTransform[0][2];
      const ay = target.absoluteTransform[1][2] - wrap.absoluteTransform[1][2];
      layer.x = Math.round(ax + (o.dx || 0));
      layer.y = Math.round(ay + target.height + (o.dy != null ? o.dy : 6));
      return wrap;
    }
  }
  layer.x = Math.round((base.width - layer.width) / 2);
  layer.y = Math.round(Math.max(64, (Math.min(base.height, 900) - layer.height) / 2));
  return wrap;
}

function dialog(title, desc, body, footer, o) {
  o = o || {};
  return V({ name: "Dialog · " + title, w: o.w || 448, pad: 24, radius: 16, fill: C.white, stroke: C.border, shadow: "floating", gap: 16 }, [
    o.proposed ? proposedTag() : null,
    H({ fillW: true, cross: "start", gap: 12 }, [
      o.icon ? F({ w: 40, h: 40, radius: 20, fill: o.iconBg || C.red50, main: "center", cross: "center" }, [I(o.icon, 20, o.iconColor || C.destructive)]) : null,
      V({ gap: 6, fillW: true }, [T(title, { size: 18, w: 600, fillW: true }), desc ? T(desc, { size: 14, color: C.muted, fillW: true, relaxed: true }) : null]),
      I("x", 16, C.muted)
    ]),
    body ? V({ name: "Dialog body", gap: 16, fillW: true }, body) : null,
    footer ? H({ name: "DialogFooter", gap: 8, main: "end", fillW: true, pt: 8 }, footer) : null
  ]);
}
function proposedTag() {
  return H({ name: "PROPOSED tag", gap: 6, px: 8, py: 4, radius: 6, fill: C.proposed, fo: 0.1, stroke: C.proposed, so: 0.4 }, [
    I("info", 12, C.proposed), T("PROPOSED — not in code yet", { size: 11, w: 600, color: C.proposed, ls: 3 })
  ]);
}
