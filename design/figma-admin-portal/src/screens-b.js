// Flows: Bookings, Payments, Users, Roles, Reviews, Support, Audit, Notifications, Settings, Profile

// ================= BOOKINGS =================
const BOOKINGS = [
  ["4 Nov 2026, 09:14", "BK-2417", "Murchison River Lodge", "Room: Riverside Banda · +1 add-on", "Murchison River Lodge", "Peter Tumusiime", "AWAITING_BUSINESS_CONFIRMATION", "UGX 900,000"],
  ["3 Nov 2026, 16:40", "BK-2416", "3-Day Wildlife Safari", null, "Pearl Wildlife Safaris", "Sarah Nakimuli", "CONFIRMED", "UGX 2,900,000"],
  ["3 Nov 2026, 11:02", "BK-2415", "Entebbe Airport Transfer", null, "Entebbe Airport Transfers", "Joseph Byamukama", "PENDING_PAYMENT", "UGX 150,000"],
  ["2 Nov 2026, 18:27", "BK-2414", "Lake View Banda", "Room: Lake View Banda · +2 add-ons", "Lake Bunyonyi Eco Lodge", "Irene Namuli", "COMPLETED", "UGX 870,000"],
  ["1 Nov 2026, 08:55", "BK-2413", "Kibale Chimpanzee Trek", null, "Pearl Wildlife Safaris", "Emmanuel Kato", "CANCELLED_BY_CUSTOMER", "UGX 1,100,000"],
  ["31 Oct 2026, 13:20", "BK-2412", "Nile View Terrace", null, "Nile View Terrace", "Florence Achen", "CONFIRMED", "UGX 0"],
  ["30 Oct 2026, 10:11", "BK-2411", "Kampala Half-Day City Tour", null, "Pearl Wildlife Safaris", "Robert Wasswa", "REVIEWED", "UGX 180,000"],
  ["29 Oct 2026, 19:45", "BK-2410", "Family Suite", "Room: Family Suite", "Murchison River Lodge", "Moses Okwir", "CANCELLED_BY_BUSINESS", "UGX 1,160,000"],
  ["28 Oct 2026, 07:30", "BK-2409", "Kampala Special Hire — Half Day", null, "Entebbe Airport Transfers", "grace.a@gmail.com", "COMPLETED", "UGX 220,000"]
];
function bookingsList(variant) {
  return screen("Bookings — " + variant, "Bookings", function (cw) {
    let rows = BOOKINGS, active = "All", q = null;
    if (variant === "awaiting") { rows = BOOKINGS.filter(function (b) { return /PENDING_PAYMENT|AWAITING/.test(b[6]); }); active = "Awaiting confirmation"; }
    if (variant === "empty") { rows = []; active = "Cancelled"; q = "BK-9999"; }
    const body = rows.map(function (b) {
      return [b[0], linkText(b[1]), V({}, [T(b[2], { size: 14, color: C.s700 }), b[3] ? T(b[3], { size: 12, color: C.s500 }) : null]), linkText(b[4], { width: 150 }), b[5], sb("booking", b[6], "table"), T(b[7], { size: 14, color: C.s700 }), tableAction()];
    });
    if (!rows.length) body.push({ colspan: "No matching bookings." });
    const tabs = [["All", 142], ["Awaiting confirmation", 7], ["Confirmed", 58], ["Completed", 68], ["Cancelled", 9]];
    return [
      H({ fillW: true, main: "between", cross: "start" }, [pageHero("Admin portal", "Bookings oversight", "Monitor bookings across every business on the platform.", { w: 520 }), H({ gap: 12 }, [H({ h: 40, px: 16, radius: 12, stroke: C.border, fill: C.white, gap: 8, shadow: "sm" }, [I("calendar", 16, C.s400), T("All dates", { size: 12, w: 500, color: C.s700 })]), toolBtn("Export", "download")])]),
      filterTabs(tabs, active),
      H({ gap: 12 }, [searchBox("Search bookings, businesses, or customers…", { value: q }), toolBtn("Filters", "filter", { badge: variant === "awaiting" ? 1 : null }), toolBtn("Export", "download")]),
      table([{ label: "Date", help: true, weight: 1.5 }, { label: "Reference", help: true, weight: 1.1 }, { label: "Listing", weight: 2.2 }, { label: "Business", weight: 1.6 }, { label: "Customer", weight: 1.4 }, { label: "Status", help: true, weight: 1.6 }, { label: "Total", help: true, weight: 1.2, align: "right" }, { label: "Actions", weight: 0.9, align: "right" }], body, {
        w: cw, footer: H({ name: "Pagination footer", px: 24, py: 16, fill: C.s50, fo: 0.3, stroke: C.border, sides: { t: 1 }, fillW: true, main: "between" }, [T("Showing " + (rows.length ? 1 : 0) + " to " + rows.length + " of " + (variant === "all" ? 142 : rows.length) + " bookings", { size: 12, w: 500, color: C.s500 }), pagination(1, variant === "all" ? 16 : 1)])
      })
    ];
  }, { maxW: 1550 });
}
function bookingDetail(variant) {
  const combined = variant === "combined";
  const none = variant === "no-payments";
  return screen("Booking detail — " + variant, "Bookings", function (cw) {
    const leftW = cw - 24 - 340;
    return [
      btnRaw("Back to bookings", { variant: "ghost", size: "sm", icon: "arrow-left", px: 4 }),
      H({ fillW: true, main: "between", cross: "start" }, [pageHero("BK-2417", "Murchison River Lodge", "Review the booking, traveller information and payment history.", { w: 600 }), sb("booking", none ? "PENDING_PAYMENT" : combined ? "CONFIRMED" : "AWAITING_BUSINESS_CONFIRMATION")]),
      H({ gap: 24, fillW: true, cross: "start" }, [
        V({ w: leftW, gap: 20 }, [
          card([cardHeader("Booking details"), cardContent([dl([
            ["Customer", V({ gap: 4 }, [T("Peter Tumusiime", { size: 14, w: 600 }), T("peter.tumusiime@gmail.com", { size: 14, color: C.muted })])],
            ["Business", T("Murchison River Lodge", { size: 14, w: 600, color: C.primary })],
            ["Start", "Fri 14 Nov 2026", null, 400], ["End", "Sun 16 Nov 2026", null, 400]
          ], { w: leftW - 48 })])]),
          V({ name: "BookingTravellerSummary", pad: 24, gap: 16, radius: 16, stroke: C.border, fill: C.white, shadow: "sm", fillW: true }, [T("Traveller details", { size: 18, w: 600 }),
            V({ gap: 2, fillW: true }, [T("Peter Tumusiime · peter.tumusiime@gmail.com · +256 772 101 202", { size: 14 }), T("Nationality: Ugandan", { size: 14 }), T("Emergency contact: Ruth Tumusiime +256 701 555 019", { size: 14 })]),
            V({ gap: 2, fillW: true }, [T("Anna Tumusiime · anna.t@gmail.com · +256 772 101 203", { size: 14 }), T("Nationality: Ugandan", { size: 14 })])
          ]),
          V({ name: "BookingOperationsSummary", pad: 24, gap: 16, radius: 16, stroke: C.border, fill: C.white, shadow: "sm", fillW: true }, [T("Booking progress & service details", { size: 18, w: 600 }),
            T(none ? "The business accepted your request. Payment is still required to confirm it." : combined ? "Status: confirmed." : "Request sent. No payment collected; the business must accept before payment.", { size: 16, fillW: true }),
            none || !combined ? T((none ? "Payment due" : "Business response due") + ": 05/11/2026, 09:14:00 EAT", { size: 16 }) : null,
            V({ gap: 8 }, [V({}, [T("Room type", { size: 14, w: 600 }), T("Riverside Banda", { size: 14 })]), V({}, [T("Pickup point", { size: 14, w: 600 }), T("Pakuba airstrip", { size: 14 })])]),
            T("Terms saved when this booking was requested", { size: 16, underline: true })
          ])
        ]),
        V({ w: 340, gap: 24 }, [
          card([cardHeader("Booking summary"), cardContent([H({ fillW: true, main: "between" }, [T("Booking amount", { size: 14, color: C.muted }), T("UGX 900,000", { size: 20, w: 700 })])])]),
          card([cardHeader("Payment history"), cardContent(none ? [T("No payments recorded.", { size: 14, color: C.muted, relaxed: true })] : [
            combined ? T("These payments cover a combined order. This booking’s share is UGX 900,000.", { size: 12, color: C.muted, relaxed: true, fillW: true }) : null,
            payBlock("SUCCESSFUL", combined ? "UGX 3,800,000" : "UGX 900,000", "stripe", "cs_live_a1B2c3D4e5F6g7H8"),
            combined ? payBlock("FAILED", "UGX 3,800,000", "mtn mobile money", "MTN-7781203345") : null
          ])]),
          card([cardHeader("Refunds"), cardContent([
            combined ? refundBlock("REQUESTED", "UGX 450,000", "Guest fell ill; cancelling one night (business approved partial refund).") : T("No refund requests.", { size: 14, color: C.muted }),
            btn("Manage payments and refunds", { variant: "outline", size: "sm" })
          ])])
        ])
      ])
    ];
  }, { maxW: 1152 });
}
function payBlock(status, amount, provider, ref) {
  return V({ pad: 12, gap: 8, radius: 12, stroke: C.border, fillW: true }, [H({ fillW: true, main: "between" }, [sb("payment", status), T(amount, { size: 14, w: 700 })]), T(provider, { size: 12, color: C.muted, capitalize: true }), T(ref, { size: 12, color: C.muted })]);
}
function refundBlock(status, amount, reason) {
  return V({ pad: 12, gap: 8, radius: 12, stroke: C.border, fillW: true }, [H({ fillW: true, main: "between" }, [sb("refund", status), T(amount, { size: 14, w: 700 })]), T(reason, { size: 14, color: C.muted, relaxed: true, fillW: true })]);
}
function flowBookings() {
  return [
    { section: "Bookings oversight · /admin/bookings", screens: [
      { title: "List — All", note: "Tabs with real counts. Date = created time. Status grouped: Awaiting (pending payment + awaiting business), Completed (+ review states), Cancelled (all 3).", build: function () { return bookingsList("all"); } },
      { title: "List — Awaiting confirmation", note: "?status=awaiting_confirmation. Search across ref, customer, business, listing.", build: function () { return bookingsList("awaiting"); } },
      { title: "List — no matches", note: "Empty row stays inside the table: “No matching bookings.”", build: function () { return bookingsList("empty"); } },
      { title: "Modal — Filters", note: "Field: Booking status (Awaiting confirmation / Confirmed / Completed / Cancelled).", build: function () { return withOverlay(bookingsList("all"), filterDialog("Booking status", ["Awaiting confirmation", "Confirmed", "Completed", "Cancelled"], "Awaiting confirmation")); } },
      { title: "Tooltip — column help", note: "TableColumnLabel info button (Total).", build: function () { return withOverlay(bookingsList("all"), tooltip("The recorded booking total, including selected add-ons. Check payment details to see the amount paid.", 280), { noScrim: true, anchor: "Info · Total", dx: -240 }); } }
    ] },
    { section: "Booking detail · /admin/bookings/[id]", screens: [
      { title: "Detail — awaiting business", note: "Details, travellers, operations summary with response deadline, summary, payment history, refunds.", build: function () { return bookingDetail("awaiting"); } },
      { title: "Detail — combined order + refund", note: "Order payments shown with share note; refund request listed; link to Payments.", build: function () { return bookingDetail("combined"); } },
      { title: "Detail — payment pending, no payments", note: "“No payments recorded.” “No refund requests.”", build: function () { return bookingDetail("no-payments"); } }
    ] }
  ];
}

// ================= PAYMENTS =================
const PAY_ROWS = [
  ["4 Nov 2026", "Murchison River Lodge", "Murchison River Lodge", "stripe", "SUCCESSFUL", "UGX 900,000"],
  ["3 Nov 2026", "3-Day Wildlife Safari", "Pearl Wildlife Safaris", "mtn mobile money", "SUCCESSFUL", "UGX 2,900,000"],
  ["3 Nov 2026", "Trip order · 8c2f91ab", "—", "stripe", "PROCESSING", "UGX 3,800,000"],
  ["2 Nov 2026", "Entebbe Airport Transfer", "Entebbe Airport Transfers", "airtel money", "FAILED", "UGX 150,000"],
  ["1 Nov 2026", "Kibale Chimpanzee Trek", "Pearl Wildlife Safaris", "stripe", "REFUNDED", "UGX 1,100,000"],
  ["31 Oct 2026", "Lake View Banda", "Lake Bunyonyi Eco Lodge", "stripe", "PARTIALLY_REFUNDED", "UGX 870,000"]
];
function paymentsPage(variant) {
  const live = variant === "live";
  const empty = variant === "empty";
  return screen("Payments — " + variant, "Payments", function (cw) {
    const refunds = empty ? [] : [["3 Nov 2026", "Lake View Banda", "Guest fell ill; cancelling one night", "REQUESTED"], ["2 Nov 2026", "Kibale Chimpanzee Trek", "Trip cancelled by customer within policy", "COMPLETED"], ["1 Nov 2026", "Murchison River Lodge", "Duplicate charge", "PROCESSING"], ["28 Oct 2026", "Family Suite", "Outside cancellation window", "REJECTED"]];
    return [
      pageHero("Admin portal", "Payments, refunds & payouts", "Track customer payments, provider references, refunds, and platform commission — platform-wide."),
      live ? null : T(variant === "simulated" ? "Payouts completed." : "Settle eligible payments to verified businesses. Payments with pending refunds remain on hold.", { size: 14, color: C.muted, relaxed: true }),
      statGrid([
        { label: "Gross payments", value: empty ? "UGX 0" : "UGX 18,460,000", desc: "Successful payments before refunds · all time", icon: "banknote" },
        { label: "Platform commission (12%)", value: empty ? "UGX 0" : "UGX 2,124,000", desc: "After completed refunds · all time", icon: "percent" },
        { label: "Net business earnings", value: empty ? "UGX 0" : "UGX 15,576,000", desc: "After completed refunds and commission", icon: "landmark", help: true },
        { label: "Completed refunds", value: empty ? "UGX 0" : "UGX 760,000", desc: "Recorded completed refunds · all time", icon: "undo-2" }
      ], cw, 4, 168),
      filterTabs(["All", "Successful", "Pending", "Failed", "Refunded"], "All"),
      H({ gap: 12, wrap: true }, [searchBox("Search payments…"), toolBtn("Filters", "filter"), toolBtn("Export", "download"),
        live ? T("Live payouts require a configured provider.", { size: 12, color: C.muted }) : btnRaw("Settle payouts (" + (variant === "simulated" || empty ? "UGX 0" : "UGX 4,312,800") + ")", { size: "sm", disabled: variant === "simulated" || empty })]),
      empty ? emptyState("No payments yet", "Payments across the platform will show up here.") : table([{ label: "Date", weight: 1.2 }, { label: "Item", weight: 2.2 }, { label: "Business", weight: 2 }, { label: "Method", help: true, weight: 1.5 }, { label: "Status", weight: 1.5 }, { label: "Amount", help: true, weight: 1.3, align: "right" }],
        PAY_ROWS.map(function (r) { return [r[0], r[1], r[2], T(r[3], { size: 14, color: C.s600, capitalize: true }), sb("payment", r[4], "table"), r[5]]; }), { w: cw, footer: tableFooter("Showing 1 to 6 of 6 transactions", 1, 1) }),
      V({ gap: 16, fillW: true }, [T("Recent refunds", { size: 20, w: 600, color: C.s900 }),
        refunds.length ? table([{ label: "Date", weight: 1.2 }, { label: "Booking", weight: 2 }, { label: "Reason", weight: 3 }, { label: "Status", weight: 1.3 }, { label: "Amount", help: true, weight: 1.2, align: "right" }, { label: "Action", weight: 1.5, align: "right" }],
          refunds.map(function (r) {
            const action = r[3] === "REQUESTED" ? btnRaw("Approve refund", { variant: "outline", size: "xs", radius: 6, stroke: C.primary, color: C.primary, weight: 400 }) : T(r[3] === "COMPLETED" ? "Completed" : r[3] === "PROCESSING" ? "Awaiting provider" : "rejected", { size: 12, color: C.s500 });
            return [r[0], r[1], r[2], sb("refund", r[3], "table"), "UGX 450,000", action];
          }), { w: cw }) : emptyState("No refunds yet", "Refund requests will show up here.")
      ])
    ];
  }, { maxW: 1400, gap: 32 });
}
function errorBoundary(title, message) {
  return screen("Error — " + title, "Payments", function (cw) {
    return [V({ fillW: true, py: 80, cross: "center", gap: 12 }, [
      F({ w: 48, h: 48, radius: 24, fill: C.destructive, fo: 0.1, main: "center", cross: "center" }, [I("alert-triangle", 24, C.destructive)]),
      T(title, { size: 20, w: 600 }), T(message, { size: 14, color: C.muted, relaxed: true, align: "center", width: 480 }),
      H({ gap: 8 }, [btn("Try again", { size: "sm" }), btn("Back to payments", { variant: "outline", size: "sm" })])
    ])];
  }, { maxW: 1400 });
}
function flowPayments() {
  return [
    { section: "Payments, refunds & payouts · /admin/payments", screens: [
      { title: "Overview — demo mode", note: "Demo: “Settle payouts (UGX …)” settles eligible payments. Refund rows with REQUESTED show “Approve refund”.", build: function () { return paymentsPage("demo"); } },
      { title: "Overview — payouts simulated", note: "?payout=simulated → “Payouts completed.” Settle button disabled at UGX 0.", build: function () { return paymentsPage("simulated"); } },
      { title: "Overview — live mode", note: "No settle action; “Live payouts require a configured provider.” when an unsettled balance exists.", build: function () { return paymentsPage("live"); } },
      { title: "Overview — empty", note: "EmptyStates: “No payments yet”, “No refunds yet”.", build: function () { return paymentsPage("empty"); } },
      { title: "Modal — Filters", note: "Field: Payment status (Successful / Processing / Failed / Refunded).", build: function () { return withOverlay(paymentsPage("demo"), filterDialog("Payment status", ["Successful", "Processing", "Failed", "Refunded"], null)); } }
    ] },
    { section: "Refund approval", screens: [
      { title: "Modal — confirm refund", note: "Built 4 Nov 2026: confirmation step via ConfirmSubmit (src/components/admin/confirm-submit.tsx).", build: function () { return withOverlay(paymentsPage("demo"), confirmDialog("Approve this refund?", "UGX 450,000 will be returned to the customer through Stripe for Lake View Banda. This can’t be undone.", "Approve refund", { variant: "default", icon: "undo-2", iconBg: C.successSoft, iconColor: C.success, body: [V({ pad: 12, radius: 12, stroke: C.border, gap: 4, fillW: true }, [T("Reason", { size: 12, color: C.muted }), T("Guest fell ill; cancelling one night", { size: 14, w: 500 })])] })); } },
      { title: "Error — manual reconciliation", note: "approveRefund throws when the provider isn’t Stripe/checkout session or keys are missing.", build: function () { return errorBoundary("Refund not completed", "This payment requires manual provider reconciliation. No refund has been recorded as completed."); } }
    ] }
  ];
}

// ================= USERS =================
const USERS = [
  ["Grace Aciro", "grace.aciro@safarinexa.com", "Admin", "ACTIVE", "Super Admin", 0, "self"],
  ["Daniel Ssali", "daniel.ssali@safarinexa.com", "Admin", "ACTIVE", "Verification Reviewer", 0],
  ["Patience Kyomuhendo", "patience@safarinexa.com", "Admin", "SUSPENDED", "Support Agent", 0],
  ["Ronald Ssebunya", "ronald@safarinexa.com", "Admin", "INVITED", "Finance", 0],
  ["Moses Okwir", "moses@murchisonriverlodge.com", "Business Owner", null, null, 1],
  ["Brian Mugisha", "brian@kampalaboutique.ug", "Business Staff", null, null, 1],
  ["Peter Tumusiime", "peter.tumusiime@gmail.com", "Customer", null, null, 0],
  ["Sarah Nakimuli", "sarah.nakimuli@gmail.com", "Customer", null, null, 0],
  [null, "guest4412@yahoo.com", "Customer", null, null, 0]
];
function usersList(variant) {
  const superAdmin = variant !== "read-only";
  return screen("Users & access — " + variant, "Users", function (cw) {
    const rows = variant === "empty" ? [] : USERS;
    const body = rows.map(function (u) {
      const access = u[3] ? sb("admin", u[3], "table") : T("Not an admin", { size: 14, color: C.s500 });
      let level;
      if (!u[3]) level = T("—", { size: 14, color: C.s500 });
      else if (superAdmin && !u[6]) level = H({ gap: 8 }, [inputBox({ value: u[4], select: true, h: 36, w: 180 }), btnRaw("Save", { variant: "outline", size: "xs", px: 12, stroke: C.input, weight: 400 })]);
      else level = T(u[4], { size: 14, color: C.s700 });
      const action = u[3] && u[3] !== "INVITED" ? btnRaw(u[3] === "ACTIVE" ? "Suspend" : "Reactivate", { variant: "outline", size: "xxs", px: 12, stroke: u[3] === "ACTIVE" ? C.border : C.primary, color: u[3] === "ACTIVE" ? C.s600 : C.primary, weight: 400 }) : null;
      return [u[0] || "—", u[1], u[2], access, level, String(u[5]), action];
    });
    return [
      pageHero("Admin portal", "Users & access", "Customer, business, and admin accounts, with admin access control."),
      H({ fillW: true, main: "between" }, [filterTabs(["All", "Customers", "Business owners", "Business staff", "Admins"], variant === "empty" ? "Admins" : "All"), H({ gap: 12 }, [searchBox("Search users…", { value: variant === "empty" ? "nobody@" : null, w: 240 }), toolBtn("Filters", "filter"), btnRaw("Add user", { size: "sm" })])]),
      rows.length ? table([{ label: "User", weight: 1.5 }, { label: "Email", weight: 2.2 }, { label: "Role", weight: 1.2 }, { label: "Admin access", help: true, weight: 1.4 }, { label: "Permission level", help: true, weight: 2.6 }, { label: "Businesses", weight: 1 }, { label: "Action", weight: 1.1, align: "right" }], body, { w: cw, footer: tableFooter("Showing 1 to 9 of 64 users", 1, 5) })
        : emptyState("No users here", "Nothing matches this filter right now.")
    ];
  }, { maxW: 1400 });
}
function inviteForm(variant) {
  return screen("Invite admin — " + variant, "Users", function (cw) {
    const filled = variant !== "default";
    return [
      H({ gap: 4 }, [I("chevron-left", 16, C.s500), T("Back to users", { size: 14, w: 500, color: C.s500 })]),
      V({ gap: 8 }, [type.page("Invite Admin User", { color: C.s900 }), T("Send an invitation to grant administrative access to the SafariNexa portal, scoped to the permission level you choose. If they already have an account, their permissions will be elevated.", { size: 14, w: 600, color: C.s500, relaxed: true, width: 576 })]),
      V({ pad: 32, radius: 16, stroke: C.border, fill: C.white, shadow: "sm", fillW: true }, [V({ w: 448, gap: 24 }, [
        variant === "error" ? alertBox("Email invitations are not configured. No access has been granted.", "red", "shield-alert") : null,
        V({ gap: 6, fillW: true }, [fieldLabel("Email address", { color: C.s900 }), inputBox({ placeholder: "admin@example.com", value: filled ? "ronald@safarinexa.com" : "" })]),
        V({ gap: 6, fillW: true }, [fieldLabel("Permission level", { color: C.s900 }), inputBox({ value: filled ? "Finance" : "", placeholder: "Choose a permission level…", select: true }),
          H({ gap: 4, wrap: true, fillW: true }, [T("Defines exactly what this person can do.", { size: 12, color: C.s500 }), T("Review what each level grants", { size: 12, w: 600, color: C.bizGreen }), T(".", { size: 12, color: C.s500 })])]),
        H({ pt: 16, gap: 16 }, [btnRaw(variant === "submitting" ? "Sending invite..." : "Send invitation", { loading: variant === "submitting", disabled: variant === "submitting", fill: C.bizGreen }), T("Cancel", { size: 14, w: 500, color: C.s500 })])
      ])])
    ];
  }, { maxW: 800, gap: 32 });
}
function flowUsers() {
  return [
    { section: "Users & access · /admin/users", screens: [
      { title: "List — Super Admin view", note: "Super Admin can change permission level inline (not for self). Suspend / Reactivate for non-invited admins.", build: function () { return usersList("super"); } },
      { title: "List — other admin (read-only levels)", note: "Without Super Admin, permission level is plain text.", build: function () { return usersList("read-only"); } },
      { title: "List — empty", note: "EmptyState “No users here”.", build: function () { return usersList("empty"); } },
      { title: "Modal — Filters", note: "Field: Account role (Customer / Business owner / Business staff / Admin / Super admin).", build: function () { return withOverlay(usersList("super"), filterDialog("Account role", ["Customer", "Business owner", "Business staff", "Admin", "Super admin"], "Admin")); } },
      { title: "Modal — confirm suspend", note: "Built 4 Nov 2026: confirmation step via ConfirmSubmit (src/components/admin/confirm-submit.tsx).", build: function () { return withOverlay(usersList("super"), confirmDialog("Suspend Daniel Ssali?", "They will be signed out and lose admin portal access until reactivated. Their audit history is kept.", "Suspend access")); } }
    ] },
    { section: "Invite admin · /admin/users/new", screens: [
      { title: "Invite — default", note: "Requires users.manage. Email + permission level select.", build: function () { return inviteForm("default"); } },
      { title: "Invite — filled", note: "", build: function () { return inviteForm("filled"); } },
      { title: "Invite — sending", note: "Button loading “Sending invite...”. On success → /admin/users.", build: function () { return inviteForm("submitting"); } },
      { title: "Invite — error", note: "Errors: email not configured, invalid email, invalid level, unauthorised.", build: function () { return inviteForm("error"); } }
    ] }
  ];
}

// ================= ROLES =================
const PERMS = [["businesses.manage", "Review business verification & listing submissions"], ["payments.manage", "Approve refunds and settle payouts"], ["reviews.moderate", "Moderate customer reviews"], ["support.manage", "Reply to and close support cases"], ["users.manage", "Invite admins and suspend/reactivate access"]];
function rolesList() {
  return screen("Roles & permissions — list", "Roles & permissions", function (cw) {
    const roles = [["Finance", "Refunds and payout settlement.", 1, ["payments.manage"]], ["Super Admin", "Full platform access across verification, users, payments, and settings.", 1, null], ["Support Agent", "Handles customer and business support cases.", 1, ["support.manage", "reviews.moderate"]], ["Verification Reviewer", "Reviews business verification and listings.", 2, ["businesses.manage"]]];
    return [
      pageHero("Admin portal", "Roles & permissions", "Permission levels define exactly what an invited admin can do. Changes here apply immediately to everyone holding that level."),
      H({ fillW: true, main: "end" }, [btnRaw("New permission level", { size: "sm" })]),
      V({ gap: 20, fillW: true }, roles.map(function (r) {
        const sup = !r[3];
        return V({ radius: 16, stroke: C.border, fill: C.white, shadow: "sm", fillW: true, clip: true }, [
          H({ pad: 24, fillW: true, main: "between", cross: "start", stroke: C.s100, sides: { b: 1 } }, [V({ gap: 4 }, [H({ gap: 8 }, [T(r[0], { size: 16, w: 600, color: C.s900 }), sup ? I("shield-check", 16, C.bizGreen) : null]), T(r[1], { size: 14, color: C.s500, relaxed: true })]), T(r[2] + (r[2] === 1 ? " admin" : " admins"), { size: 12, w: 500, color: C.s500 })]),
          sup ? V({ pad: 24, fillW: true }, [T("Full access to all administrative functions. This permission level cannot be restricted.", { size: 14, w: 600, color: C.s500 })])
            : V({ pad: 24, gap: 12, fillW: true }, PERMS.map(function (p) { return checkbox(r[3].indexOf(p[0]) >= 0, p[1], p[0]); }).concat([V({ pt: 8 }, [btnRaw("Save permissions", { variant: "outline", size: "xs", px: 16 })])]))
        ]);
      }))
    ];
  }, { maxW: 1100 });
}
function newRole(variant) {
  return screen("New permission level — " + variant, "Roles & permissions", function (cw) {
    const filled = variant !== "default";
    return [
      H({ gap: 4 }, [I("chevron-left", 16, C.s500), T("Back to roles & permissions", { size: 14, w: 500, color: C.s500 })]),
      V({ gap: 8 }, [type.page("New permission level", { color: C.s900 }), T("Create a new permission level with exactly the access it needs — nothing more. You can change what it grants later from the roles & permissions page.", { size: 14, w: 600, color: C.s500, relaxed: true, width: 576 })]),
      V({ pad: 32, radius: 16, stroke: C.border, fill: C.white, shadow: "sm", fillW: true }, [V({ w: 448, gap: 24 }, [
        variant === "error" ? alertBox("A permission level with this name already exists.", "red", "shield-alert") : null,
        V({ gap: 6, fillW: true }, [fieldLabel("Name", { color: C.s900 }), inputBox({ placeholder: "e.g. Listings Reviewer", value: filled ? "Listings Reviewer" : "" })]),
        V({ gap: 6, fillW: true }, [fieldLabel("Description", { color: C.s900 }), inputBox({ placeholder: "What this level is for", value: filled ? "Reviews listing submissions and photos" : "" })]),
        V({ gap: 8, fillW: true }, [fieldLabel("Permissions", { color: C.s900 })].concat(PERMS.map(function (p) { return checkbox(filled && p[0] === "businesses.manage", p[1]); }))),
        H({ pt: 16, gap: 16 }, [btnRaw(variant === "submitting" ? "Creating..." : "Create permission level", { loading: variant === "submitting", disabled: variant === "submitting", fill: C.bizGreen }), T("Cancel", { size: 14, w: 500, color: C.s500 })])
      ])])
    ];
  }, { maxW: 800, gap: 32 });
}
function flowRoles() {
  return [{ section: "Roles & permissions · /admin/roles (roles.manage — Super Admin only)", screens: [
    { title: "Roles — list", note: "Super Admin can’t be restricted. roles.manage is never grantable. Save applies immediately to all holders.", build: rolesList },
    { title: "New level — default", note: "/admin/roles/new", build: function () { return newRole("default"); } },
    { title: "New level — creating", note: "", build: function () { return newRole("submitting"); } },
    { title: "New level — error", note: "Errors: name required, reserved name (Super Admin), duplicate name.", build: function () { return newRole("error"); } }
  ] }];
}

// ================= REVIEWS =================
function reviewCard(r, w) {
  const actions = ["PUBLISHED", "FLAGGED", "HIDDEN"].filter(function (s) { return s !== r.status; }).map(function (s) {
    const m = { PUBLISHED: ["Publish review", C.primary], FLAGGED: ["Flag review", C.orange600], HIDDEN: ["Hide review", C.s700] }[s];
    return btnRaw(m[0], { variant: "outline", size: "xs", px: 16, stroke: C.border, color: m[1], weight: 600 });
  });
  const lw = w - 48 - 136;
  return V({ name: "Review card", w: w, pad: 24, radius: 16, stroke: C.border, fill: C.white, shadow: "sm", gap: 0 }, [
    H({ fillW: true, main: "between", pb: 24, stroke: C.s100, sides: { b: 1 } }, [T("Latest reviews", { size: 16, w: 600, color: C.s900 }), H({ gap: 12 }, [H({ gap: 4 }, [I("star", 16, C.primary, { filled: true }), T(String(r.rating), { size: 14, w: 500 })]), sb("review", r.status)])]),
    spacer(1, 24),
    V({ gap: 16, fillW: true }, [["Reviewer", r.who], ["Date", r.date], ["Listing", r.listing], ["Review", "“" + r.body + "”"]].map(function (row) {
      return H({ gap: 16, fillW: true, cross: "start" }, [T(row[0], { size: 12, w: 500, color: C.s500, width: 120 }), T(row[1], { size: 14, w: 600, color: C.s900, italic: row[0] === "Review", width: lw })]);
    }).concat(r.reply ? [H({ gap: 16, fillW: true, cross: "start", pt: 8 }, [T("Business response", { size: 12, w: 500, color: C.s500, width: 120 }), V({ pad: 12, radius: 8, fill: C.s50, stroke: C.s100, w: lw }, [T(r.reply, { size: 14, w: 600, color: C.s600, fillW: true })])])] : [])),
    spacer(1, 24),
    H({ fillW: true, main: "end", gap: 8, pt: 16, stroke: C.s100, sides: { t: 1 } }, actions)
  ]);
}
function reviewsPage(variant) {
  return screen("Reviews moderation — " + variant, "Reviews", function (cw) {
    const w = Math.floor((cw - 24) / 2);
    let list = [
      { who: "Sarah Nakimuli", date: "3 Nov 2026", listing: "3-Day Wildlife Safari", body: "Our guide Moses spotted lions on day one. Lodging was clean and the launch cruise was the highlight.", rating: 5, status: "PUBLISHED", reply: "Thank you Sarah — we’ll pass your kind words to Moses!" },
      { who: "Emmanuel Kato", date: "2 Nov 2026", listing: "Kibale Chimpanzee Trek", body: "Absolute scam. Call 0772 000 111 for a cheaper private trek instead.", rating: 1, status: "FLAGGED" },
      { who: "Irene Namuli", date: "1 Nov 2026", listing: "Lake View Banda", body: "Beautiful view, but the hot water was off both mornings.", rating: 3, status: "PUBLISHED" },
      { who: "guest4412@yahoo.com", date: "30 Oct 2026", listing: "Nile View Terrace", body: "Food was cold.", rating: 2, status: "HIDDEN" }
    ];
    let active = "All";
    if (variant === "flagged") { list = list.filter(function (r) { return r.status === "FLAGGED"; }); active = "Flagged"; }
    if (variant === "empty") { list = []; active = "Pending"; }
    const rows = [];
    for (let i = 0; i < list.length; i += 2) rows.push(H({ gap: 24, fillW: true, cross: "start" }, list.slice(i, i + 2).map(function (r) { return reviewCard(r, w); })));
    return [
      pageHero("Admin portal", "Reviews moderation", "Moderate flagged reviews and business replies."),
      filterTabs(["All", "Published", "Flagged", "Hidden", "Pending"], active),
      list.length ? V({ gap: 24, fillW: true }, rows) : emptyState("No reviews here", "Nothing matches this filter right now."),
      H({ fillW: true, main: "center", pt: 24 }, [pagination(1, list.length ? 3 : 1)])
    ];
  }, { maxW: 1400 });
}
function flowReviews() {
  return [{ section: "Reviews moderation · /admin/reviews (reviews.moderate)", screens: [
    { title: "Reviews — All", note: "Each card offers the two states it isn’t in: Publish / Flag / Hide. Customer + business owners are notified.", build: function () { return reviewsPage("all"); } },
    { title: "Reviews — Flagged", note: "?status=flagged", build: function () { return reviewsPage("flagged"); } },
    { title: "Reviews — empty", note: "EmptyState “No reviews here”.", build: function () { return reviewsPage("empty"); } },
    { title: "Modal — confirm hide", note: "Built 4 Nov 2026: confirmation step via ConfirmSubmit (src/components/admin/confirm-submit.tsx).", build: function () { return withOverlay(reviewsPage("all"), confirmDialog("Hide this review?", "It will no longer appear on Kibale Chimpanzee Trek. Emmanuel Kato and the business owners will be notified.", "Hide review", { variant: "default", icon: "info", iconBg: C.s100, iconColor: C.s700 })); } }
  ] }];
}

// ================= SUPPORT =================
const CASES = [["SC-1042", "Refund not received for BK-2398", "Sarah Nakimuli", "payment", "OPEN", "3 Nov 2026"], ["SC-1041", "Cannot upload trading licence", "Moses Okwir", "account", "IN_PROGRESS", "2 Nov 2026"], ["SC-1040", "Change of travel dates", "Joseph Byamukama", "booking", "WAITING_ON_CUSTOMER", "1 Nov 2026"], ["SC-1039", "Payment declined twice", "Irene Namuli", "payment", "OPEN", "30 Oct 2026"], ["SC-1038", "Lodge cancelled my booking", "Moses Okwir", "booking", "RESOLVED", "28 Oct 2026"], ["SC-1037", "Wrong name on receipt", "Peter Tumusiime", "other", "CLOSED", "25 Oct 2026"]];
function supportList(empty) {
  return screen("Support issues — " + (empty ? "empty" : "all"), "Support", function (cw) {
    return [
      pageHero("Admin portal", "Support issues", "Resolve booking, payment, and account issues raised across the platform."),
      filterTabs(["All", "Open", "In progress", "Waiting on customer", "Resolved", "Closed"], empty ? "Closed" : "All"),
      empty ? emptyState("No cases here", "Nothing matches this filter right now.") : table([{ label: "Case", weight: 1 }, { label: "Subject", weight: 3 }, { label: "Opened by", weight: 1.6 }, { label: "Category", weight: 1.2 }, { label: "Status", weight: 1.6 }, { label: "Updated", help: true, weight: 1.3, align: "right" }],
        CASES.map(function (c) { return [linkText(c[0]), c[1], c[2], T(c[3], { size: 14, color: C.s600, capitalize: true }), sb("support", c[4], "table"), c[5]]; }), { w: cw, footer: tableFooter("Showing 1 to 6 of 6 cases", 1, 1) })
    ];
  }, { maxW: 1400 });
}
function bubble(text, mine, name, time, o) {
  o = o || {};
  return V({ name: "Message · " + (mine ? "outgoing" : "incoming"), fillW: true, cross: mine ? "end" : "start" }, [V({ w: 520, cross: mine ? "end" : "start", gap: 4 }, [
    T(name, { size: 12, color: C.s500, lh: 20 }),
    V({ px: 16, py: 12, radius: 16, fill: mine ? C.chat : C.white, stroke: mine ? null : C.border, opacity: o.pending ? 0.7 : null }, [T(text, { size: 14, relaxed: true, color: mine ? C.white : C.s800, width: Math.min(440, Math.max(120, text.length * 7)) })]),
    H({ gap: 6 }, [T(o.pending ? "Sending…" : time, { size: 12, color: C.s500, lh: 20 }), mine && o.own && !o.pending ? I("check-check", 12, C.s400) : null])
  ])]);
}
function supportDetail(variant) {
  const status = variant === "resolved" ? "RESOLVED" : "IN_PROGRESS";
  return screen("Support case — " + variant, "Support", function (cw) {
    const msgs = variant === "empty" ? [] : [
      bubble("Hi, I cancelled BK-2398 on 28 Oct within the free cancellation window but haven’t received my refund yet.", false, "Sarah Nakimuli", "9:12 AM"),
      bubble("Thanks Sarah. I can see the refund was approved on 30 Oct. Stripe refunds take 5–10 business days to reach your card. I’ll keep this case open until it lands.", true, "You", "10:03 AM", { own: true })
    ];
    if (variant === "sending") msgs.push(bubble("I’ve also asked Stripe for the acquirer reference number so you can trace it with your bank.", true, "You", "", { pending: true, own: true }));
    const statuses = [["OPEN", "Reopen"], ["IN_PROGRESS", "Mark in progress"], ["WAITING_ON_CUSTOMER", "Waiting on customer"], ["RESOLVED", "Resolve"], ["CLOSED", "Close"]].filter(function (s) { return s[0] !== status; });
    const draft = variant === "sending" ? "" : variant === "error" ? "I’ve also asked Stripe for the acquirer reference number." : "";
    return [
      H({ gap: 6 }, [T("Support", { size: 14, color: C.muted }), I("chevron-right", 14, C.muted), T("SC-1042", { size: 14, w: 500 })]),
      H({ fillW: true, main: "between", cross: "start", gap: 12 }, [V({ gap: 0, fillW: true }, [T("SC-1042 · PAYMENT", { size: 12, w: 500, color: C.muted, ls: 2.5 }), type.page("Refund not received for BK-2398", { fillW: true }), T("Opened by Sarah Nakimuli", { size: 14, color: C.muted, relaxed: true })]), sb("support", status)]),
      H({ gap: 8, wrap: true, fillW: true }, statuses.map(function (s) { return btn(s[1], { variant: "secondary", size: "sm" }); })),
      V({ radius: 16, stroke: C.border, fill: C.white, shadow: "sm", fillW: true, clip: true }, [
        V({ name: "Conversation", pad: 24, gap: 16, fill: C.chatBg, fillW: true, minH: 260 }, msgs.length ? [H({ fillW: true, main: "center" }, [H({ px: 12, py: 4, radius: 999, fill: C.s100, stroke: C.border, so: 0.5 }, [T("03 Nov 2026", { size: 12, w: 500, color: C.s500 })])])].concat(msgs) : [V({ fillW: true, py: 48, cross: "center" }, [T("No messages yet. Start the conversation below.", { size: 14, color: C.muted })])]),
        V({ name: "MessageComposer", pad: 16, stroke: C.s100, sides: { t: 1 }, fillW: true, gap: 8 }, [
          V({ radius: 12, stroke: variant === "typing" ? C.primary : C.input, fillW: true, pad: 16, gap: 12, minH: 100 }, [
            T(draft || "Type your reply…", { size: 14, color: draft ? C.fg : C.muted, fillW: true, relaxed: true }),
            H({ fillW: true, main: "end" }, [btnRaw(variant === "sending" ? "Sending…" : "Send", { size: "xs", radius: 8, px: 16, fill: C.chat, icon: variant === "sending" ? null : "send", iconSize: 12, loading: variant === "sending", disabled: !draft && variant !== "sending", gap: 6 })])
          ]),
          variant === "error" ? T("Your reply could not be sent. Please try again.", { size: 14, color: C.destructive }) : null
        ])
      ])
    ];
  }, { maxW: 768 });
}
function flowSupport() {
  return [
    { section: "Support issues · /admin/support", screens: [
      { title: "Cases — All", note: "Sorted by last update. Case ref links to detail.", build: function () { return supportList(false); } },
      { title: "Cases — empty", note: "EmptyState “No cases here”.", build: function () { return supportList(true); } }
    ] },
    { section: "Support case · /admin/support/[id] (support.manage to act)", screens: [
      { title: "Case — conversation", note: "Status buttons exclude the current status. Customer is notified on reply and on status change.", build: function () { return supportDetail("default"); } },
      { title: "Case — reply sending", note: "Optimistic “Sending…”; Enter sends, Shift+Enter new line.", build: function () { return supportDetail("sending"); } },
      { title: "Case — reply failed", note: "“Your reply could not be sent. Please try again.” Draft kept.", build: function () { return supportDetail("error"); } },
      { title: "Case — no messages / resolved", note: "Empty conversation copy; Resolved status shows Reopen.", build: function () { return supportDetail("empty"); } },
      { title: "Modal — confirm close", note: "Built 4 Nov 2026: confirmation step via ConfirmSubmit (src/components/admin/confirm-submit.tsx).", build: function () { return withOverlay(supportDetail("default"), confirmDialog("Close SC-1042?", "Sarah Nakimuli will be notified that the case is closed. You can reopen it later.", "Close case", { variant: "default", icon: "check-circle", iconBg: C.successSoft, iconColor: C.success })); } }
    ] }
  ];
}

// ================= AUDIT =================
function auditPage(empty) {
  return screen("Audit trail — " + (empty ? "empty" : "populated"), "Audit trail", function (cw) {
    const rows = empty ? [] : [["04/11/2026, 14:22:05", "grace.aciro@safarinexa.com", "admin_approved_refund", "ADMIN", "SUCCESS"], ["04/11/2026, 13:10:41", "admin@safarinexa.test", "verification_approved", "ADMIN", "SUCCESS"], ["04/11/2026, 12:02:19", "admin@safarinexa.test", "listing_submission_approved", "ADMIN", "SUCCESS"], ["04/11/2026, 11:47:03", "unknown@gmail.com", "admin_google_sign_in", "ADMIN", "DENIED"], ["04/11/2026, 09:45:00", "System", "demo_payouts_completed", "ADMIN", "SUCCESS"], ["03/11/2026, 18:31:52", "moses@murchisonriverlodge.com", "listing_submitted", "BUSINESS", "SUCCESS"], ["03/11/2026, 16:40:11", "sarah.nakimuli@gmail.com", "booking_created", "CUSTOMER", "SUCCESS"]];
    return [
      pageHero(null, "Audit trail", "Latest 100 recorded platform events. This is not an uptime monitor."),
      H({}, [toolBtn("Export", "download")]),
      table([{ label: "Time", weight: 1.5 }, { label: "Actor", weight: 2.2 }, { label: "Action", weight: 2.2 }, { label: "Surface", weight: 1 }, { label: "Outcome", help: true, weight: 1 }], rows, { w: cw }),
      empty ? T("No recorded events.", { size: 16 }) : null
    ];
  });
}
function flowAudit() {
  return [{ section: "Audit trail · /admin/audit", screens: [
    { title: "Audit — populated", note: "Latest 100 events, newest first. Export visible rows.", build: function () { return auditPage(false); } },
    { title: "Audit — empty", note: "Header-only table + “No recorded events.”", build: function () { return auditPage(true); } }
  ] }];
}

// ================= NOTIFICATIONS =================
function notifCard(n) {
  return card([H({ pad: 20, gap: 16, cross: "start", fillW: true }, [
    F({ w: 40, h: 40, radius: 12, fill: C.s50, main: "center", cross: "center" }, [I(n.icon, 16, C.s500)]),
    V({ fillW: true, gap: 4 }, [
      H({ gap: 8 }, [T(n.type, { size: 12, color: C.muted }), n.unread ? H({ px: 6, py: 2, radius: 4, fill: C.primary, fo: 0.05 }, [T("Unread", { size: 12, w: 500, color: C.primary })]) : null]),
      T(n.title, { size: 14, w: 600, color: C.s800 }), T(n.body, { size: 14, color: C.muted, relaxed: true, fillW: true }),
      spacer(1, 8), T(n.time, { size: 12, color: C.muted }),
      spacer(1, 8), H({ gap: 8 }, [n.link ? H({ gap: 4 }, [T(n.link, { size: 12, w: 500, color: C.primary, underline: true }), I("arrow-up-right", 14, C.primary)]) : null, n.unread ? btnRaw("Mark as read", { variant: "ghost", size: "xs", h: 32, textSize: 12 }) : null])
    ])
  ])]);
}
function notificationsPage(variant) {
  return screen("Notifications — " + variant, "Notifications", function (cw) {
    let list = [
      { icon: "life-buoy", type: "Support updates", title: "New support case opened", body: "SC-1042: Refund not received for BK-2398", time: "4 Nov 2026, 09:12 EAT", link: "View support case", unread: true },
      { icon: "settings", type: "Account updates", title: "Verification submitted", body: "Nile View Terrace submitted business verification documents for review.", time: "2 Nov 2026, 10:42 EAT", unread: true },
      { icon: "calendar-check", type: "Booking updates", title: "Booking cancelled by business", body: "BK-2410 at Murchison River Lodge was cancelled by the business.", time: "29 Oct 2026, 19:50 EAT", link: "View booking", unread: true },
      { icon: "credit-card", type: "Payment updates", title: "Refund completed", body: "UGX 1,100,000 refunded for Kibale Chimpanzee Trek.", time: "28 Oct 2026, 08:02 EAT", link: "View booking" }
    ];
    let active = "All";
    if (variant === "unread") { list = list.filter(function (n) { return n.unread; }); active = "Unread"; }
    if (variant === "empty") { list = []; active = "Safety advisories"; }
    return [
      pageHero("Admin portal", "Notifications", "Operational updates and support activity sent to your admin account."),
      H({ gap: 12 }, ["Verification queue", "Listing reviews", "Support cases"].map(function (s) { return T(s, { size: 14, color: C.primary, underline: true }); })),
      H({ fillW: true, main: "between" }, [T(variant === "empty" ? "0 unread notifications" : "3 unread notifications", { size: 14, color: C.muted }), H({ gap: 8 }, [searchBox("Search notifications…", { value: variant === "empty" ? "gorilla" : null }), btnRaw("Mark all as read", { variant: "pill", size: "sm", px: 14, disabled: variant === "empty" })])]),
      filterTabs(["All", ["Unread", variant === "empty" ? 0 : 3], "My categories", "Booking updates", "Payment updates", "Review prompts", "Support updates", "Safety advisories", "Account updates"], active),
      list.length ? V({ gap: 12, fillW: true }, list.map(notifCard)) : emptyState("No notifications found", "Try another search or category. Your other updates are still available under All.", { icon: "bell-off" }),
      H({ fillW: true, main: "center" }, [pagination(1, 1)])
    ];
  }, { maxW: 1024 });
}
function flowNotifications() {
  return [{ section: "Notifications · /admin/notifications", screens: [
    { title: "Notifications — All", note: "Header bell links here. Open → destination; Mark as read; Mark all as read.", build: function () { return notificationsPage("all"); } },
    { title: "Notifications — Unread", note: "Unread tab shows real count.", build: function () { return notificationsPage("unread"); } },
    { title: "Notifications — empty search", note: "EmptyState with BellOff icon.", build: function () { return notificationsPage("empty"); } }
  ] }];
}

// ================= SETTINGS =================
function tabsBar(tabs, active) {
  return H({ name: "TabsList", h: 44, pad: 4, gap: 4, radius: 999, stroke: C.border, fill: C.secondary, fo: 0.6 }, tabs.map(function (t) {
    const on = t === active;
    return H({ name: "Tab · " + t, h: 36, px: 16, radius: 999, fill: on ? C.white : null, shadow: on ? "card" : null }, [T(t, { size: 14, w: 500, color: on ? C.fg : C.muted })]);
  }));
}
function settingsPage(tab, variant) {
  return screen("Settings — " + tab + (variant ? " (" + variant + ")" : ""), "Settings", function (cw) {
    const live = variant === "live";
    const half = Math.floor((cw - 48 - 16) / 2);
    let body;
    if (tab === "General") body = card([cardHeader("General Settings", "Global platform configuration."), cardContent([H({ gap: 16, wrap: true, fillW: true, rowGap: 16 }, [
      field("Platform Name", { value: "SafariNexa", w: half }), field("Global Support Email", { value: "support@safarinexa.com", w: half }), field("Global Support Phone", { value: "+256 800 000000", w: half })
    ])]), H({ px: 24, py: 16, stroke: C.border, sides: { t: 1 }, fillW: true }, [btn("Save changes", { disabled: live })]),
      V({ px: 24, pb: 16, fillW: true }, [T(variant === "saved" ? "Settings saved on this device." : variant === "storage-error" ? "Your browser could not save these settings. Allow local storage and try again." : "", { size: 14, color: C.muted })])]);
    if (tab === "Commission & Fees") body = card([cardHeader("Commission & Fees", "Current commission applied to revenue calculations and business settlements."), cardContent([H({ gap: 16, wrap: true, fillW: true, rowGap: 16 }, [
      field("Accommodation Commission (%)", { value: "12", w: half }), field("Safaris & Tours Commission (%)", { value: "12", w: half }), field("Transport Commission (%)", { value: "12", w: half })
    ])]), H({ px: 24, py: 16, stroke: C.border, sides: { t: 1 }, fillW: true }, [T("A standard rate applies to all paid service categories.", { size: 14, color: C.muted })])]);
    if (tab === "Categories") body = card([cardHeader("Platform Categories", "Manage the main categories enabled on the platform."), cardContent([["Accommodation", "Hotels, lodges, guesthouses", true], ["Safaris & Tours", "Tour operators and packages", true], ["Restaurant Delivery", "Food delivery (Phase 2)", false]].map(function (c) {
      return H({ fillW: true, main: "between", pb: 16, stroke: C.border, sides: { b: 1 }, opacity: c[2] ? null : 0.5 }, [V({}, [T(c[0], { size: 14, w: 500 }), T(c[1], { size: 14, color: C.muted })]), H({ px: 10, py: 2, radius: 999, fill: c[2] ? C.primary : C.mutedBg, fo: c[2] ? 0.1 : 1 }, [T(c[2] ? "Active" : "Disabled", { size: 12, w: 500, color: c[2] ? C.primary : C.muted })])]);
    }))]);
    return [pageHero("Admin portal", "Platform Settings", live ? "Review platform configuration." : "Manage platform settings and preferences on this device."), V({ gap: 24, fillW: true }, [tabsBar(["General", "Commission & Fees", "Categories"], tab), body])];
  });
}
function flowSettings() {
  return [{ section: "Platform settings · /admin/settings", screens: [
    { title: "General — demo", note: "Demo only: saved to localStorage on this device (DemoSettingsForm).", build: function () { return settingsPage("General"); } },
    { title: "General — saved", note: "role=status “Settings saved on this device.”", build: function () { return settingsPage("General", "saved"); } },
    { title: "General — storage error", note: "localStorage blocked.", build: function () { return settingsPage("General", "storage-error"); } },
    { title: "General — live (read-only)", note: "Save disabled outside demo mode.", build: function () { return settingsPage("General", "live"); } },
    { title: "Commission & Fees", note: "Read-only 12% (PLATFORM_COMMISSION_RATE).", build: function () { return settingsPage("Commission & Fees"); } },
    { title: "Categories", note: "Accommodation and Safaris active; Restaurant Delivery disabled (Phase 2).", build: function () { return settingsPage("Categories"); } }
  ] }];
}

// ================= PROFILE =================
function profilePage(variant) {
  return screen("My profile — " + variant, "Profile", function (cw) {
    return [
      pageHero("Admin portal", "My profile", "Manage your personal admin account details and preferences."),
      card([
        H({ pt: 32, px: 32, pb: 24, gap: 16, fill: C.s50, fo: 0.5, stroke: C.s100, sides: { b: 1 }, fillW: true }, [F({ w: 64, h: 64, radius: 32, fill: C.primary, fo: 0.1, stroke: C.white, sw: 2, main: "center", cross: "center" }, [I("user", 32, C.primary)]), V({ gap: 4 }, [T("Grace Aciro", { size: 20, w: 600 }), T("Super Admin", { size: 14, w: 600, color: C.s500 })])]),
        V({ pad: 32, fillW: true }, [V({ w: 500, gap: 24 }, [
          field("Email address", { value: "grace.aciro@safarinexa.com", disabled: true, labelIcon: "mail", labelColor: C.s700, help: "Email cannot be changed directly." }),
          field("Full name", { value: "Grace Aciro", labelIcon: "user", labelColor: C.s700, focus: variant === "editing" }),
          field("Phone number", { value: variant === "editing" ? "+256 772 41" : "", placeholder: "+256 7XX XXX XXX", labelIcon: "phone", labelColor: C.s700 }),
          V({ pt: 16 }, [btnRaw("Save changes", { px: 32 })])
        ])])
      ])
    ];
  }, { maxW: 800, gap: 32 });
}
function flowProfile() {
  return [{ section: "My profile · /admin/profile", screens: [
    { title: "Profile — default", note: "Email read-only; name required; phone optional. Sidebar footer → Profile / Sign out.", build: function () { return profilePage("default"); } },
    { title: "Profile — editing", note: "Focus ring on active field.", build: function () { return profilePage("editing"); } },
    { title: "Modal — sign out", note: "Built 4 Nov 2026: confirmation step via ConfirmSubmit (src/components/admin/confirm-submit.tsx).", build: function () { return withOverlay(profilePage("default"), confirmDialog("Sign out of the admin portal?", "You’ll need to sign in again to review queues and approve payments.", "Sign out", { icon: "log-out" })); } }
  ] }];
}
