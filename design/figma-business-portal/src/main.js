// Assembles pages: cover + flow map, design system, one page per flow.

const FLOWS = [
  { id: "01", name: "Entry & sign in", routes: "/business · /business/auth/sign-in · /business/auth/google · /business/auth/accept", build: flowEntry },
  { id: "02", name: "Onboarding", routes: "/business/onboarding · /business/onboarding/setup", build: flowOnboarding },
  { id: "03", name: "Portal shell & navigation", routes: "app/business/(portal)/layout.tsx · BusinessSidebar · BusinessSwitcher", build: flowShell },
  { id: "04", name: "Overview", routes: "/business/dashboard", build: flowOverview },
  { id: "05", name: "Listings", routes: "/business/listings · /new · /[id]/edit · /[id]/review · /[id]/availability", build: flowListings },
  { id: "06", name: "Guides", routes: "/business/guides · /business/guides/new", build: flowGuides },
  { id: "07", name: "Bookings", routes: "/business/bookings · /business/bookings/[id] · /business/bookings/calendar", build: flowBookings },
  { id: "08", name: "Messages", routes: "/business/messages", build: flowMessages },
  { id: "09", name: "Reviews", routes: "/business/reviews", build: flowReviews },
  { id: "10", name: "Earnings", routes: "/business/revenue", build: flowEarnings },
  { id: "11", name: "Notifications", routes: "/business/notifications", build: flowNotifications },
  { id: "12", name: "Settings & staff access", routes: "/business/settings · ?tab=notifications · ?tab=team · /business/profile · /business/team", build: flowSettings },
  { id: "13", name: "Verification & documents", routes: "/business/settings/verification · /business/verification", build: flowVerification }
];

const GAP_X = 120, GAP_Y = 240, PAD = 120;
const ERRORS = [];

function caption(num, title, note, w) {
  const proposed = /proposed/i.test(title);
  const f = V({ name: "Caption · " + num, w: w, gap: 10 }, [
    H({ gap: 12 }, [
      H({ px: 12, py: 6, radius: 8, fill: proposed ? C.proposed : C.s900 }, [T(num, { size: 20, w: 700, color: C.white })]),
      T(title, { size: 32, w: 700, color: C.s900 })
    ]),
    note ? T(note, { size: 18, color: C.s600, relaxed: true, width: Math.min(w, 1300) }) : null
  ]);
  applyFills();
  return f;
}

function errorFrame(title, e) {
  ERRORS.push(title + ": " + (e && e.message));
  console.error(title, e);
  const f = V({ name: "⚠ " + title + " (generation error)", w: SCREEN_W, h: 400, pad: 40, fill: C.red50, stroke: C.red600, radius: 16, gap: 8 }, [
    T("Could not generate: " + title, { size: 24, w: 700, color: C.red600 }), T(String(e && e.message), { size: 16, color: C.red600, width: 1200 })
  ]);
  applyFills();
  return f;
}

function makeSection(page, name, x, y, w, h) {
  let s;
  try {
    s = figma.createSection();
    s.name = name;
    s.resizeWithoutConstraints(w, h);
    s.fills = paint("#F1F3F5");
  } catch (e) {
    s = figma.createFrame();
    s.name = name;
    s.resize(w, h);
    s.fills = paint("#F1F3F5");
    s.cornerRadius = 24;
  }
  page.appendChild(s);
  s.x = x; s.y = y;
  return s;
}

function pageHeader(flow, sections, totalScreens) {
  const f = V({ name: "Flow header", w: 2400, gap: 20 }, [
    T("SafariNexa Business Portal", { size: 24, w: 600, color: C.primary }),
    T(flow.id + " · " + flow.name, { size: 72, w: 700, color: C.s900, lh: 80, ls: -2 }),
    T(flow.routes, { size: 24, mono: true, color: C.s500 }),
    T(totalScreens + " screens & states · generated from the Prototype source", { size: 20, color: C.s500 }),
    spacer(1, 16),
    H({ gap: 16, wrap: true, w: 2400, rowGap: 16 }, sections.map(function (s, i) {
      return H({ gap: 10, px: 20, py: 14, radius: 14, fill: C.white, stroke: C.border }, [
        T(flow.id + "." + (i + 1), { size: 18, w: 700, color: C.primary }),
        T(s.section + "  (" + s.screens.length + ")", { size: 18, w: 500, color: C.s700 }),
        i < sections.length - 1 ? T("→", { size: 22, color: C.s400 }) : null
      ]);
    }))
  ]);
  applyFills();
  return f;
}

const GEN_KEY = "safarinexa-business-generated";
function markGenerated(page) { page.setPluginData(GEN_KEY, "1"); return page; }
// Pages from earlier runs of this plugin only (marked with plugin data). Never touches other pages.
function previousGeneratedPages() {
  return figma.root.children.filter(function (p) { return p.getPluginData(GEN_KEY) === "1"; });
}

async function buildFlowPage(flow) {
  const page = markGenerated(figma.createPage());
  page.name = flow.id + " · " + flow.name;
  let sections;
  try { sections = flow.build(); } catch (e) { sections = [{ section: "Error", screens: [{ title: "Flow failed", note: String(e.message), build: function () { throw e; } }] }]; }
  const total = sections.reduce(function (s, x) { return s + x.screens.length; }, 0);
  const header = pageHeader(flow, sections, total);
  page.appendChild(header);
  header.x = 0; header.y = 0;
  let y = header.height + 160;
  const index = [];
  sections.forEach(function (sec, si) {
    const built = sec.screens.map(function (sc, i) {
      const num = flow.id + "." + (si + 1) + "." + (i + 1);
      let node;
      try { node = sc.build(); applyFills(); } catch (e) { node = errorFrame(num + " " + sc.title, e); }
      node.name = num + " — " + sc.title;
      const cap = caption(num, sc.title, sc.note, SCREEN_W);
      return { node: node, cap: cap, num: num, title: sc.title };
    });
    const capH = Math.max.apply(null, built.map(function (b) { return b.cap.height; }));
    const maxH = Math.max.apply(null, built.map(function (b) { return b.node.height; }));
    const w = PAD * 2 + built.reduce(function (s, b) { return s + Math.max(SCREEN_W, b.node.width); }, 0) + GAP_X * (built.length - 1);
    const h = PAD * 2 + 80 + capH + 48 + maxH;
    const section = makeSection(page, flow.id + "." + (si + 1) + " · " + sec.section, 0, y, w, h);
    const title = T(flow.id + "." + (si + 1) + "  " + sec.section, { size: 40, w: 700, color: C.s900 });
    section.appendChild(title); title.x = PAD; title.y = PAD - 40;
    let x = PAD;
    built.forEach(function (b) {
      section.appendChild(b.cap); b.cap.x = x; b.cap.y = PAD + 60;
      section.appendChild(b.node); b.node.x = x; b.node.y = PAD + 80 + capH + 48;
      index.push(b.num + "  " + b.title);
      x += Math.max(SCREEN_W, b.node.width) + GAP_X;
    });
    y += h + GAP_Y;
  });
  return { page: page, header: header, index: index, total: total };
}

function buildCover(page, results) {
  const totals = results.reduce(function (s, r) { return s + r.total; }, 0);
  const cover = V({ name: "Cover", w: 1920, pad: 96, gap: 24, fill: C.white, radius: 32, stroke: C.border }, [
    logo(56),
    spacer(1, 24),
    T("Business Portal — complete UI", { size: 80, w: 700, color: C.s900, lh: 88, ls: -2 }),
    T("Every business-portal flow, page, state and modal, generated from the SafariNexa Prototype source (Next.js app/business). " + totals + " frames across " + results.length + " flows.", { size: 24, color: C.s600, relaxed: true, width: 1500 }),
    spacer(1, 16),
    H({ gap: 16 }, [
      H({ gap: 8, px: 16, py: 10, radius: 999, fill: C.s900 }, [T("1440 × auto desktop frames", { size: 16, w: 500, color: C.white })]),
      H({ gap: 8, px: 16, py: 10, radius: 999, fill: C.primary }, [T("Tokens from globals.css / tailwind.config.ts", { size: 16, w: 500, color: C.white })]),
      null
    ])
  ]);
  applyFills();
  page.appendChild(cover); cover.x = 0; cover.y = 0;

  // Flow map: one row per flow, screens chained left → right.
  const map = V({ name: "Flow map", w: 3600, pad: 64, gap: 28, fill: C.white, radius: 32, stroke: C.border }, [
    T("Flow map", { size: 48, w: 700, color: C.s900 }),
    T("Entry: /business → onboarding or /business/auth/sign-in → /business/dashboard. Sidebar reaches every flow; dashboard stat cards and quick actions deep-link into Listings, Bookings, Earnings, Reviews and Settings.", { size: 20, color: C.s600, width: 2400, relaxed: true })
  ].concat(results.map(function (r, i) {
    const flow = FLOWS[i];
    return V({ name: "Flow row · " + flow.name, gap: 12, fillW: true, pt: 20, stroke: C.border, sides: { t: 1 } }, [
      H({ gap: 12 }, [H({ px: 10, py: 4, radius: 8, fill: C.primary }, [T(flow.id, { size: 18, w: 700, color: C.white })]), T(flow.name, { size: 24, w: 700, color: C.s900 }), T(flow.routes, { size: 14, mono: true, color: C.s500 })]),
      H({ gap: 8, wrap: true, w: 3460, rowGap: 8 }, r.index.map(function (s, j) {
        const proposed = /proposed/i.test(s), modal = /modal|tooltip/i.test(s);
        return H({ gap: 8 }, [
          H({ px: 12, py: 8, radius: 10, fill: proposed ? C.proposed : modal ? C.secondary : C.s50, fo: proposed ? 0.1 : 1, stroke: proposed ? C.proposed : C.border }, [T(s, { size: 14, w: 500, color: proposed ? C.proposed : C.s700 })]),
          j < r.index.length - 1 ? T("→", { size: 16, color: C.s400 }) : null
        ]);
      }))
    ]);
  })));
  applyFills();
  page.appendChild(map); map.x = 0; map.y = cover.height + 120;
  return cover;
}

function dsSection(title, desc, kids, w) {
  const f = V({ name: "DS · " + title, w: w || 1600, gap: 20, pad: 48, fill: C.white, radius: 24, stroke: C.border }, [
    T(title, { size: 36, w: 700, color: C.s900 }), desc ? T(desc, { size: 16, color: C.s600, width: 1200, relaxed: true }) : null
  ].concat(kids));
  return f;
}

function buildDesignSystem(page) {
  const blocks = [];
  // Libraries first (components must exist before screens use them)
  const iconLib = buildIconLibrary(page);
  const logoComp = buildLogo(page);
  const btnSet = buildButtonSet(page);
  const badgeSet = buildBadgeSet(page);

  const swatches = [["primary", C.primary, "--primary #087A3E"], ["primary-dark", C.primaryDark, "brand.green-dark"], ["secondary", C.secondary, "--secondary"], ["secondary-fg", C.secondaryFg, "#0B4928"], ["accent", C.accent, "--accent gold"], ["foreground", C.fg, "#151A17"], ["muted-fg", C.muted, "#6B6F68"], ["border", C.border, "#E2E8F0"], ["input", C.input, "#94A3B8"], ["destructive", C.destructive, "--destructive"], ["success", C.success, "--success"], ["warning", C.warning, "--warning"], ["sidebar", C.sidebar, "--sidebar-background"], ["slate-50", C.s50, ""], ["slate-500", C.s500, ""], ["slate-900", C.s900, ""]];
  blocks.push(dsSection("Colour tokens", "From Prototype/src/app/globals.css (:root). Portal tables and filters use the Tailwind slate scale; the business inset background is #F8F9FA.", [H({ gap: 16, wrap: true, w: 1500, rowGap: 16 }, swatches.map(function (s) {
    return V({ w: 170, gap: 8 }, [F({ w: 170, h: 96, radius: 12, fill: s[1], stroke: C.border }), T(s[0], { size: 14, w: 600 }), T(s[1] + (s[2] ? " · " + s[2] : ""), { size: 12, color: C.s500, width: 170 })]);
  }))]));
  blocks.push(dsSection("Typography · Inter", "type-page 30/36 semibold −2.5% · type-card 18/24 semibold · type-eyebrow 12/20 medium uppercase · body-sm 14 relaxed · caption 12/20.", [
    type.eyebrow("Eyebrow · Business portal"), type.page("Page title · Bookings"), type.section("Section · Room types"), type.card("Card title · Booking details"), type.body("Body small · Monitor bookings across every business on the platform.", { width: 900 }), type.caption("Caption · Showing 1 to 9 of 142 bookings")
  ]));
  const compsRow = V({ gap: 24 }, []);
  blocks.push(dsSection("Components", "Button and Status badge are real component sets; screens use instances. Dashed purple outline = component set boundary.", [compsRow]));
  blocks.push(dsSection("Form controls & navigation", null, [
    H({ gap: 24, cross: "start", wrap: true, w: 1500, rowGap: 24 }, [
      V({ w: 320, gap: 16 }, [field("Default", { placeholder: "you@example.com" }), field("Filled", { value: "grace.aciro@safarinexa.com" }), field("Focus", { value: "Grace", focus: true }), field("Error", { value: "", placeholder: "Your password", error: true, help: "Incorrect email or password." }), field("Disabled", { value: "grace.aciro@safarinexa.com", disabled: true })]),
      V({ w: 320, gap: 16 }, [field("Select", { value: "Choose a permission level…", select: true }), textarea({ placeholder: "Reviewer notes (shown to the business)" }), checkbox(true, "Checked option", "businesses.manage"), checkbox(false, "Unchecked option", "users.manage"), searchBox("Search records…", { w: 320 }), searchBox("", { value: "lodge", w: 320 })]),
      V({ w: 560, gap: 16 }, [filterTabs([["All", 142], ["Awaiting confirmation", 7], ["Confirmed", 58]], "All"), H({ gap: 12 }, [toolBtn("Filters", "filter"), toolBtn("Filters", "filter", { badge: 2 }), toolBtn("Export", "download")]), pagination(2, 5), tableAction(), helpLabel("Column with help"), tooltip("The recorded booking total, including selected add-ons.", 280), alertBox("This account is not an active admin. Access has been logged.", "destructive"), alertBox("Email invitations are not configured. No access has been granted.", "red", "shield-alert")]),
      V({ w: 256, gap: 4, pad: 8, fill: C.sidebar, radius: 12, stroke: C.sidebarBorder }, [businessSwitcher({}), navItem("Overview", "layout-dashboard", true), navItem("Listings", "clipboard-list", false), navItem("Bookings", "calendar-clock", false), navItem("Earnings", "banknote", false), navItem("Sign out", "log-out", false, false, { danger: true })])
    ])
  ]));
  blocks.push(dsSection("Cards, stats, empty states & dialogs", null, [
    H({ gap: 24, cross: "start", wrap: true, w: 1500, rowGap: 24 }, [
      statCard({ label: "Gross payments", value: "UGX 2,790,000", desc: "Successful payments before refunds", icon: "banknote", help: true }, 272),
      statCard({ label: "Payouts this month", value: "UGX 2,480,000", desc: "UGX 1,126,400 unsettled across all dates", icon: "database", action: "View earnings" }, 272, null, true),
      V({ w: 420 }, [emptyState("No businesses here", "Nothing matches this filter right now.")]),
      dialog("Filter records", "Search and narrow this list. Applying filters starts from the first page.", [field("Search records", { placeholder: "Enter a name or keyword…", h: 36 })], [btnRaw("Apply filters", { size: "sm" })]),
      confirmDialog("Reject this submission?", "The business will be told the submission was rejected, with your reviewer notes.", "Reject submission")
    ])
  ]));
  blocks.push(dsSection("Icons (lucide)", "Instances of these components are used throughout; swap via the instance menu.", []));
  blocks.push(dsSection("Data table", "components/ui/table.tsx: rounded-2xl bordered wrapper, slate-50 header (12 medium slate-500), 16px cell padding, slate-100 row dividers, status badges flattened to neutral chips with a tone dot.", [
    table([{ label: "Reference", weight: 1 }, { label: "Listing", weight: 2 }, { label: "Status", weight: 1.4, help: true }, { label: "Total", weight: 1, align: "right" }], [["BK-2417", "Murchison River Lodge", sb("booking", "AWAITING_BUSINESS_CONFIRMATION", "table"), "UGX 840,000"], ["BK-2409", "Lake Bunyonyi Eco Lodge", sb("booking", "CONFIRMED", "table"), "UGX 620,000"], ["BK-2384", "Kampala Boutique Stay", sb("booking", "COMPLETED", "table"), "UGX 360,000"]], { w: 1200, footer: tableFooter("Showing 1 to 3 of 24 bookings", 1, 8) })
  ]));
  applyFills();

  let y = 0;
  for (const b of blocks) { page.appendChild(b); b.x = 0; b.y = y; y += b.height + 80; }
  // Move libraries into their slots
  const compBlock = blocks[2];
  compBlock.appendChild(btnSet); compBlock.appendChild(badgeSet); compBlock.appendChild(logoComp);
  const iconBlock = blocks[5];
  iconBlock.appendChild(iconLib);
  applyFills();
  // re-stack after content moved
  y = 0;
  for (const b of blocks) { b.x = 0; b.y = y; y += b.height + 80; }
}

async function run() {
  await Promise.all(["Regular", "Medium", "Semi Bold", "Bold", "Italic", "Medium Italic", "Semi Bold Italic"].map(function (s) { return figma.loadFontAsync({ family: "Inter", style: s }); }));
  try { await figma.loadFontAsync({ family: "Roboto Mono", style: "Regular" }); MONO = { family: "Roboto Mono", style: "Regular" }; } catch (e) {}

  const oldPages = previousGeneratedPages();
  figma.notify("SafariNexa business: building design system…" + (oldPages.length ? " (" + oldPages.length + " old pages will be replaced)" : ""), { timeout: 2500 });
  const coverPage = markGenerated(figma.createPage()); coverPage.name = "00 · Cover & flow map";
  const dsPage = markGenerated(figma.createPage()); dsPage.name = "00 · Design system";
  // New pages go where the old set started, so ordering stays the same.
  const firstOld = oldPages.length ? figma.root.children.indexOf(oldPages[0]) : -1;
  buildDesignSystem(dsPage);

  const results = [];
  for (const flow of FLOWS) {
    figma.notify("Building " + flow.id + " · " + flow.name + "…", { timeout: 1500 });
    await new Promise(function (r) { setTimeout(r, 30); });
    results.push(await buildFlowPage(flow));
  }
  const cover = buildCover(coverPage, results);
  await figma.setCurrentPageAsync(coverPage);
  // Delete the old set only after the new one built, so a failed run never leaves the file empty.
  for (const p of oldPages) { if (!p.removed) p.remove(); }
  if (firstOld >= 0) {
    const fresh = [coverPage, dsPage].concat(figma.root.children.filter(function (p) { return p.getPluginData(GEN_KEY) === "1" && p !== coverPage && p !== dsPage; }));
    fresh.forEach(function (p, i) { figma.root.insertChild(Math.min(firstOld + i, figma.root.children.length - 1), p); });
  }
  figma.viewport.scrollAndZoomIntoView([cover]);
  const total = results.reduce(function (s, r) { return s + r.total; }, 0);
  const msg = "SafariNexa business portal: " + total + " frames on " + (FLOWS.length + 2) + " pages" + (oldPages.length ? " (replaced " + oldPages.length + " old pages)." : ".") + (ERRORS.length ? " " + ERRORS.length + " frame(s) failed — see the red placeholders." : "");
  figma.closePlugin(msg);
}

run().catch(function (e) { console.error(e); figma.closePlugin("Generation failed: " + e.message); });
