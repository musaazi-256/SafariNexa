// Flows: Auth, Shell, Dashboard, Businesses, Verification, Listing reviews

const CUSTOMERS = ["Peter Tumusiime", "Sarah Nakimuli", "Joseph Byamukama", "Irene Namuli", "Emmanuel Kato", "Florence Achen", "Robert Wasswa", "Moses Okwir", "Grace Aciro"];
const BIZ = [
  ["Murchison River Lodge", "Accommodation", "Masindi", "APPROVED", 3],
  ["Pearl Wildlife Safaris", "Tour", "Kampala", "APPROVED", 5],
  ["Kibale Forest Edge Camp", "Accommodation", "Fort Portal", "UNDER_REVIEW", 2],
  ["Nile View Terrace", "Restaurant", "Jinja", "SUBMITTED", 1],
  ["Entebbe Airport Transfers", "Transport", "Entebbe", "NEEDS_CHANGES", 2],
  ["Lake Bunyonyi Eco Lodge", "Accommodation", "Kabale", "APPROVED", 2],
  ["Kampala Boutique Stay", "Accommodation", "Kampala", "REJECTED", 0],
  ["Ziwa Rhino Treks", "Tour", "Nakasongola", "SUSPENDED", 1],
  ["Fort Portal Bites", "Restaurant", "Fort Portal", "APPROVED", 1]
];

// ================= AUTH =================
function authCard(o) {
  o = o || {};
  const demo = o.demo !== false;
  return card([
    V({ name: "CardHeader", gap: 6, pad: 24, fillW: true }, [
      type.eyebrow("admin authentication"),
      T("Sign in to your admin account", { size: 30, w: 600, lh: 36, ls: -2.5, fillW: true }),
      type.body(demo ? "Choose an account below or sign in with your email." : "Continue with Google or your SafariNexa email.", { fillW: true })
    ]),
    cardContent([
      o.error ? alertBox(o.error, "destructive") : null,
      o.hideGoogle ? null : btn("Continue with Google", { variant: "secondary", fillW: true }),
      H({ gap: 12, fillW: true }, [hr(), T("OR", { size: 12, w: 500, color: C.muted }), hr()]),
      V({ gap: 12, fillW: true }, [
        V({ gap: 6, fillW: true }, [fieldLabel("Email"), inputBox({ placeholder: "you@example.com", value: o.email, error: o.fieldError, focus: o.focus === "email" })]),
        V({ gap: 6, fillW: true }, [fieldLabel("Password"), inputBox({ placeholder: "Your password", value: o.email ? "••••••••••" : "", error: o.fieldError })]),
        V({ pt: 4, fillW: true }, [o.loading ? btnRaw("Sign in with email", { loading: true, fillW: true, disabled: true }) : btn("Sign in with email", { fillW: true })])
      ]),
      T("Admin accounts are provisioned by SafariNexa super admins only — there is no self-service sign-up.", { size: 12, color: C.muted, align: "center", fillW: true }),
      demo ? V({ name: "Quick access", pad: 12, radius: 12, stroke: C.border, fill: C.secondary, fo: 0.3, gap: 8, fillW: true }, [
        T("Quick access", { size: 12, w: 500, upper: true, ls: 2.5, color: C.muted }),
        btnRaw("Continue as admin", { variant: "outline", stroke: C.border, fillW: true })
      ]) : null
    ], { gap: 16 })
  ], { w: 448 });
}
function authPage(name, cardNode) {
  return bareScreen(name, [siteHeader(), V({ name: "Container", w: 1180, py: 56, cross: "center", minH: 680, main: "center" }, [cardNode])]);
}

function flowAuth() {
  return [
    { section: "Admin sign in · /admin/login", screens: [
      { title: "Sign in — demo mode", note: "AuthCard surface=admin. Demo builds show Quick access with the seeded admin account.", build: function () { return authPage("Sign in — demo mode", authCard({})); } },
      { title: "Sign in — live mode", note: "Production: Google + email/password only. No sign-up link for admins.", build: function () { return authPage("Sign in — live mode", authCard({ demo: false })); } },
      { title: "Sign in — filled & submitting", note: "useFormStatus pending: button shows spinner and is disabled.", build: function () { return authPage("Sign in — submitting", authCard({ demo: false, email: "grace.aciro@safarinexa.com", loading: true })); } },
      { title: "Error — admin_denied", note: "?error=admin_denied after AuthError on the admin surface. Attempt is logged to the audit trail.", build: function () { return authPage("Sign in — error admin_denied", authCard({ demo: false, error: "This account is not an active admin. Access has been logged." })); } },
      { title: "Error — invalid_credentials", note: "Empty email/password redirects with ?error=invalid_credentials.", build: function () { return authPage("Sign in — error invalid_credentials", authCard({ demo: false, error: "Incorrect email or password.", fieldError: true })); } }
    ] },
    { section: "Google sign in · /admin/auth/google → /callback", screens: [
      { title: "Continue with Google — live", note: "Only an existing, active AdminUser can sign in. Callback redirects to returnTo or /admin/dashboard, or to Access denied.", build: function () {
        const decisions = [["Admin allowed", "An active admin account with an assigned role signs in and returns to the admin portal."], ["Existing email needs provider link", "The email matches an account that has not linked Google yet. The link is confirmed before access continues."], ["Admin denied", "Unknown, suspended or role-less accounts are refused. The attempt is recorded in the audit trail."]];
        return bareScreen("Continue with Google — live", [siteHeader(), V({ w: 1180, pt: 24, pb: 80, gap: 0 }, [
          pageHero("Admin Google authentication", "Continue with Google", "Admin accounts are never created from Google. Only an existing, active AdminUser record can sign in this way.", { w: 640 }),
          H({ name: "Warning", w: 576, gap: 8, pad: 14, radius: 12, fill: C.warning, fo: 0.1, stroke: C.warning, so: 0.3, cross: "start" }, [I("shield-alert", 16, C.warningFg), T("Unknown, suspended, or unassigned-role Google accounts are denied and logged to the audit trail.", { size: 14, color: C.warningFg, fillW: true })]),
          spacer(1, 24),
          V({ w: 384 }, [btnRaw("Continue with Google", { variant: "outline", icon: "google", fillW: true })]),
          spacer(1, 40),
          T("What happens after Google responds", { size: 14, w: 600, upper: true, ls: 2.5, color: C.muted }),
          spacer(1, 12),
          H({ gap: 12, wrap: true, w: 1180 }, decisions.map(function (d) { return card([V({ pad: 20, gap: 6, fillW: true }, [T(d[0], { size: 14, w: 500 }), T(d[1], { size: 14, color: C.muted, relaxed: true, fillW: true })])], { w: 584, stroke: C.border, dash: true }); }))
        ])]);
      } },
      { title: "Google — demo mode fallback", note: "In demo builds /admin/auth/google renders AuthCard without the Google button.", build: function () { return bareScreen("Google — demo fallback", [V({ w: 1180, pad: 32, cross: "center" }, [authCard({ hideGoogle: true })])]); } }
    ] },
    { section: "Access control", screens: [
      { title: "Access denied · /admin/auth/access-denied", note: "Shown when the Google callback or requireAdminSession() rejects the account or permission.", build: function () {
        return authPage("Access denied", card([V({ pt: 32, px: 24, pb: 24, gap: 12, cross: "center", fillW: true }, [
          F({ w: 48, h: 48, radius: 24, fill: C.destructive, fo: 0.1, main: "center", cross: "center" }, [I("shield-x", 24, C.destructive)]),
          T("Access denied", { size: 20, w: 600, ls: -2.5 }),
          T("Your account is not authorised for this administrative action. It may be inactive or missing the required role permission. Ask a super admin to check your access. No additional administrative access has been granted.", { size: 14, color: C.muted, relaxed: true, align: "center", fillW: true }),
          spacer(1, 4), btn("Back to admin sign in", { variant: "secondary" })
        ])], { w: 448, stroke: C.destructive, so: 0.3 }));
      } }
    ] },
    { section: "Accept admin invitation · /admin/auth/accept?token=…", screens: [
      { title: "Invitation — signed out", note: "Sign in with the invited email; returnTo brings the admin back here.", build: function () { return acceptPage("Invitation — signed out", false); } },
      { title: "Invitation — signed in", note: "acceptInvitation server action assigns the invited role, then redirects into the portal.", build: function () { return acceptPage("Invitation — signed in", true); } },
      { title: "Invitation — error", note: "Thrown by acceptInvitation: wrong email, malformed or expired token. Rendered by the route error boundary.", build: function () { return acceptPage("Invitation — expired / wrong email", true, "Invitation expired or belongs to another email."); } }
    ] }
  ];
}
function acceptPage(name, signedIn, error) {
  return bareScreen(name, [V({ w: 448, py: 48, gap: 24, cross: "center", minH: 900, main: "center" }, [
    logo(32),
    card([
      V({ gap: 6, pad: 24, fillW: true }, [T("Accept admin invitation", { size: 24, w: 600, ls: -2.5 }), type.body("Sign in with the invited email address to accept the permission level assigned to you.", { fillW: true })]),
      cardContent([error ? alertBox(error, "destructive", "shield-alert") : null, btn(signedIn ? "Accept assigned role" : "Sign in to accept", { fillW: true })])
    ], { w: 448 })
  ])]);
}

// ================= SHELL =================
function flowShell() {
  return [
    { section: "Portal shell · layout.tsx + AdminSidebar", screens: [
      { title: "Shell — sidebar expanded", note: "Sidebar groups: Platform, Operations, Community, Insights. Active item = route prefix match.", build: function () { return screen("Shell — expanded", "Dashboard", function (cw) { return [pageHero("Admin portal", "Page title", "Each admin route renders inside this shell. LiveRefresh keeps data current.", {}), emptyState("Page content", "Routes render here at their own max width.")]; }); } },
      { title: "Shell — sidebar collapsed (icon)", note: "SidebarTrigger toggles collapsible=\"icon\" (3rem rail). Tooltips show labels on hover.", build: function () { return screen("Shell — collapsed", "Bookings", function (cw) { return [pageHero("Admin portal", "Bookings oversight", "Monitor bookings across every business on the platform."), emptyState("Page content", "Content expands to the freed width.")]; }, { collapsed: true }); } },
      { title: "Header — live mode, no unread", note: "DemoToolbar only renders in demo mode. Bell badge hidden at 0 unread, caps at 99+.", build: function () { return screen("Header — live, 0 unread", "Settings", function () { return [pageHero("Admin portal", "Platform Settings", "Review platform configuration.")]; }, { demo: false, unread: 0, minH: 400 }); } }
    ] },
    { section: "Header elements", screens: [
      { title: "Notification bell states", note: "0 / 3 / 120 (99+) unread.", build: function () {
        const f = H({ name: "Notification bell states", pad: 32, gap: 32, fill: C.white, radius: 16, stroke: C.border }, [bellNode(0), bellNode(3), bellNode(120)]);
        applyFills(); return f;
      } }
    ] }
  ];
}

// ================= DASHBOARD =================
function statCard(s, w, h) {
  return card([
    V({ pad: 20, gap: 0, fillW: true, minH: h ? null : 160, fillH: !!h }, [
      H({ fillW: true, cross: "start", main: "between", gap: 12 }, [
        s.help ? helpLabel(s.label) : T(s.label, { size: 12, w: 500, color: C.s500, lh: 20 }),
        s.icon ? F({ w: 32, h: 32, radius: 8, fill: C.s50, stroke: C.s100, main: "center", cross: "center" }, [I(s.icon, 16, C.s500)]) : null
      ]),
      spacer(1, 12),
      T(s.value, { size: 24, w: 600, color: C.s800, lh: 30, ls: -2.5 }),
      spacer(1, 8),
      T(s.desc, { size: 12, color: C.s500, lh: 20, fillW: true }),
      s.action && h ? grow({ fillH: true }) : null,
      s.action ? V({ pt: 16, fillW: true }, [V({ pt: 12, stroke: C.s100, sides: { t: 1 }, fillW: true }, [H({ gap: 4 }, [T(s.action, { size: 12, w: 500, color: C.primary, underline: true }), I("arrow-up-right", 14, C.primary)])])]) : null
    ])
  ], { w: w, h: h });
}
function statGrid(stats, cw, cols, h) {
  cols = cols || 4;
  const w = Math.floor((cw - 16 * (cols - 1)) / cols);
  return H({ name: "StatGrid", gap: 16, wrap: true, w: cw, rowGap: 16, cross: "start" }, stats.map(function (s) { return statCard(s, w, h); }));
}
function dashStats(empty) {
  const z = empty;
  return [
    { label: "Gross payments", value: z ? "UGX 0" : "UGX 18,460,000", desc: "Successful payments before refunds · all time", icon: "banknote", action: "View payments" },
    { label: "Unsettled business balance", value: z ? "UGX 0" : "UGX 4,312,800", desc: "Net payment value not yet settled", icon: "banknote", help: true },
    { label: "Total bookings", value: z ? "0" : "142", desc: "All booking states · all time", icon: "clipboard-check", action: "View bookings" },
    { label: "Verified businesses", value: z ? "0" : "18", desc: "Businesses with approved verification", icon: "building-2", action: "View businesses" },
    { label: "Cancelled bookings", value: z ? "0" : "9", desc: "Cancelled by customers, businesses or admins", icon: "x-circle", action: "View bookings" },
    { label: "Payments this month", value: z ? "UGX 0" : "UGX 3,240,000", desc: "Successful payments before refunds", icon: "banknote", help: true },
    { label: "Published listings", value: z ? "0" : "37", desc: "Listings currently published", icon: "book-open" },
    { label: "Completed refunds", value: z ? "UGX 0" : "UGX 760,000", desc: "Recorded completed refunds · all time", icon: "undo-2" },
    { label: "Platform rating", value: z ? "—" : "4.6", desc: z ? "0 published reviews · out of 5" : "86 published reviews · out of 5", icon: "star" },
    { label: "Open support cases", value: z ? "0" : "6", desc: "Open, in progress or waiting on a customer", icon: "life-buoy", action: "View support" },
    { label: "Resolved or closed cases", value: z ? "0" : "41", desc: "Cases marked resolved or closed", icon: "check-circle", action: "View support" },
    { label: "Verification in progress", value: z ? "0" : "4", desc: "Submitted, under review or needing changes", icon: "shield-check", action: "View verification" }
  ];
}
function panel(title, link, rows, o) {
  o = o || {};
  return card([V({ pad: o.pad || 20, gap: 0, fillW: true, h: o.h }, [
    H({ fillW: true, main: "between", pb: 12, stroke: C.s100, sides: o.noRule ? {} : { b: 1 } }, [T(title, { size: o.titleSize || 14, w: 600, color: C.s900 }), link ? H({ gap: 4 }, [T(link, { size: 12, w: 500, color: C.primary }), o.arrow ? I("arrow-right", 12, C.primary) : null]) : null]),
    spacer(1, o.noRule ? 8 : 4),
    V({ fillW: true, gap: 0 }, rows)
  ])], { w: o.w });
}
function listRow(title, sub, right, o) {
  o = o || {};
  return H({ name: "Row · " + title, fillW: true, py: 10, gap: 8, stroke: C.s100, sides: o.last ? {} : { b: 1 } }, [
    o.lead || null,
    V({ fillW: true, gap: 0 }, [T(title, { size: 12, w: 500, color: C.s900, fillW: true }), sub ? T(sub, { size: 12, w: 500, color: C.s500 }) : null]),
    right || null
  ]);
}
function miniBtn(label, color) { return H({ h: 24, px: 10, radius: 6, stroke: C.border }, [T(label, { size: 12, w: 500, color: color || C.fg })]); }
function imagePh(w, h, label) {
  return F({ name: "Image placeholder", w: w, h: h, fill: C.s100, main: "center", cross: "center", gap: 6 }, [I("image", 24, C.s400), label ? T(label, { size: 11, color: C.s400 }) : null]);
}

function dashboard(empty) {
  return screen(empty ? "Dashboard — empty platform" : "Dashboard — populated", "Dashboard", function (cw) {
    const leftW = Math.floor((cw - 24) * 7 / 12), rightW = cw - 24 - leftW;
    const colW = Math.floor((cw - 72) / 4);
    const featured = empty ? [emptyState("No featured businesses", "Approved businesses will appear here.")] : [H({ gap: 16, fillW: true }, BIZ.filter(function (b) { return b[3] === "APPROVED"; }).slice(0, 4).map(function (b) {
      const cwid = Math.floor((leftW - 48 - 48) / 4);
      return V({ name: "Featured · " + b[0], w: cwid, radius: 12, stroke: C.border, fill: C.white, clip: true }, [imagePh(cwid, 112), V({ pad: 12, gap: 8, fillW: true }, [
        V({ gap: 0, fillW: true }, [T(b[0], { size: 14, w: 600, color: C.s900, fillW: true }), T(b[2] + ", Uganda", { size: 12, w: 500, color: C.s500 })]),
        H({ fillW: true, main: "between" }, [sb("verification", b[3]), I("chevron-right", 14, C.s400)])
      ])]);
    }))];
    const acts = ["admin approved refund", "verification approved", "listing submission approved", "admin moderate review"];
    const activity = empty ? [T("No recorded events.", { size: 12, color: C.s500 })] : acts.map(function (a, i) {
      return H({ gap: 10, cross: "start", py: 6, fillW: true }, [V({ pt: 6 }, [dot(6, C.emerald600)]), V({ fillW: true }, [T(a, { size: 12, w: 600, color: C.s800 }), T("0" + (4 - i) + "/11/2026, 1" + i + ":2" + i + ":05", { size: 12, w: 500, color: C.s500 })])]);
    });
    const queues = empty ? [T("No pending business submissions.", { size: 12, color: C.s500 }), T("No pending booking or listing tasks.", { size: 12, color: C.s500 })] : [
      listRow("Nile View Terrace", "Submitted 2 Nov", miniBtn("Review")),
      listRow("Kibale Forest Edge Camp", "Submitted 31 Oct", miniBtn("Review")),
      listRow("Murchison River Lodge", "BK-2417 · Booking request", miniBtn("Review", C.primary)),
      listRow("3-Day Wildlife Safari", "Listing review · SUBMITTED", miniBtn("Review", C.primary), { last: true })
    ];
    const support = empty ? [T("No active cases.", { size: 12, color: C.s500 })] : [
      ["Refund not received for BK-2398", "Sarah Nakimuli • 03/11/2026"], ["Cannot upload trading licence", "Pearl Wildlife Safaris • 02/11/2026"], ["Change of travel dates", "Joseph Byamukama • 01/11/2026"], ["Payment declined twice", "Irene Namuli • 30/10/2026"]
    ].map(function (r, i) { return listRow(r[0], r[1], H({ h: 24, px: 10, radius: 6, stroke: C.border }, [T("Open", { size: 12, w: 500, color: C.s500 })]), { last: i === 3 }); });
    const perf = empty ? [T("No approved businesses yet.", { size: 12, color: C.s500 })] : [
      ["Murchison River Lodge", "32 bookings", "UGX 6,120,000"], ["Pearl Wildlife Safaris", "27 bookings", "UGX 5,480,000"], ["Lake Bunyonyi Eco Lodge", "19 bookings", "UGX 2,940,000"], ["Fort Portal Bites", "11 bookings", "UGX 640,000"]
    ].map(function (r, i) { return listRow(r[0], r[1], V({ cross: "end" }, [T(r[2], { size: 12, w: 500, color: C.primary }), T("Booking value", { size: 12, color: C.muted })]), { lead: T("#" + (i + 1), { size: 12, w: 500, color: C.amber600 }), last: i === 3 }); });
    const recent = empty ? [] : [["admin_approved_refund", "grace.aciro@safarinexa.com", "14:22:05"], ["verification_approved", "admin@safarinexa.test", "13:10:41"], ["listing_submission_approved", "admin@safarinexa.test", "12:02:19"], ["demo_payouts_completed", "System", "09:45:00"]]
      .map(function (r, i) { return listRow(r[0], r[1], H({ gap: 6 }, [H({ px: 6, py: 2, radius: 2, fill: C.emerald100 }, [T("SUCCESS", { size: 12, w: 500, color: C.emerald800 })]), T(r[2], { size: 12, w: 500, color: C.s500 })]), { last: i === 3 }); });
    return [
      pageHero("Admin portal", "Dashboard", "Platform overview: bookings, revenue, verification, and support at a glance."),
      statGrid(dashStats(empty), cw, 4, 224),
      H({ gap: 24, fillW: true, cross: "start" }, [
        panel("Featured Businesses", "View all businesses", featured, { w: leftW, pad: 24, titleSize: 16, noRule: true, arrow: true }),
        panel("Recent Platform Activity", "View all activity", activity, { w: rightW, pad: 24, titleSize: 16, noRule: true })
      ]),
      H({ gap: 24, fillW: true, cross: "start" }, [
        panel("Action Queues", "View all queues", queues, { w: colW, h: 340 }),
        panel("Active Support Cases", "View all cases", support, { w: colW, h: 340 }),
        panel("Top Performers", "View all businesses", perf, { w: colW, h: 340 }),
        panel("Recent Actions", "View audit log", recent.length ? recent : [T("No recorded events.", { size: 12, color: C.s500 })], { w: colW, h: 340 })
      ]),
      H({ name: "Revenue Overview banner", fillW: true, pad: 20, gap: 24, radius: 16, fill: C.primary, fo: 0.05, stroke: C.primary, so: 0.2, shadow: "sm" }, [
        H({ gap: 14 }, [F({ w: 40, h: 40, radius: 20, fill: C.primary, main: "center", cross: "center" }, [I("trending-up", 20, C.white)]), V({}, [T("Revenue Overview", { size: 14, w: 600, color: C.s900 }), T("Total revenue this month", { size: 12, w: 500, color: C.s500 })])]),
        H({ gap: 12 }, [T(empty ? "UGX 0" : "UGX 3,240,000", { size: 24, w: 600, color: C.s900, ls: -2.5 }), H({ px: 8, py: 2, radius: 4, fill: C.emerald100, gap: 4 }, [T("Current", { size: 12, w: 500, color: C.emerald800 }), T("records", { size: 12, w: 600, color: C.s500 })])]),
        empty ? H({ w: 320, h: 40 }, [T("No payment history to chart.", { size: 12, color: C.muted })]) : sparkline(320, 40),
        btnRaw("View payments", { variant: "ghost", color: C.primary, iconRight: "arrow-right" })
      ])
    ];
  });
}
function sparkline(w, h) {
  const f = F({ name: "Sparkline · daily recorded payments", dir: "NONE", w: w, h: h });
  const v = figma.createVector();
  const pts = [30, 34, 26, 28, 18, 22, 12, 20, 16, 8, 14, 6, 10, 4];
  let d = "";
  pts.forEach(function (y, i) { d += (i ? " L " : "M ") + (2 + i * (w - 4) / (pts.length - 1)).toFixed(1) + " " + y; });
  v.vectorPaths = [{ windingRule: "NONE", data: d }];
  v.strokes = paint(C.primary); v.strokeWeight = 2; v.strokeCap = "ROUND"; v.strokeJoin = "ROUND";
  f.appendChild(v);
  return f;
}
function flowDashboard() {
  return [{ section: "Dashboard · /admin/dashboard", screens: [
    { title: "Dashboard — populated", note: "12 KPI cards, featured businesses, activity, 4 operational queues and revenue banner. Links route to each feature.", build: function () { return dashboard(false); } },
    { title: "Dashboard — empty platform", note: "Zero-data copy from code: “No pending business submissions.”, “No pending booking or listing tasks.”, “No payment history to chart.”", build: function () { return dashboard(true); } }
  ] }];
}

// ================= BUSINESSES =================
function bizToolbar(o) {
  o = o || {};
  return H({ name: "Table toolbar", gap: 12 }, [searchBox("Search businesses…", { value: o.q }), toolBtn("Filters", "filter", { badge: o.filters || null }), toolBtn("Export", "download")]);
}
const BIZ_TABS = ["All", "Submitted", "Under review", "Approved", "Needs changes", "Rejected", "Suspended"];
function businessesList(variant) {
  return screen("Businesses — " + variant, "Businesses", function (cw) {
    let rows = BIZ;
    let active = "All", q = null, filters = null;
    if (variant === "filtered") { rows = BIZ.filter(function (b) { return b[3] === "APPROVED" && /Lodge/.test(b[0]); }); active = "Approved"; q = "lodge"; filters = 1; }
    if (variant === "empty") { rows = []; active = "Suspended"; q = "kampala"; }
    const body = rows.map(function (b) {
      return [H({ gap: 12 }, [F({ w: 40, h: 40, radius: 12, fill: C.primary, fo: 0.1, main: "center", cross: "center" }, [I("building-2", 20, C.primary)]), linkText(b[0], { color: C.s700 })]), b[1], b[2], sb("verification", b[3], "table"), String(b[4]), tableAction()];
    });
    return [
      pageHero("Admin portal", "Businesses", "Directory of every business on the platform, with verification state."),
      filterTabs(BIZ_TABS, active),
      bizToolbar({ q: q, filters: filters }),
      rows.length ? table([{ label: "Business", weight: 3 }, { label: "Type", weight: 1.3 }, { label: "City", weight: 1.3 }, { label: "Verification", weight: 1.4, align: "center" }, { label: "Listings", weight: 1, align: "right" }, { label: "Actions", weight: 1, align: "right" }], body, { w: cw, footer: tableFooter("Showing 1 to " + rows.length + " of " + (variant === "filtered" ? rows.length : 24) + " businesses", 1, variant === "filtered" ? 1 : 3) })
        : emptyState("No businesses here", "Nothing matches this filter right now.")
    ];
  });
}
function filterDialog(fieldLabelText, options, selected, q) {
  return dialog("Filter records", "Search and narrow this list. Applying filters starts from the first page.", [
    V({ gap: 8, fillW: true }, [T("Search records", { size: 14, w: 500, color: C.s700 }), inputBox({ placeholder: "Enter a name or keyword…", value: q, h: 36 })]),
    V({ gap: 8, fillW: true }, [T(fieldLabelText, { size: 14, w: 500, color: C.s700 }), inputBox({ value: selected || "All", select: true, h: 36 })]),
    V({ name: "Select menu (open)", fillW: true, radius: 12, stroke: C.border, fill: C.white, shadow: "md", py: 4 }, ["All"].concat(options).map(function (op) {
      const on = op === (selected || "All");
      return H({ fillW: true, px: 12, h: 32, fill: on ? C.s100 : null, gap: 8 }, [on ? I("check", 14, C.fg) : spacer(14, 14), T(op, { size: 14, color: C.fg })]);
    }))
  ], [H({ fillW: true, main: "between", pt: 16, stroke: C.s100, sides: { t: 1 } }, [T("Reset all", { size: 14, w: 500, color: C.s600, underline: true }), btnRaw("Apply filters", { size: "sm" })])]);
}
function businessDetail(empty) {
  const b = empty ? ["Kampala Boutique Stay", "accommodation", "Kampala", "REJECTED"] : BIZ[0];
  return screen("Business profile — " + (empty ? "sparse" : "populated"), "Businesses", function (cw) {
    const leftW = Math.floor((cw - 32) * 2 / 3), rightW = cw - 32 - leftW;
    return [
      H({ gap: 4 }, [I("chevron-left", 16, C.s500), T("Back to businesses", { size: 14, w: 500, color: C.s500 })]),
      card([H({ pad: 32, gap: 32, cross: "start", fillW: true }, [
        F({ w: 96, h: 96, radius: 16, fill: C.bizTint, stroke: C.bizGreen, so: 0.2, main: "center", cross: "center" }, [I("building-2", 40, C.bizGreen)]),
        V({ fillW: true, gap: 4 }, [
          type.page(b[0], { color: C.s900 }), T(b[1].toLowerCase(), { size: 14, w: 600, color: C.s500, capitalize: true }), spacer(1, 20),
          H({ gap: 24, wrap: true }, [
            H({ gap: 8 }, [I("map-pin", 16, C.s400), T(b[2] + ", Uganda", { size: 14, w: 600, color: C.s600 })]),
            H({ gap: 8 }, [I("mail", 16, C.s400), T(empty ? "stay@kampalaboutique.ug" : "bookings@murchisonriverlodge.com", { size: 14, w: 600, color: C.s600 })]),
            empty ? null : H({ gap: 8 }, [I("phone", 16, C.s400), T("+256 772 415 900", { size: 14, w: 600, color: C.s600 })])
          ])
        ]),
        sb("verification", b[3])
      ])]),
      H({ gap: 32, fillW: true, cross: "start" }, [
        V({ w: leftW, gap: 32 }, [
          card([V({ pad: 24, gap: 16, fillW: true }, [T("About this business", { size: 18, w: 600, color: C.s900 }), T(empty ? "No description provided." : "Family-run riverside lodge on the Victoria Nile, 20 minutes from Paraa ferry. Twelve bandas, a restaurant and guided game drives into Murchison Falls National Park.", { size: 14, w: 500, color: C.s600, relaxed: true, fillW: true })])]),
          card([panelHeader("Listings (" + (empty ? 0 : 3) + ")"), V({ fillW: true }, empty ? [V({ pad: 24, fillW: true, cross: "center" }, [T("No listings created yet.", { size: 14, w: 600, color: C.s500 })])] : [["Murchison River Lodge", "accommodation", "PUBLISHED"], ["Sunset Nile Cruise", "tour", "PUBLISHED"], ["Family Suite Weekend", "accommodation", "DRAFT"]].map(function (l, i) {
            return H({ pad: 20, fillW: true, main: "between", stroke: C.s100, sides: i < 2 ? { b: 1 } : {} }, [V({}, [T(l[0], { size: 14, w: 500, color: C.s900 }), T(l[1], { size: 12, w: 500, color: C.s500, capitalize: true })]), H({ px: 10, py: 4, radius: 999, fill: C.s100 }, [T(l[2], { size: 12, w: 500, color: C.s600, ls: 5 })])]);
          }))])
        ]),
        V({ w: rightW, gap: 32 }, [
          V({ gap: 16, fillW: true }, [statCard({ label: "Confirmed booking value", value: empty ? "UGX 0" : "UGX 6,120,000", desc: "Confirmed and completed bookings · all time", help: true }, rightW), statCard({ label: "Total bookings", value: empty ? "0" : "36", desc: "All booking states · all time" }, rightW)]),
          card([panelHeader("Staff Members", "users"), V({ fillW: true }, (empty ? [["Brian Mugisha", "brian@kampalaboutique.ug", "OWNER"]] : [["Moses Okwir", "moses@murchisonriverlodge.com", "OWNER"], ["Grace Aciro", "grace@murchisonriverlodge.com", "MANAGER"]]).map(function (s) {
            return V({ pad: 16, gap: 4, fillW: true, stroke: C.s100, sides: { b: 1 } }, [T(s[0], { size: 14, w: 500, color: C.s900 }), H({ fillW: true, main: "between" }, [T(s[1], { size: 12, w: 500, color: C.s500 }), H({ px: 8, py: 2, radius: 2, fill: C.bizTint }, [T(s[2], { size: 12, w: 500, color: C.bizGreen, ls: 10 })])])]);
          }))]),
          card([panelHeader("Verification History", "file-text"), V({ fillW: true }, empty ? [V({ pad: 24, fillW: true, cross: "center" }, [T("No verifications submitted.", { size: 14, w: 600, color: C.s500 })])] : [["APPROVED", "12/09/2026"], ["NEEDS_CHANGES", "28/08/2026"]].map(function (v) {
            return V({ pad: 16, gap: 4, fillW: true, stroke: C.s100, sides: { b: 1 } }, [H({ fillW: true, main: "between" }, [T("Request", { size: 14, w: 500, color: C.s900 }), sb("verification", v[0])]), T(v[1], { size: 12, w: 500, color: C.s500 })]);
          }))])
        ])
      ])
    ];
  }, { maxW: 1000, gap: 32 });
}
function flowBusinesses() {
  return [
    { section: "Business directory · /admin/businesses", screens: [
      { title: "List — all businesses", note: "Status pill tabs, PortalSearch, Filters dialog, Export (visible rows CSV), 9 rows per page.", build: function () { return businessesList("all"); } },
      { title: "List — filtered + search", note: "?status=approved&q=lodge. Search shows clear (×). Filters badge counts active fields.", build: function () { return businessesList("filtered"); } },
      { title: "List — empty result", note: "EmptyState “No businesses here”.", build: function () { return businessesList("empty"); } },
      { title: "Modal — Filters", note: "PortalFilter dialog. Field: Verification status. “Reset all” clears; “Apply filters” resets to page 1.", build: function () { return withOverlay(businessesList("all"), filterDialog("Verification status", ["Not started", "Draft", "Submitted", "Under review", "Needs changes", "Approved", "Rejected", "Suspended"], "Approved", "lodge")); } },
      { title: "Tooltip — Export status", note: "After Export: role=status text “CSV download requested. Only visible rows are included.”", build: function () { return withOverlay(businessesList("all"), tooltip("CSV download requested. Only visible rows are included.", 300), { noScrim: true, anchor: "Button · Export", dy: 8 }); } }
    ] },
    { section: "Business profile · /admin/businesses/[id]", screens: [
      { title: "Profile — populated", note: "Header card, about, listings, booking value stats, staff, verification history (links to /admin/verification/[id]).", build: function () { return businessDetail(false); } },
      { title: "Profile — sparse / empty sections", note: "“No description provided.”, “No listings created yet.”, “No verifications submitted.” No phone shown when missing.", build: function () { return businessDetail(true); } }
    ] }
  ];
}

// ================= VERIFICATION =================
const VER_TABS = ["All", "Submitted", "Under review", "Pending docs", "Completed", "Fraud holds"];
function verificationItem(name, cat, date, docs, status, notes, cw) {
  return card([V({ pad: 24, gap: 16, fillW: true }, [
    H({ fillW: true, gap: 16, cross: "start" }, [
      V({ gap: 2, fillW: true }, [T(name, { size: 16, w: 600, color: C.s900 }), spacer(1, 6), T("Review submitted profile and documents", { size: 12, w: 600, color: C.primary, underline: true }), T(cat + " · Submitted on " + date, { size: 12, w: 500, color: C.s500 })]),
      H({ gap: 8, cross: "end" }, [
        textarea({ placeholder: "Reviewer notes (shown to the business)", value: notes, w: 288, h: 80, focus: !!notes }),
        H({ gap: 8 }, [btnRaw("Approve", { size: "xs", radius: 8, px: 16 }), btnRaw("Request more", { size: "xs", radius: 8, px: 16, fill: C.s100, color: C.s700 }), btnRaw("Flag", { size: "xs", radius: 8, px: 16, fill: C.red50, color: C.red600 })])
      ])
    ]),
    V({ gap: 10, fillW: true }, [T("SUBMITTED DOCUMENTS", { size: 12, w: 500, color: C.s500, ls: 5 }),
      docs.length ? H({ gap: 12, wrap: true, fillW: true }, docs.map(function (d) { return H({ gap: 10, px: 14, py: 8, radius: 12, stroke: C.border, fill: C.s50, fo: 0.8 }, [I("square", 14, C.s400), T(d, { size: 12, w: 500, color: C.s700 }), sb("verification", status)]); }))
        : T("No documents submitted.", { size: 14, color: C.muted })
    ])
  ])]);
}
function verificationQueue(variant) {
  return screen("Verification queue — " + variant, "Business verification", function (cw) {
    const items = variant === "empty" ? [] : [
      ["Nile View Terrace", "Restaurant", "2 Nov 2026", ["TRADING LICENCE", "CERTIFICATE OF INCORPORATION", "TIN CERTIFICATE"]],
      ["Kibale Forest Edge Camp", "Accommodation", "31 Oct 2026", ["TRADING LICENCE", "UTB LICENCE"]],
      ["Entebbe Airport Transfers", "Transport", "29 Oct 2026", []]
    ];
    return [
      H({ fillW: true, main: "between", cross: "start" }, [pageHero("Admin portal", "Verification queue", "Review submitted profiles, certificate of operations, and business documents.", { w: 640 }), T("Review listing submissions and photos →", { size: 14, underline: true })]),
      filterTabs(VER_TABS, variant === "empty" ? "Fraud holds" : "Submitted"),
      V({ gap: 16, fillW: true }, items.length ? items.map(function (it, i) { return verificationItem(it[0], it[1], it[2], it[3], "SUBMITTED", variant === "notes" && i === 0 ? "Trading licence photo is cropped. Please upload the full page showing the expiry date." : "", cw); })
        : [V({ pad: 24, radius: 12, stroke: C.border, fill: C.white, fillW: true }, [T("No matching verification submissions.", { size: 16, color: C.muted })])]),
      items.length ? H({ fillW: true, main: "between", px: 4 }, [T("Showing 1 to 3 of 3 verifications", { size: 12, w: 500, color: C.s500 }), pagination(1, 1)]) : null
    ];
  }, { maxW: 1450 });
}
function verificationDetail(variant) {
  return screen("Verification detail — " + variant, "Business verification", function (cw) {
    const leftW = cw - 24 - 340;
    const noDocs = variant === "no-documents";
    const status = variant === "approved" ? "APPROVED" : variant === "no-documents" ? "NEEDS_CHANGES" : "UNDER_REVIEW";
    const fields = [["Business name", "Nile View Terrace"], ["Registration number", noDocs ? "Not provided" : "80020004561239"], ["Contact name", "Daniel Ssali"], ["Contact role", "Director"], ["Contact email", "daniel@nileviewterrace.ug"], ["Contact phone", "+256 701 223 448"], ["Address", "Plot 14, Nile Crescent, Bujagali", "full"], ["City", "Jinja"], ["Country", "Uganda"]];
    return [
      btnRaw("Back to verification queue", { variant: "ghost", size: "sm", icon: "arrow-left", px: 4 }),
      H({ fillW: true, main: "between", cross: "start" }, [pageHero("Business verification", "Nile View Terrace", "Review the business information and supporting documents before recording your decision.", { w: 640 }), sb("verification", status)]),
      H({ gap: 24, fillW: true, cross: "start" }, [
        V({ w: leftW, gap: 24 }, [
          card([cardHeader("Business information", noDocs ? "Current business profile. An earlier copy was not retained with this submission." : "Information saved with this submission.", { icon: "building-2" }), cardContent([
            dl(fields, { w: leftW - 48, dtWeight: 600, gapY: 20 }),
            V({ pt: 20, stroke: C.border, sides: { t: 1 }, gap: 8, fillW: true }, [T("About the business", { size: 12, w: 600, color: C.muted }), T(noDocs ? "No description provided." : "Riverside terrace restaurant serving Ugandan and continental dishes overlooking the source of the Nile. Seats 80 guests.", { size: 14, relaxed: true, fillW: true })])
          ])]),
          card([cardHeader("Supporting documents", (noDocs ? "0 documents" : "3 documents") + " attached to this submission.", { icon: "file-text" }), cardContent(noDocs ? [emptyState("No documents attached", "Ask the business to upload the supporting documents needed for verification.")] : ["TRADING LICENCE", "CERTIFICATE OF INCORPORATION", "TIN CERTIFICATE"].map(function (d) {
            return H({ fillW: true, pad: 16, radius: 12, stroke: C.border, fill: C.mutedBg, fo: 0.2, gap: 16 }, [F({ w: 40, h: 40, radius: 12, fill: C.primary, fo: 0.1, main: "center", cross: "center" }, [I("file-text", 20, C.primary)]), V({ fillW: true }, [T(d, { size: 14, w: 600 }), T("Uploaded 2 Nov 2026", { size: 12, color: C.muted })]), btnRaw("View document", { variant: "outline", size: "sm", iconRight: "external-link" })]);
          }), { gap: 12 })])
        ]),
        V({ w: 340, gap: 24 }, [
          card([cardHeader("Submission details"), cardContent([
            V({ gap: 4 }, [T("Submitted", { size: 12, color: C.muted }), T("2 Nov 2026, 10:42 EAT", { size: 14, w: 500 })]),
            variant === "approved" ? V({ gap: 4 }, [T("Last reviewed", { size: 12, color: C.muted }), T("4 Nov 2026", { size: 14, w: 500 })]) : null,
            btn("View business profile", { variant: "outline", size: "sm" })
          ])]),
          card([cardHeader("Review decision", "Your notes are shared with the business.", { icon: "clipboard-check" }), cardContent([
            variant === "error" ? alertBox("Enter reviewer notes (1–5000 characters).", "destructive") : null,
            V({ gap: 8, fillW: true }, [fieldLabel("Reviewer notes"), textarea({ placeholder: "Explain your decision or the changes required.", value: variant === "approved" ? "All documents verified against URSB records." : "", error: variant === "error", h: 80 })]),
            V({ gap: 8, fillW: true }, [btn("Approve business", { fillW: true }), btn("Start review", { variant: "outline", fillW: true }), btn("Request changes", { variant: "outline", fillW: true }), btn("Reject submission", { variant: "destructive", fillW: true })])
          ])])
        ])
      ])
    ];
  }, { maxW: 1152 });
}
function confirmDialog(title, desc, confirm, o) {
  o = o || {};
  return dialog(title, desc, o.body || null, [btn("Cancel", { variant: "outline", size: "sm" }), btn(confirm, { variant: o.variant || "destructive", size: "sm" })], { icon: o.icon || "alert-triangle", iconBg: o.iconBg, iconColor: o.iconColor });
}
function flowVerification() {
  return [
    { section: "Verification queue · /admin/verification", screens: [
      { title: "Queue — Submitted (default tab)", note: "Default ?status=submitted. Inline quick decision: notes + Approve / Request more (NEEDS_CHANGES) / Flag (SUSPENDED). Notes default to “No notes provided by reviewer.”", build: function () { return verificationQueue("default"); } },
      { title: "Queue — reviewer typing notes", note: "Notes textarea focused; shown to the business with the decision.", build: function () { return verificationQueue("notes"); } },
      { title: "Queue — empty", note: "“No matching verification submissions.” Pagination hidden when total is 0.", build: function () { return verificationQueue("empty"); } }
    ] },
    { section: "Verification review · /admin/verification/[id]", screens: [
      { title: "Detail — under review", note: "Business info snapshot, documents (open in new tab), submission details, decision form (notes required).", build: function () { return verificationDetail("default"); } },
      { title: "Detail — validation error", note: "updateVerificationStatus throws when notes are empty or >5000 characters.", build: function () { return verificationDetail("error"); } },
      { title: "Detail — no documents / profile fallback", note: "No submittedProfile → current profile + note. EmptyState for documents.", build: function () { return verificationDetail("no-documents"); } },
      { title: "Detail — approved", note: "Status badge Approved, “Last reviewed” row appears, notes prefilled from reviewNotes.", build: function () { return verificationDetail("approved"); } },
      { title: "Modal — confirm reject", note: "Built 4 Nov 2026: confirmation step via ConfirmSubmit (src/components/admin/confirm-submit.tsx).", build: function () { return withOverlay(verificationDetail("default"), confirmDialog("Reject this submission?", "Nile View Terrace will be told the submission was rejected, with your reviewer notes. They will need to submit again.", "Reject submission", { body: [V({ gap: 8, fillW: true }, [fieldLabel("Reviewer notes"), textarea({ value: "Registration number does not match URSB records.", h: 80 })])] })); } },
      { title: "Modal — confirm fraud hold", note: "Built 4 Nov 2026: confirmation step via ConfirmSubmit (src/components/admin/confirm-submit.tsx).", build: function () { return withOverlay(verificationQueue("default"), confirmDialog("Place a fraud hold?", "The business will be suspended and its listings hidden until the hold is lifted. This is recorded in the audit trail.", "Flag business")); } }
    ] }
  ];
}

// ================= LISTING REVIEWS =================
const LIST_TABS = ["Submitted", "Under review", "Approved", "Needs changes", "Rejected", "Withdrawn"];
function listingQueue(empty) {
  return screen("Listing review queue — " + (empty ? "empty" : "submitted"), "Listing reviews", function (cw) {
    const items = empty ? [] : [["3-Day Wildlife Safari", "Pearl Wildlife Safaris", "tour", "03/11/2026"], ["Lake View Banda Weekend", "Lake Bunyonyi Eco Lodge", "accommodation", "02/11/2026"], ["Kampala Special Hire — Half Day", "Entebbe Airport Transfers", "transport", "01/11/2026"]];
    return [
      pageHero("Admin portal", "Listing review queue", "Review submitted listing details, prices and photos before publication."),
      filterTabs(LIST_TABS, empty ? "Withdrawn" : "Submitted"),
      items.length ? V({ gap: 16, fillW: true }, items.map(function (it) {
        return card([V({ pad: 24, gap: 16, fillW: true }, [
          H({ fillW: true, main: "between", cross: "start" }, [V({ gap: 2 }, [T(it[0], { size: 16, w: 600, color: C.s900 }), T(it[1] + " · " + it[2] + " · Submitted on " + it[3], { size: 12, w: 500, color: C.s500 })]), btnRaw("Review listing", { size: "sm", textSize: 12 })]),
          T("Review the submitted information and photos. Business verification is checked separately.", { size: 14, w: 500, color: C.s500, relaxed: true, fillW: true })
        ])]);
      })) : V({ pad: 40, radius: 16, stroke: C.border, fill: C.white, fillW: true, cross: "center" }, [T("No submissions in this status.", { size: 14, color: C.s500 })]),
      T("Showing up to 100 most recent " + (empty ? "withdrawn" : "submitted") + " submissions.", { size: 12, w: 500, color: C.s500 })
    ];
  }, { maxW: 1450 });
}
function listingReview(variant) {
  const decided = variant === "approved";
  return screen("Listing review — " + variant, "Listing reviews", function (cw) {
    const checks = [["I inspected every cover, gallery and room photo for relevance and appropriateness.", "photos"], ["Description, location and category details are complete and consistent.", "accuracy"], ["Prices, units, room/capacity and booking information are clear.", "pricing"], ["Cancellation terms and applicable business evidence have been reviewed.", "policies"]];
    const allChecked = variant === "ready";
    const someChecked = variant === "error";
    const inner = cw - 48;
    const half = Math.floor((inner - 24) / 2);
    return [
      T("Back to listing queue", { size: 14, underline: true }),
      pageHero("Admin portal", "Review listing submission", "Check submitted details and photos, then record your review decision."),
      T("3-Day Wildlife Safari · " + (decided ? "APPROVED" : variant === "under-review" ? "UNDER REVIEW" : "SUBMITTED"), { size: 16 }),
      T("Business: Pearl Wildlife Safaris (APPROVED)", { size: 16, underline: true }),
      T("Submitted 2026-11-03T08:14:22.000Z · submitter usr_8f2k1", { size: 16 }),
      T("Review the saved submission below, including all cover, gallery and room images. Approval publishes this exact content. Missing or inappropriate images require changes; upload alone is not approval.", { size: 16, fillW: true, relaxed: true }),
      V({ name: "ListingSubmissionContent", pad: 24, radius: 16, stroke: C.border, fill: C.white, shadow: "sm", fillW: true }, [
        dl([["Title", "3-Day Wildlife Safari"], ["Type", "TOUR"], ["Location", "Murchison Falls National Park"], ["Duration days", "3"], ["Price per person minor", "UGX 1,450,000"], ["Max group size", "8"],
          ["Description", "Game drives, a launch cruise to the bottom of the falls and a hike to the top. Includes park fees, guide and full-board lodging.", "full", 400],
          ["Cancellation policy", "Free cancellation up to 14 days before departure. 50% refund 7–13 days before.", "full", 400]], { w: inner, gapY: 20 }),
        spacer(1, 20),
        V({ gap: 8, fillW: true }, [T("Cover image url", { size: 12, w: 600, color: C.muted }), imagePh(half, 200, "Cover photo"), T("Open original photo", { size: 14, underline: true })]),
        spacer(1, 20),
        V({ gap: 8, fillW: true }, [T("Gallery images", { size: 12, w: 600, color: C.muted }), H({ gap: 12, fillW: true }, [1, 2].map(function (n) { return V({ pad: 16, radius: 12, stroke: C.border, fill: C.mutedBg, fo: 0.1, w: half, gap: 8 }, [imagePh(half - 32, 160, "Gallery " + n), T("Open original photo", { size: 14, underline: true })]); }))])
      ]),
      decided ? V({ name: "Reviewer feedback", pad: 24, radius: 16, stroke: C.border, fill: C.white, shadow: "sm", gap: 8, fillW: true }, [T("Reviewer feedback", { size: 16, w: 600 }), T("Photos and pricing verified. Published.", { size: 16, fillW: true }), T("Reviewer: admin@safarinexa.test · 2026-11-04T09:02:11.000Z", { size: 14, relaxed: true })]) : null,
      decided ? null : V({ name: "Review decision form", pad: 24, radius: 16, stroke: C.border, fill: C.white, shadow: "sm", gap: 16, fillW: true }, [
        T("Review decision", { size: 20, w: 600 }),
        variant === "error" ? alertBox("Complete every approval check.", "destructive") : null,
        V({ gap: 12, fillW: true }, [T("Approval checklist (all required to approve)", { size: 16 })].concat(checks.map(function (c, i) { return checkbox(allChecked || (someChecked && i < 2), c[0], null, { w: 400 }); }))),
        T("Reasons / changes required (visible to the business)", { size: 16, w: 600 }),
        textarea({ value: allChecked ? "All photos relevant; pricing and policy clear." : variant === "error" ? "Looks good." : "", h: 104, error: false }),
        H({ gap: 12, wrap: true }, [btn("Start review", { variant: "outline" }), btn("Request changes", { variant: "outline" }), btn("Reject", { variant: "destructive" }), btn("Approve and publish", {})])
      ])
    ];
  }, { maxW: 896 });
}
function flowListings() {
  return [
    { section: "Listing review queue · /admin/listings", screens: [
      { title: "Queue — Submitted", note: "Requires businesses.manage. Status tabs, up to 100 most recent submissions per status.", build: function () { return listingQueue(false); } },
      { title: "Queue — empty status", note: "“No submissions in this status.”", build: function () { return listingQueue(true); } }
    ] },
    { section: "Listing review · /admin/listings/[id]", screens: [
      { title: "Review — pending (checklist unchecked)", note: "Snapshot renders every field and photo. Decision form visible while SUBMITTED / UNDER_REVIEW.", build: function () { return listingReview("pending"); } },
      { title: "Review — ready to approve", note: "All 4 checks ticked + notes (required except Start review).", build: function () { return listingReview("ready"); } },
      { title: "Review — validation error", note: "decideListing throws “Complete every approval check.” or “Record your review reasons (1–5000 characters).”", build: function () { return listingReview("error"); } },
      { title: "Review — decided (approved)", note: "Form hidden once decided; reviewer feedback section shows notes, reviewer and time.", build: function () { return listingReview("approved"); } },
      { title: "Modal — confirm reject", note: "Built 4 Nov 2026: confirmation step via ConfirmSubmit (src/components/admin/confirm-submit.tsx).", build: function () { return withOverlay(listingReview("ready"), confirmDialog("Reject this listing?", "The business will see your reasons. The listing stays unpublished until they submit a new revision.", "Reject listing")); } },
      { title: "Modal — confirm publish", note: "Built 4 Nov 2026: confirmation step via ConfirmSubmit (src/components/admin/confirm-submit.tsx).", build: function () { return withOverlay(listingReview("ready"), confirmDialog("Approve and publish?", "This exact content, including 3 photos and the price of UGX 1,450,000 per person, will go live immediately.", "Approve and publish", { variant: "default", icon: "check-circle", iconBg: C.successSoft, iconColor: C.success })); } }
    ] }
  ];
}
