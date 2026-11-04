// Assembles pages: cover + flow map, design system, one page per flow.

const FLOWS = [
  { id: "01", name: "Authentication & access", routes: "/admin/login · /admin/auth/google · /admin/auth/access-denied · /admin/auth/accept", build: flowAuth },
  { id: "02", name: "Portal shell & navigation", routes: "app/admin/(portal)/layout.tsx · AdminSidebar", build: flowShell },
  { id: "03", name: "Dashboard", routes: "/admin/dashboard", build: flowDashboard },
  { id: "04", name: "Businesses", routes: "/admin/businesses · /admin/businesses/[id]", build: flowBusinesses },
  { id: "05", name: "Business verification", routes: "/admin/verification · /admin/verification/[id]", build: flowVerification },
  { id: "06", name: "Listing reviews", routes: "/admin/listings · /admin/listings/[id]", build: flowListings },
  { id: "07", name: "Bookings", routes: "/admin/bookings · /admin/bookings/[id]", build: flowBookings },
  { id: "08", name: "Payments, refunds & payouts", routes: "/admin/payments", build: flowPayments },
  { id: "09", name: "Users & access", routes: "/admin/users · /admin/users/new", build: flowUsers },
  { id: "10", name: "Roles & permissions", routes: "/admin/roles · /admin/roles/new", build: flowRoles },
  { id: "11", name: "Reviews moderation", routes: "/admin/reviews", build: flowReviews },
  { id: "12", name: "Support", routes: "/admin/support · /admin/support/[id]", build: flowSupport },
  { id: "13", name: "Audit trail", routes: "/admin/audit", build: flowAudit },
  { id: "14", name: "Notifications", routes: "/admin/notifications", build: flowNotifications },
  { id: "15", name: "Settings", routes: "/admin/settings", build: flowSettings },
  { id: "16", name: "Profile & sign out", routes: "/admin/profile", build: flowProfile }
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
    T("SafariNexa Admin Portal", { size: 24, w: 600, color: C.primary }),
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

async function buildFlowPage(flow) {
  const page = figma.createPage();
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
    T("Admin Portal — complete UI", { size: 80, w: 700, color: C.s900, lh: 88, ls: -2 }),
    T("Every admin flow, page, state and modal, generated from the SafariNexa Prototype source (Next.js app/admin). " + totals + " frames across " + results.length + " flows. Confirmation modals for risky actions were proposed here and built in code on 4 Nov 2026.", { size: 24, color: C.s600, relaxed: true, width: 1500 }),
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
    T("Entry: /admin/login → (Google callback | email) → /admin/dashboard. Sidebar reaches every flow; dashboard cards deep-link into Businesses, Verification, Bookings, Payments, Support and Audit.", { size: 20, color: C.s600, width: 2400, relaxed: true })
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
  blocks.push(dsSection("Colour tokens", "From Prototype/src/app/globals.css (:root). Admin tables and filters use the Tailwind slate scale.", [H({ gap: 16, wrap: true, w: 1500, rowGap: 16 }, swatches.map(function (s) {
    return V({ w: 170, gap: 8 }, [F({ w: 170, h: 96, radius: 12, fill: s[1], stroke: C.border }), T(s[0], { size: 14, w: 600 }), T(s[1] + (s[2] ? " · " + s[2] : ""), { size: 12, color: C.s500, width: 170 })]);
  }))]));
  blocks.push(dsSection("Typography · Inter", "type-page 30/36 semibold −2.5% · type-card 18/24 semibold · type-eyebrow 12/20 medium uppercase · body-sm 14 relaxed · caption 12/20.", [
    type.eyebrow("Eyebrow · Admin portal"), type.page("Page title · Bookings oversight"), type.section("Section · Recent refunds"), type.card("Card title · Booking details"), type.body("Body small · Monitor bookings across every business on the platform.", { width: 900 }), type.caption("Caption · Showing 1 to 9 of 142 bookings")
  ]));
  const compsRow = V({ gap: 24 }, []);
  blocks.push(dsSection("Components", "Button and Status badge are real component sets; screens use instances. Dashed purple outline = component set boundary.", [compsRow]));
  blocks.push(dsSection("Form controls & navigation", null, [
    H({ gap: 24, cross: "start", wrap: true, w: 1500, rowGap: 24 }, [
      V({ w: 320, gap: 16 }, [field("Default", { placeholder: "you@example.com" }), field("Filled", { value: "grace.aciro@safarinexa.com" }), field("Focus", { value: "Grace", focus: true }), field("Error", { value: "", placeholder: "Your password", error: true, help: "Incorrect email or password." }), field("Disabled", { value: "grace.aciro@safarinexa.com", disabled: true })]),
      V({ w: 320, gap: 16 }, [field("Select", { value: "Choose a permission level…", select: true }), textarea({ placeholder: "Reviewer notes (shown to the business)" }), checkbox(true, "Checked option", "businesses.manage"), checkbox(false, "Unchecked option", "users.manage"), searchBox("Search records…", { w: 320 }), searchBox("", { value: "lodge", w: 320 })]),
      V({ w: 560, gap: 16 }, [filterTabs([["All", 142], ["Awaiting confirmation", 7], ["Confirmed", 58]], "All"), H({ gap: 12 }, [toolBtn("Filters", "filter"), toolBtn("Filters", "filter", { badge: 2 }), toolBtn("Export", "download")]), pagination(2, 5), tableAction(), helpLabel("Column with help"), tooltip("The recorded booking total, including selected add-ons.", 280), alertBox("This account is not an active admin. Access has been logged.", "destructive"), alertBox("Email invitations are not configured. No access has been granted.", "red", "shield-alert")]),
      V({ w: 256, gap: 4, pad: 8, fill: C.sidebar, radius: 12, stroke: C.sidebarBorder }, [navItem("Dashboard", "layout-dashboard", true), navItem("Businesses", "building-2", false), navItem("Payments", "banknote", false), navItem("Sign out", "log-out", false, false, { danger: true })])
    ])
  ]));
  blocks.push(dsSection("Cards, stats, empty states & dialogs", null, [
    H({ gap: 24, cross: "start", wrap: true, w: 1500, rowGap: 24 }, [
      statCard({ label: "Gross payments", value: "UGX 18,460,000", desc: "Successful payments before refunds · all time", icon: "banknote", action: "View payments" }, 272, 224),
      statCard({ label: "Unsettled business balance", value: "UGX 4,312,800", desc: "Net payment value not yet settled", icon: "banknote", help: true }, 272),
      V({ w: 420 }, [emptyState("No businesses here", "Nothing matches this filter right now.")]),
      dialog("Filter records", "Search and narrow this list. Applying filters starts from the first page.", [field("Search records", { placeholder: "Enter a name or keyword…", h: 36 })], [btnRaw("Apply filters", { size: "sm" })]),
      confirmDialog("Reject this submission?", "The business will be told the submission was rejected, with your reviewer notes.", "Reject submission")
    ])
  ]));
  blocks.push(dsSection("Icons (lucide)", "Instances of these components are used throughout; swap via the instance menu.", []));
  blocks.push(dsSection("Data table", "components/ui/table.tsx: rounded-2xl bordered wrapper, slate-50 header (12 medium slate-500), 16px cell padding, slate-100 row dividers, status badges flattened to neutral chips with a tone dot.", [
    table([{ label: "Business", weight: 2 }, { label: "City", weight: 1 }, { label: "Verification", weight: 1, align: "center", help: true }, { label: "Actions", weight: 1, align: "right" }], [[linkText("Murchison River Lodge"), "Masindi", sb("verification", "APPROVED", "table"), tableAction()], [linkText("Nile View Terrace"), "Jinja", sb("verification", "SUBMITTED", "table"), tableAction()], [linkText("Ziwa Rhino Treks"), "Nakasongola", sb("verification", "SUSPENDED", "table"), tableAction()]], { w: 1200, footer: tableFooter("Showing 1 to 3 of 24 businesses", 1, 3) })
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

  figma.notify("SafariNexa: building design system…", { timeout: 2500 });
  const coverPage = figma.createPage(); coverPage.name = "00 · Cover & flow map";
  const dsPage = figma.createPage(); dsPage.name = "00 · Design system";
  buildDesignSystem(dsPage);

  const results = [];
  for (const flow of FLOWS) {
    figma.notify("Building " + flow.id + " · " + flow.name + "…", { timeout: 1500 });
    await new Promise(function (r) { setTimeout(r, 30); });
    results.push(await buildFlowPage(flow));
  }
  const cover = buildCover(coverPage, results);
  await figma.setCurrentPageAsync(coverPage);
  figma.viewport.scrollAndZoomIntoView([cover]);
  const total = results.reduce(function (s, r) { return s + r.total; }, 0);
  const msg = "SafariNexa admin portal: " + total + " frames on " + (FLOWS.length + 2) + " pages." + (ERRORS.length ? " " + ERRORS.length + " frame(s) failed — see the red placeholders." : "");
  figma.closePlugin(msg);
}

run().catch(function (e) { console.error(e); figma.closePlugin("Generation failed: " + e.message); });
