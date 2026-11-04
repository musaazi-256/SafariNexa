// 01 Entry & sign-in · 02 Onboarding · 03 Shell & navigation · 04 Overview

// ================= 01 ENTRY & SIGN-IN =================
function landingPage() {
  return bareScreen("Partner landing", [siteHeader(), V({ name: "Main · bg-muted/30", w: SCREEN_W, fill: C.mutedBg, fo: 0.3, minH: 760, cross: "center", main: "center", py: 64 }, [
    V({ w: 760, gap: 0, cross: "center" }, [
      F({ w: 64, h: 64, radius: 16, fill: C.primary, fo: 0.1, main: "center", cross: "center" }, [I("building-2", 32, C.primary)]),
      spacer(1, 24),
      T("Partner with SafariNexa", { size: 60, w: 600, lh: 66, ls: -2.5, align: "center" }),
      spacer(1, 24),
      T("Grow your business by reaching thousands of travelers. Manage your bookings, listings, and revenue all in one powerful platform.", { size: 18, color: C.muted, align: "center", width: 672, relaxed: true }),
      spacer(1, 40),
      H({ gap: 16 }, [btnRaw("Register New Business", { size: "lg", icon: "user-plus" }), btnRaw("Log in to Dashboard", { size: "lg", variant: "outline", iconRight: "arrow-right" })])
    ])
  ])]);
}
function acceptInvite(signedIn) {
  return bareScreen(signedIn ? "Join business — signed in" : "Join business — signed out", [V({ w: 448, py: 120, gap: 24, cross: "center" }, [logo(32), card([
    cardHeader("Join your business", "Sign in with the invited email address to join this business."),
    cardContent([btn(signedIn ? "Join business" : "Sign in to accept", { fillW: true })])
  ], { w: 448 })])]);
}
function flowEntry() {
  return [
    { section: "Partner landing · /business", screens: [
      { title: "Partner with SafariNexa", note: "Public marketing entry. Register → /business/onboarding · Log in → /business/auth/sign-in.", build: landingPage }
    ] },
    { section: "Sign in · /business/auth/sign-in", screens: [
      { title: "Sign in — demo mode", note: "AuthCard surface=business, demo mode (default). Email and password are prefilled read-only with business@dev.test; one click signs in via the passwordless demo provider. No Google button.", build: function () { return authPage("Business sign in — demo", authCard({})); } },
      { title: "Sign in — live mode", note: "SAFARINEXA_DEMO_MODE=false: Google + email/password. \"Start onboarding\" links to /business/onboarding.", build: function () { return authPage("Business sign in — live", authCard({ demo: false })); } },
      { title: "Error — invalid_credentials", note: "?error=invalid_credentials after AuthError.", build: function () { return authPage("Business sign in — error", authCard({ demo: false, error: "Incorrect email or password.", fieldError: true })); } },
      { title: "Google — demo fallback · /business/auth/google", note: "In demo builds the Google route renders the same prefilled demo AuthCard.", build: function () { return bareScreen("Business Google — demo", [V({ w: 1180, pad: 32, cross: "center" }, [authCard({ hideGoogle: true })])]); } }
    ] },
    { section: "Team invitation · /business/auth/accept", screens: [
      { title: "Invitation — signed out", note: "Not signed in: sign in with the invited email, then return here.", build: function () { return acceptInvite(false); } },
      { title: "Invitation — signed in", note: "acceptInvitation(token, surface=business) joins the business.", build: function () { return acceptInvite(true); } }
    ] }
  ];
}

// ================= 02 ONBOARDING =================
const ONB_STEPS = [["Business basics", "Business name, category, contact details"], ["Profile details", "Location, services, operating regions"], ["Verification", "Documents and ownership review"], ["Submit for review", "Admin review before publishing"]];
function onboardingShell(name, kids) {
  return bareScreen(name, [onboardingHeader(), V({ name: "Main", w: SCREEN_W, fill: "#FBFAF5", minH: 836, pad: 48, cross: "center" }, kids)], { fill: "#FBFAF5" });
}
function onboardingIntro() {
  return onboardingShell("Onboarding intro", [H({ w: 1152, gap: 48, cross: "center", py: 48 }, [
    V({ fillW: true, gap: 32 }, [
      T("Set up your SafariNexa business profile", { size: 60, w: 600, lh: 66, ls: -2.5, color: C.s900, fillW: true }),
      T("Create your provider account, add business details, and prepare verification so travelers can book with confidence.", { size: 18, color: C.s600, relaxed: true, width: 512 }),
      btnRaw("Begin onboarding", { size: "lg", fill: "#0F6B40", radius: 8 })
    ]),
    card([V({ pad: 32, gap: 32, fillW: true }, [T("Onboarding steps", { size: 24, w: 600, color: C.s900 })].concat(ONB_STEPS.map(function (s, i) {
      return H({ gap: 16, cross: "start" }, [F({ w: 32, h: 32, radius: 16, fill: i === 0 ? C.primary : C.s100, main: "center", cross: "center" }, [T(String(i + 1), { size: 14, w: 600, color: i === 0 ? C.white : C.s500 })]), V({ pt: 4, gap: 4 }, [T(s[0], { size: 16, w: 600, color: C.s900 }), T(s[1], { size: 14, color: C.s500 })])]);
    })))], { w: 448 })
  ])]);
}
const WIZ = ["Business Profile", "Contact Person", "Verification"];
const WIZ_DESC = ["Tell us about your business.", "Who should we contact for operations and support?", "Upload registration documents to verify your business."];
function wizIcon(icon, title, desc) {
  return H({ gap: 16, cross: "start", fillW: true }, [F({ w: 48, h: 48, radius: 12, fill: C.white, fo: 0.1, main: "center", cross: "center" }, [I(icon, 24, C.accent)]), V({ gap: 4, fillW: true }, [T(title, { size: 16, w: 600, color: C.white }), T(desc, { size: 14, color: C.white, opacity: 0.7, fillW: true, relaxed: true })])]);
}
function wizInput(label, ph, o) {
  o = o || {};
  return V({ gap: 8, fillW: !o.w, w: o.w }, [fieldLabel(label, { color: C.s900 }), inputBox({ placeholder: ph, value: o.value, icon: o.icon, readonly: true })]);
}
function onboardingWizard(step, o) {
  o = o || {};
  const filled = !!o.filled;
  let body;
  if (step === 0) body = [wizInput("Registered Business Name", "e.g. Kampala Serena Hotel", { value: filled ? "Nile & Crater Lodges" : "" }), wizInput("Registration / TIN Number", "Enter business registration number", { value: filled ? "80020001234567" : "" }), wizInput("Physical Address", "Enter full physical address", { icon: "map-pin", value: filled ? "Plot 12, Main Street, Jinja" : "" }), V({ gap: 8, fillW: true }, [fieldLabel("Brief Description", { color: C.s900 }), textarea({ placeholder: "Tell us a little bit about what you offer...", value: filled ? "Lodges and boutique stays across Uganda's national parks." : "" })])];
  if (step === 1) body = [wizInput("Full Name", "Jane Doe", { icon: "user", value: filled ? "Farida Nansubuga" : "" }), H({ gap: 24, fillW: true }, [wizInput("Role / Title", "e.g. General Manager", { value: filled ? "Owner" : "" }), wizInput("Phone Number", "+256 700 000000", { value: filled ? "+256 772 123456" : "" })]), wizInput("Work Email", "jane@example.com", { value: filled ? "owner.stays@safarinexa.test" : "" })];
  if (step === 2) body = [V({ name: "Upload · Certificate of Incorporation", pad: 40, radius: 16, stroke: C.border, dash: true, fill: C.s50, cross: "center", gap: 0, fillW: true }, [
    F({ w: 56, h: 56, radius: 28, fill: C.white, shadow: "card", main: "center", cross: "center" }, [I("upload", 24, C.primary)]), spacer(1, 16),
    T("Upload Certificate of Incorporation", { size: 18, w: 600, color: C.s900 }), spacer(1, 8), T("PDF, JPG, or PNG up to 5MB.", { size: 14, color: C.s500 }), spacer(1, 24),
    inputBox({ value: filled ? "certificate.pdf" : "Choose files  No file chosen", w: 320 }),
    filled ? V({ pt: 16 }, [H({ gap: 6, px: 12, py: 4, radius: 999, fill: "#F0FDF4" }, [I("check", 16, C.success), T("certificate.pdf", { size: 14, w: 500, color: C.success })])]) : null
  ])];
  const pct = step / (WIZ.length - 1);
  const next = step < 2 ? btnRaw("Continue", { iconRight: "chevron-right", disabled: !filled }) : o.submitting ? btnRaw("Submitting...", { loading: true, disabled: true }) : btnRaw("Submit for Verification", { disabled: !filled });
  return onboardingShell("Onboarding wizard — step " + (step + 1), [H({ name: "Wizard", w: 1200, radius: 24, fill: C.white, stroke: C.border, shadow: "card", clip: true, cross: "start", minH: 750 }, [
    V({ name: "Brand pane", w: 480, fill: C.chat, pad: 48, gap: 0, fillH: true, main: "between" }, [
      V({ gap: 24, fillW: true }, [logo(36), spacer(1, 16), T("Join the SafariNexa Partner Programme today", { size: 30, w: 600, lh: 36, ls: -2.5, color: C.white, fillW: true }), T("Start earning revenue by promoting your travel offerings—register today to reach thousands of global travelers.", { size: 18, color: C.white, opacity: 0.8, fillW: true, relaxed: true }), spacer(1, 16),
        wizIcon("trending-up", "Convert traffic into revenue", "Earn money by promoting accommodations, tours, and transport in our ecosystem."),
        wizIcon("settings", "Easy-to-use tools", "We optimize our platform to be simple to use so you can focus on your business."),
        wizIcon("headphones", "Customer-driven service", "State-of-the-art technology and support to make it easy for your customers.")]),
      T("© 2026 SafariNexa Partner Network", { size: 14, color: C.white, opacity: 0.5 })
    ]),
    V({ name: "Wizard pane", fillW: true, pad: 48, gap: 0, fillH: true }, [
      H({ fillW: true, main: "between", cross: "start" }, [V({ gap: 4 }, [T(WIZ[step], { size: 24, w: 600, color: C.s900 }), T(WIZ_DESC[step], { size: 14, color: C.s500 })]), H({ px: 12, py: 4, radius: 999, fill: C.s100 }, [T("Step " + (step + 1) + " of 3", { size: 14, w: 500, color: C.muted })])]),
      spacer(1, 32),
      progressSteps(step, 620, pct),
      spacer(1, 48),
      V({ name: "Form", gap: 24, fillW: true }, body),
      grow({ fillH: true }),
      H({ name: "Footer", fillW: true, main: "between", pt: 24, stroke: C.s100, sides: { t: 1 } }, [btnRaw("Back", { variant: "ghost", disabled: step === 0 }), next])
    ])
  ])]);
}
function progressSteps(step, w, pct) {
  const f = figma.createFrame(); f.name = "Progress"; f.fills = []; f.resize(w, 32);
  const track = figma.createRectangle(); track.resize(w, 3); track.fills = paint(C.s100); f.appendChild(track); track.y = 15;
  if (pct > 0) { const bar = figma.createRectangle(); bar.resize(Math.round(w * pct), 3); bar.fills = paint(C.primary); f.appendChild(bar); bar.y = 15; }
  for (let i = 0; i < 3; i++) {
    const done = i < step, cur = i === step;
    const c = F({ w: 32, h: 32, radius: 16, fill: done ? C.primary : C.white, stroke: done || cur ? C.primary : C.s200, sw: 3, main: "center", cross: "center", dir: "V" }, [done ? I("check", 16, C.white) : T(String(i + 1), { size: 12, w: 500, color: cur ? C.primary : C.s400 })]);
    f.appendChild(c); c.x = Math.round(i * (w - 32) / 2); c.y = 0;
  }
  return f;
}
function flowOnboarding() {
  return [
    { section: "Intro · /business/onboarding", screens: [
      { title: "Onboarding intro", note: "Static four-step outline; Begin onboarding → /business/onboarding/setup.", build: onboardingIntro }
    ] },
    { section: "Wizard · /business/onboarding/setup (OnboardingWizard)", screens: [
      { title: "Step 1 — Business Profile (empty)", note: "Continue is disabled until business name and address are filled.", build: function () { return onboardingWizard(0); } },
      { title: "Step 1 — Business Profile (filled)", note: "Inputs use bg-slate-50 → white on focus.", build: function () { return onboardingWizard(0, { filled: true }); } },
      { title: "Step 2 — Contact Person", note: "Continue requires contact name and work email.", build: function () { return onboardingWizard(1, { filled: true }); } },
      { title: "Step 3 — Verification (no file)", note: "Submit disabled until the Certificate of Incorporation is attached.", build: function () { return onboardingWizard(2); } },
      { title: "Step 3 — Verification (file attached)", note: "Attached files show as green chips. Submit → submitBusinessOnboarding → /business/dashboard.", build: function () { return onboardingWizard(2, { filled: true }); } },
      { title: "Step 3 — Submitting", note: "Button shows a spinner and \"Submitting...\".", build: function () { return onboardingWizard(2, { filled: true, submitting: true }); } }
    ] }
  ];
}

// ================= 03 SHELL & NAVIGATION =================
function shellBlank(o) {
  return screen(o.name, o.active || "Overview", function (cw) { return [V({ h: 600, fillW: true, radius: 16, stroke: C.border, dash: true, main: "center", cross: "center" }, [T("Page content", { size: 14, color: C.s400 })])]; }, o);
}
function flowShell() {
  return [
    { section: "Layout · app/business/(portal)/layout.tsx", screens: [
      { title: "Expanded sidebar", note: "SidebarProvider + BusinessSidebar (collapsible=icon). Header: trigger, \"Business portal\", DemoToolbar (Customer, Admin), NotificationBell, UserMenu. Content p-6 on #F8F9FA.", build: function () { return shellBlank({ name: "Shell — expanded" }); } },
      { title: "Collapsed to icons", note: "Sidebar trigger collapses to a 48px icon rail; group labels become separators.", build: function () { return shellBlank({ name: "Shell — collapsed", collapsed: true }); } },
      { title: "Live mode header", note: "Demo toolbar is hidden when demo mode is off.", build: function () { return shellBlank({ name: "Shell — live", demo: false }); } }
    ] },
    { section: "Business switcher · BusinessSwitcher", screens: [
      { title: "Switcher menu (multi-business)", note: "business@dev.test owns four businesses. Selecting one calls setActiveBusiness then refreshes. \"Create new workspace\" → /business/onboarding.", build: function () {
        const base = shellBlank({ name: "Shell — switcher open", switcherOpen: true });
        const items = [{ label: "Your businesses" }, "-"].concat(BIZ_NAMES.map(function (n, i) { return { icon: "building-2", text: n, sub: BIZ_TYPES[i], bold: true, check: i === 0, hover: i === 1 }; })).concat(["-", { icon: "plus", text: "Create new workspace" }]);
        return withOverlay(base, menu(items), { anchor: "BusinessSwitcher", noScrim: true, dx: 0 });
      } },
      { title: "Single business", note: "With one business the \"N businesses\" line is hidden.", build: function () { return shellBlank({ name: "Shell — single business", count: 1 }); } }
    ] }
  ];
}

// ================= 04 OVERVIEW (dashboard) =================
function dashStats(empty) {
  return [
    { label: "Published listings", value: empty ? "0" : "6", desc: (empty ? "0" : "2") + " draft listings", icon: "clipboard-list", action: "View listings" },
    { label: "Awaiting confirmation", value: empty ? "0" : "3", desc: "Booking requests needing a response", icon: "clock", action: "View requests" },
    { label: "Payouts this month", value: empty ? "UGX 0" : "UGX 2,480,000", desc: (empty ? "UGX 0" : "UGX 1,126,400") + " unsettled across all dates", icon: "database", help: true, action: "View earnings" },
    { label: "Average rating", value: empty ? "—" : "4.6", desc: (empty ? "0" : "18") + " published reviews · out of 5", icon: "star", action: "View reviews" }
  ];
}
function quickActions() {
  return card([H({ name: "DashboardQuickActions", pad: 16, gap: 16, fillW: true }, [
    T("Quick actions", { size: 14, w: 500, color: C.s900 }), F({ w: 1, h: 24, fill: C.s200 }),
    btnRaw("Add a listing", { variant: "ghost", icon: "plus" }), btnRaw("Booking calendar", { variant: "ghost", icon: "calendar-days" }), btnRaw("Respond to reviews", { variant: "ghost", icon: "star" }), btnRaw("Business settings", { variant: "ghost", icon: "settings" })
  ])]);
}
function chartCard(title, w, chart, o) {
  o = o || {};
  return card([V({ pad: 24, gap: 16, fillW: true }, [
    H({ fillW: true, main: "between" }, [V({ gap: 4 }, [T(title, { size: 16, w: 600, color: C.s800 }), o.sub ? T(o.sub, { size: 12, color: C.s500 }) : null]), o.legend || null]),
    o.empty ? V({ h: 240, fillW: true, main: "center", cross: "center" }, [T(o.empty, { size: 14, color: C.s500 })]) : V({ gap: 8, fillW: true }, [chart, axisLabels(o.labels || ["1 Nov", "8 Nov", "15 Nov", "22 Nov", "29 Nov"], w - 48)])
  ])], { w: w });
}
function dashboard(o) {
  o = o || {};
  const empty = !!o.empty, unverified = !!o.unverified;
  return screen(o.name || "Overview — populated", "Overview", function (cw) {
    const half = Math.floor((cw - 24) / 2);
    const hero = V({ name: "Hero", fillW: true, h: 180, radius: 16, fill: C.s900, clip: true, main: "center", gradient: null }, [
      H({ fillW: true, pad: 32, main: "between" }, [
        V({ gap: 8 }, [T("WELCOME BACK", { size: 12, w: 500, ls: 10, color: C.accent }), type.page(BIZ_NAMES[0], { color: C.white }), T("Here's what's happening with your business today.", { size: 14, color: C.s200 })]),
        btnRaw("View business profile", { variant: "outline", stroke: C.white, color: C.white, fill: C.s900, iconRight: "external-link" })
      ])
    ]);
    const banner = unverified ? H({ name: "Unverified banner", fillW: true, pad: 16, radius: 8, fill: C.warning, fo: 0.1, stroke: C.warning, so: 0.5, main: "between" }, [
      H({ gap: 8 }, [I("alert-circle", 16, C.warningFg), T("Application Status: UNDER REVIEW - You cannot publish listings yet.", { size: 14, w: 600, color: C.warningFg })]),
      H({ gap: 4 }, [T("Check Status", { size: 14, w: 600, color: C.primary }), I("arrow-right", 16, C.primary)])
    ]) : null;
    const tasks = empty ? [T("No pending booking or listing tasks.", { size: 12, color: C.s500 })] : [
      listRow("Murchison River Lodge", "BK-2417 · Request · respond by 6 Nov", miniBtn("Review", C.primary)),
      listRow("Kibale Forest Edge Camp", "BK-2421 · Request · respond by 7 Nov", miniBtn("Review", C.primary)),
      listRow("Lake Bunyonyi Eco Lodge", "Listing review · NEEDS_CHANGES", miniBtn("Update", C.primary), { last: true })
    ];
    const reviews = empty ? [emptyState("No reviews yet", "Reviews from completed bookings will show up here.")] : [["Murchison River Lodge", 5, "Sarah Nakimuli", "The river view banda was spotless and the staff were wonderful."], ["Kibale Forest Edge Camp", 4, "Joseph Byamukama", "Great base for the chimp trek. Breakfast could be earlier."], ["Lake Bunyonyi Eco Lodge", 5, "Irene Namuli", "Peaceful and beautiful. The canoe trip was a highlight."]].map(function (r) {
      return H({ gap: 12, cross: "start", fillW: true }, [avatar(r[2].split(" ").map(function (x) { return x[0]; }).join(""), 40), V({ fillW: true, gap: 2 }, [
        H({ fillW: true, main: "between" }, [T(r[0], { size: 14, w: 600, color: C.s900 }), H({ gap: 4 }, [I("star", 14, "#FBBF24", { filled: true }), T(String(r[1]), { size: 14, w: 500, color: C.s900 })])]),
        T(r[2] + " • 0" + (2 + r[1] % 3) + "/11/2026", { size: 12, color: C.s500 }),
        spacer(1, 6), T("\"" + r[3] + "\"", { size: 14, italic: true, color: C.s700, fillW: true })
      ])]);
    });
    return [
      hero, banner,
      statGrid(dashStats(empty), cw, 4, true),
      quickActions(),
      H({ gap: 24, fillW: true, cross: "start" }, [
        chartCard("Bookings overview", half, lineChart(half - 48, 220, [{ name: "completed", color: C.chat, values: [0.2, 0.35, 0.3, 0.5, 0.45, 0.6, 0.55] }, { name: "upcoming", color: "#3B82F6", values: [0.3, 0.4, 0.5, 0.45, 0.65, 0.7, 0.8] }, { name: "cancelled", color: "#EF4444", values: [0.05, 0.1, 0.05, 0.1, 0.08, 0.05, 0.1] }]), { legend: legend([["Completed", C.chat], ["Upcoming", "#3B82F6"], ["Cancelled", "#EF4444"]]), empty: empty ? "No bookings this month." : null }),
        chartCard("Revenue overview", half, barChart(half - 48, 220, [0.3, 0.5, 0.2, 0.7, 0.4, 0.6, 0.9, 0.35, 0.55, 0.8]), { sub: "Gross payments this month (UGX)", empty: empty ? "No payments this month." : null })
      ]),
      H({ gap: 24, fillW: true, cross: "start" }, [
        card([V({ pad: 24, gap: 0, fillW: true }, [
          H({ fillW: true, main: "between", pb: 24 }, [H({ gap: 8 }, [T("Needs your attention", { size: 18, w: 600, color: C.s900 }), empty ? null : F({ w: 20, h: 20, radius: 10, fill: "#EF4444", main: "center", cross: "center", dir: "V" }, [T("3", { size: 12, w: 500, color: C.white })])]), T("View all →", { size: 14, w: 600, color: C.primary })]),
          V({ fillW: true, gap: 0 }, tasks),
          V({ pt: 16, fillW: true }, [H({ pt: 16, gap: 8, stroke: C.s100, sides: { t: 1 }, fillW: true }, [I("info", 16, C.s500), T("Reply to these bookings to avoid auto-cancellation.", { size: 12, color: C.s500 })])])
        ])], { w: half }),
        card([V({ pad: 24, gap: 0, fillW: true }, [
          H({ fillW: true, main: "between", pb: 24 }, [T("Recent reviews", { size: 18, w: 600, color: C.s900 }), T("View all →", { size: 14, w: 600, color: C.primary })]),
          V({ fillW: true, gap: 24 }, reviews),
          V({ pt: 24, fillW: true }, [H({ pt: 16, gap: 8, stroke: C.s100, sides: { t: 1 }, fillW: true }, [I("message-square", 16, C.primary), T("Respond to reviews", { size: 12, w: 500, color: C.primary }), T("to build trust with travelers.", { size: 12, color: C.s500 })])])
        ])], { w: half })
      ])
    ];
  }, { maxW: 1136 });
}
function welcomeModal() {
  return V({ name: "Dialog · Welcome to SafariNexa!", w: 448, pad: 24, radius: 16, fill: C.white, stroke: C.border, shadow: "floating", gap: 16 }, [
    F({ w: 48, h: 48, radius: 24, fill: C.warning, fo: 0.1, main: "center", cross: "center" }, [I("alert-circle", 24, C.warning)]),
    T("Welcome to SafariNexa!", { size: 20, w: 600 }),
    T("Your account is currently UNDER REVIEW.\n\nYou can explore the platform and set up your profile, but you won't be able to publish listings or receive bookings until your business is verified.", { size: 16, color: C.muted, relaxed: true, fillW: true }),
    H({ gap: 8, main: "end", fillW: true, pt: 8 }, [btn("Explore platform", { variant: "outline" }), btn("Check verification status")])
  ]);
}
function verificationRequiredModal(action) {
  return V({ name: "Dialog · Verification Required", w: 448, pad: 24, radius: 16, fill: C.white, stroke: C.border, shadow: "floating", gap: 16 }, [
    F({ w: 48, h: 48, radius: 24, fill: C.s100, main: "center", cross: "center" }, [I("file-text", 24, C.s600)]),
    T("Verification Required", { size: 18, w: 600 }),
    T("You cannot " + (action || "add a new listing") + " because your business is not yet verified. Current status: UNDER REVIEW.", { size: 14, color: C.muted, relaxed: true, fillW: true }),
    H({ gap: 12, main: "end", fillW: true, pt: 8 }, [btn("Cancel", { variant: "outline" }), btnRaw("Go to Verification", { iconRight: "arrow-right" })])
  ]);
}
function flowOverview() {
  return [
    { section: "Overview · /business/dashboard", screens: [
      { title: "Overview — populated", note: "Hero with business name, 4 compact StatCards, quick actions, bookings line chart + revenue bar chart (recharts), Needs your attention (OperationsTasks) and Recent reviews.", build: function () { return dashboard({}); } },
      { title: "Overview — new business (empty)", note: "Zero values stay visible; average rating shows an em dash with no reviews.", build: function () { return dashboard({ empty: true, name: "Overview — empty" }); } },
      { title: "Overview — not yet verified", note: "Warning banner links to /business/settings/verification. Publishing actions are blocked.", build: function () { return dashboard({ unverified: true, name: "Overview — unverified" }); } }
    ] },
    { section: "Verification modals · components/business/verification-modals.tsx", screens: [
      { title: "Modal — welcome (unverified)", note: "VerificationWelcomeModal opens automatically on the dashboard while verificationStatus ≠ APPROVED.", build: function () { return withOverlay(dashboard({ unverified: true, name: "Overview — welcome modal" }), welcomeModal()); } },
      { title: "Modal — verification required", note: "VerificationActionModal when \"Add a listing\" is clicked before approval.", build: function () { return withOverlay(dashboard({ unverified: true, name: "Overview — verification required" }), verificationRequiredModal()); } }
    ] }
  ];
}
