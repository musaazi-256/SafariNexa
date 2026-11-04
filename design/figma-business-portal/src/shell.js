// App shell: BusinessSidebar + header (app/business/(portal)/layout.tsx, components/business/business-sidebar.tsx)

const NAV = [
  { items: [["Overview", "layout-dashboard"], ["Listings", "clipboard-list"], ["Guides", "users"], ["Bookings", "calendar-clock"], ["Messages", "message-circle"], ["Reviews", "star"], ["Earnings", "banknote"]] },
  { label: "Settings", items: [["Notifications", "bell"], ["Settings", "settings"]] }
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

function businessSwitcher(o) {
  o = o || {};
  const name = o.business || BIZ_NAMES[0];
  return H({ name: "BusinessSwitcher", h: 48, px: 8, gap: 10, radius: 6, fillW: true, main: "between", fill: o.open ? C.sidebarAccent : null }, [
    H({ gap: 10 }, [I("building-2", 16, C.primary), V({ gap: 0 }, [T(name, { size: 14, w: 500, color: C.fg, lh: 18 }), o.count === 1 ? null : T((o.count || 4) + " businesses", { size: 12, color: C.muted })])]),
    I("chevrons-up-down", 14, C.muted)
  ]);
}

function sidebar(active, o) {
  o = o || {};
  const collapsed = !!o.collapsed;
  const groups = NAV.map(function (g) {
    return V({ name: "SidebarGroup" + (g.label ? " · " + g.label : ""), pad: 8, gap: 4, fillW: true, cross: collapsed ? "center" : "start" }, [
      g.label && !collapsed ? H({ h: 32, px: 8, fillW: true }, [T(g.label, { size: 12, w: 500, color: C.sidebarFg, opacity: 0.7 })]) : null,
      g.label && collapsed ? hr(C.sidebarBorder, { name: "Group separator" }) : null
    ].concat(g.items.map(function (it) { return navItem(it[0], it[1], it[0] === active, collapsed); })));
  });
  const header = collapsed
    ? V({ name: "SidebarHeader", pad: 8, cross: "center", fillW: true }, [H({ w: 32, h: 32, radius: 6, main: "center" }, [I("building-2", 16, C.primary)])])
    : V({ name: "SidebarHeader", pad: 8, gap: 8, fillW: true }, [
      H({ px: 6, pb: 0 }, [T("SafariNexa", { size: 12, w: 500, upper: true, ls: 2.5, color: C.primary })]),
      businessSwitcher({ business: o.business, count: o.count, open: o.switcherOpen })
    ]);
  const footer = V({ name: "SidebarFooter", pad: 8, gap: 4, fillW: true, cross: collapsed ? "center" : "start" }, [navItem("Sign out", "log-out", false, collapsed, { danger: true })]);
  return V({ name: collapsed ? "BusinessSidebar · collapsed (icon)" : "BusinessSidebar", w: collapsed ? 48 : SIDEBAR_W, fill: C.sidebar, stroke: C.sidebarBorder, sides: { r: 1 }, fillH: true }, [
    header, V({ name: "SidebarContent", fillW: true, gap: 0 }, groups), grow({ fillH: true, name: "flex" }), footer
  ]);
}

function bellNode(unread) {
  const b = H({ name: "NotificationBell", w: 36, h: 36, radius: 8, main: "center" }, [I("bell", 16, C.s500)]);
  if (!unread) return b;
  const wrap = figma.createFrame();
  wrap.name = "NotificationBell · " + unread + " unread";
  wrap.fills = []; wrap.resize(36, 36); wrap.clipsContent = false;
  wrap.appendChild(b);
  const count = H({ name: "Unread count", px: 4, radius: 999, fill: C.primary, h: 16, main: "center" }, [T(unread > 99 ? "99+" : String(unread), { size: 12, color: C.white, lh: 16 })]);
  wrap.appendChild(count);
  count.x = 36 - count.width + 4; count.y = -4;
  return wrap;
}

function topHeader(o) {
  o = o || {};
  return H({ name: "Header", h: 64, px: 24, gap: 16, stroke: C.border, sides: { b: 1 }, fill: C.white, fillW: true, main: "between" }, [
    H({ gap: 16 }, [H({ name: "SidebarTrigger", w: 28, h: 28, radius: 6, main: "center" }, [I("panel-left", 16, C.fg)]), T("Business portal", { size: 14, w: 600, color: C.s900 })]),
    H({ gap: 16 }, [
      o.demo === false ? null : H({ name: "DemoToolbar", gap: 8 }, [
        H({ h: 36, px: 8, main: "center" }, [T("Customer", { size: 12, w: 500, color: C.muted })]),
        H({ h: 36, px: 8, main: "center" }, [T("Admin", { size: 12, w: 500, color: C.muted })])
      ]),
      bellNode(o.unread == null ? 2 : o.unread),
      H({ name: "UserMenu", gap: 0 }, [avatar("MT", 32)])
    ])
  ]);
}

/** Full 1440 business screen. kids go into the content column (width = cw). */
function screen(name, active, kidsFn, o) {
  o = o || {};
  const cw = Math.min(o.maxW || CONTENT_W, o.collapsed ? SCREEN_W - 48 - 48 : CONTENT_W);
  const kids = kidsFn(cw);
  const content = V({ name: "Page content", fillW: true, pad: CONTENT_PAD, cross: "center" }, [
    V({ name: "Container (max-w " + cw + ")", w: cw, gap: o.gap != null ? o.gap : 24 }, kids)
  ]);
  const root = H({ name: name, w: SCREEN_W, fill: PAGE_BG, cross: "start", clip: true }, [
    sidebar(active, { collapsed: o.collapsed, business: o.business, count: o.count, switcherOpen: o.switcherOpen }),
    V({ name: "SidebarInset", fillW: true, fill: PAGE_BG }, [topHeader(o), content])
  ]);
  root.minHeight = o.minH || 900;
  applyFills();
  return root;
}
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
function onboardingHeader() {
  return H({ name: "Onboarding header", h: 64, w: SCREEN_W, px: 24, stroke: C.border, sides: { b: 1 }, fill: C.white }, [logo(28)]);
}

function withOverlay(base, layer, o) {
  o = o || {};
  applyFills();
  const wrap = figma.createFrame();
  wrap.name = base.name; base.name = "Underlying page";
  wrap.fills = []; wrap.clipsContent = true;
  wrap.resize(base.width, base.height);
  wrap.appendChild(base); base.x = 0; base.y = 0;
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
      layer.x = Math.round(target.absoluteTransform[0][2] - wrap.absoluteTransform[0][2] + (o.dx || 0));
      layer.y = Math.round(target.absoluteTransform[1][2] - wrap.absoluteTransform[1][2] + target.height + (o.dy != null ? o.dy : 6));
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
    H({ fillW: true, cross: "start", gap: 12 }, [
      o.icon ? F({ w: 40, h: 40, radius: 20, fill: o.iconBg || C.red50, main: "center", cross: "center" }, [I(o.icon, 20, o.iconColor || C.destructive)]) : null,
      V({ gap: 6, fillW: true }, [T(title, { size: 18, w: 600, fillW: true }), desc ? T(desc, { size: 14, color: C.muted, fillW: true, relaxed: true }) : null]),
      I("x", 16, C.muted)
    ]),
    body ? V({ name: "Dialog body", gap: 16, fillW: true }, body) : null,
    footer ? H({ name: "DialogFooter", gap: 8, main: "end", fillW: true, pt: 8 }, footer) : null
  ]);
}
function menu(items, o) {
  o = o || {};
  return V({ name: "DropdownMenu", w: o.w || 256, pad: 4, radius: 12, fill: C.white, stroke: C.border, shadow: "floating", gap: 0 }, items.map(function (it) {
    if (it === "-") return V({ py: 4, fillW: true }, [hr()]);
    if (it.label) return H({ px: 8, py: 6, fillW: true }, [T(it.label, { size: 12, w: 500, color: C.muted })]);
    return H({ name: "Menu item · " + it.text, gap: 8, px: 8, py: 8, radius: 8, fillW: true, fill: it.hover ? C.sidebarAccent : null }, [
      it.icon ? I(it.icon, 16, it.danger ? C.destructive : C.s600) : null,
      V({ gap: 0, fillW: true }, [T(it.text, { size: 14, w: it.bold ? 600 : 400, color: it.danger ? C.destructive : C.fg }), it.sub ? T(it.sub, { size: 12, color: C.muted }) : null]),
      it.check ? I("check", 16, C.primary) : null
    ]);
  }));
}
