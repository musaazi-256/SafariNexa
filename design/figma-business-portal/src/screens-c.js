// 08 Messages · 09 Reviews · 10 Earnings · 11 Notifications · 12 Settings · 13 Verification & documents

// ================= 08 MESSAGES =================
const THREADS = [["Sarah Nakimuli", "Murchison River Lodge · BK-2417", "Could we get an early check-in around noon?", "10:42", 2], ["Joseph Byamukama", "Kibale Forest Edge Camp · BK-2421", "Is the chimp permit included?", "Yesterday", 1], ["Irene Namuli", "Lake Bunyonyi Eco Lodge · BK-2409", "Thank you, see you on the 7th!", "Mon", 0], ["Emmanuel Kato", "Listing inquiry", "Do you have a family room in December?", "2 Nov", 0], ["Florence Achen", "Kampala Boutique Stay · BK-2384", "Great stay, thanks again.", "29 Oct", 0]];
function messagesPage(o) {
  o = o || {};
  const active = o.empty || o.none ? null : THREADS[0];
  return screen(o.name || "Messages", "Messages", function (cw) {
    const detailsW = 320, inboxW = cw - detailsW - 24, listW = 320;
    const head = H({ fillW: true, main: "between", cross: "end" }, [V({ gap: 4 }, [T("BUSINESS PORTAL", { size: 12, w: 500, ls: 5, color: C.chat }), type.page("Messages", { color: C.s900 }), T("Communicate directly with your customers regarding their bookings and inquiries.", { size: 14, color: C.s500 })]), btnRaw("New message", { icon: "pencil", fill: C.bizGreen, radius: 12 })]);
    if (o.empty) return [head, V({ fillW: true, radius: 16, stroke: C.border, fill: C.white, pad: 32 }, [emptyState("No messages yet", "When customers message you about bookings, they will appear here.")])];
    const list = V({ name: "Thread list", w: listW, fillH: true, stroke: C.border, sides: { r: 1 }, fill: C.white }, [
      V({ pad: 16, gap: 12, fillW: true, stroke: C.border, sides: { b: 1 } }, [searchBox("Search messages…", { w: listW - 32 }), H({ gap: 6 }, [btnRaw("All 5", { size: "xxs", fill: C.s900, color: C.white, stroke: C.s900 }), btnRaw("Unread 3", { size: "xxs", variant: "outline" }), btnRaw("Bookings 4", { size: "xxs", variant: "outline" })])])
    ].concat(THREADS.map(function (t, i) {
      return H({ name: "Thread · " + t[0], fillW: true, px: 16, py: 12, gap: 12, cross: "start", fill: active && i === 0 ? C.s50 : null, stroke: C.s100, sides: { b: 1 } }, [avatar(t[0].split(" ").map(function (x) { return x[0]; }).join(""), 36), V({ fillW: true, gap: 2 }, [
        H({ fillW: true, main: "between" }, [T(t[0], { size: 12, w: 500, color: C.s900 }), T(t[3], { size: 12, w: 500, color: C.s500 })]),
        T(t[1], { size: 12, w: 500, color: C.s500 }),
        H({ fillW: true, main: "between" }, [T(t[2], { size: 12, w: t[4] ? 600 : 400, color: t[4] ? C.s900 : C.s500 }), t[4] ? F({ w: 18, h: 18, radius: 9, fill: C.chat, main: "center", cross: "center", dir: "V" }, [T(String(t[4]), { size: 11, w: 600, color: C.white })]) : null])
      ])]);
    })));
    const chat = active ? V({ name: "Chat", fillW: true, fillH: true, fill: C.white }, [
      H({ px: 24, py: 16, fillW: true, main: "between", stroke: C.border, sides: { b: 1 } }, [H({ gap: 12 }, [avatar("SN", 40), V({ gap: 0 }, [T("Sarah Nakimuli", { size: 14, w: 600, color: C.s900 }), H({ gap: 6 }, [T("Murchison River Lodge", { size: 12, color: C.s500 }), T("•", { size: 12, color: C.s300 }), T("BK-2417", { size: 12, w: 500, color: C.s500 })])])]), btnRaw("View booking", { variant: "outline", size: "xs", radius: 12 })]),
      V({ name: "Messages area", fillW: true, fillH: true, pad: 24, gap: 16, fill: C.chatBg }, [
        H({ fillW: true, main: "center" }, [T("Today", { size: 12, w: 500, color: C.s500 })]),
        H({ fillW: true }, [V({ px: 14, py: 10, radius: 16, fill: C.white, stroke: C.border, w: 380, gap: 4 }, [T("Hello! We land at Pakuba at 11:30. Could we get an early check-in around noon?", { size: 14, fillW: true, relaxed: true }), T("10:41", { size: 11, color: C.s500 })])]),
        H({ fillW: true, main: "end" }, [V({ px: 14, py: 10, radius: 16, fill: C.chat, w: 380, gap: 4 }, [T("Yes, noon works. Our driver will meet you at the airstrip.", { size: 14, color: C.white, fillW: true, relaxed: true }), T("10:42 · Read", { size: 11, color: C.white, opacity: 0.7 })])]),
        H({ fillW: true }, [V({ px: 14, py: 10, radius: 16, fill: C.white, stroke: C.border, w: 380, gap: 4 }, [T("Wonderful, thank you!", { size: 14, fillW: true }), T("10:44", { size: 11, color: C.s500 })])])
      ]),
      H({ name: "MessageComposer", pad: 16, gap: 8, fillW: true, stroke: C.border, sides: { t: 1 } }, [inputBox({ placeholder: "Write a message…" }), btnRaw("", { icon: "send", w: 44, px: 0 })])
    ]) : V({ fillW: true, fillH: true, fill: C.s50, main: "center", cross: "center" }, [T("Select a conversation to start messaging", { size: 12, w: 500, color: C.s500 })]);
    const details = card([active ? V({ pad: 24, gap: 24, fillW: true }, [
      V({ gap: 16, fillW: true }, [T("CUSTOMER DETAILS", { size: 12, w: 600, ls: 5, color: C.s900 }), H({ gap: 12 }, [avatar("SN", 48), V({ gap: 2 }, [T("Sarah Nakimuli", { size: 14, w: 600 }), T("sarah.nakimuli@gmail.com", { size: 12, color: C.s500 }), T("+256 701 228 904", { size: 12, color: C.s500 })])]),
        statCard({ label: "Bookings with this business", value: "3", desc: "All recorded booking states" }, 272, null, true), statCard({ label: "Confirmed booking value", value: "UGX 1,620,000", desc: "Confirmed and completed bookings" }, 272, null, true)]),
      hr(C.s100),
      V({ gap: 12, fillW: true }, [T("BOOKING DETAILS", { size: 12, w: 600, ls: 5, color: C.s900 }), T("Murchison River Lodge", { size: 12, w: 600 }), T("BK-2417", { size: 12, w: 500, color: C.chat }), H({ gap: 8 }, [I("calendar", 14, C.s500), T("09 Nov 2026", { size: 12, color: C.s600 }), I("clock", 14, C.s500), T("2:00 PM", { size: 12, color: C.s600 }), I("users", 14, C.s500), T("2 guests", { size: 12, color: C.s600 })]), btnRaw("View booking details", { variant: "outline", fillW: true, size: "sm", radius: 12 })])
    ]) : V({ pad: 24, fillW: true, h: 200, main: "center", cross: "center" }, [T("Select a conversation to view customer context.", { size: 12, w: 500, color: C.s500, align: "center", width: 240 })])], { w: detailsW });
    return [head, H({ gap: 24, fillW: true, cross: "start" }, [H({ name: "Inbox", w: inboxW, h: 680, radius: 16, stroke: C.border, fill: C.white, clip: true, cross: "start" }, [list, chat]), details])];
  }, { maxW: 1136 });
}
function newConversationDialog() {
  return V({ name: "Dialog · Start a New Conversation", w: 480, pad: 24, radius: 16, fill: C.white, stroke: C.border, shadow: "floating", gap: 16 }, [
    H({ gap: 8 }, [I("pencil", 20, C.chat), T("Start a New Conversation", { size: 18, w: 600 })]),
    T("Select a customer from your recent bookings and send them a direct message.", { size: 12, w: 500, color: C.s500, fillW: true }),
    V({ gap: 6, fillW: true }, [T("Select Customer", { size: 12, w: 500, color: C.s700 }), inputBox({ value: "Sarah Nakimuli — BK-2417 · Murchison River Lodge", select: true })]),
    V({ gap: 6, fillW: true }, [T("Message", { size: 12, w: 500, color: C.s700 }), textarea({ placeholder: "Hello! We are looking forward to hosting you...", h: 112 })]),
    H({ gap: 8, main: "end", fillW: true }, [btn("Cancel", { variant: "outline", size: "sm" }), btnRaw("Send message", { size: "sm", fill: C.bizGreen })])
  ]);
}
function flowMessages() {
  return [
    { section: "Inbox · /business/messages (MessageInbox)", screens: [
      { title: "Conversation open", note: "Thread list with search and All / Unread / Bookings filters, chat with read receipts and composer, and a separate customer & booking details card (sticky only when it fits the viewport).", build: function () { return messagesPage({}); } },
      { title: "No conversation selected", note: "Chat and details panels show their empty prompts.", build: function () { return messagesPage({ none: true, name: "Messages — none selected" }); } },
      { title: "No messages yet", note: "EmptyState when the business has no threads.", build: function () { return messagesPage({ empty: true, name: "Messages — empty" }); } },
      { title: "Modal — start a new conversation", note: "Pick a customer from recent bookings (createThreadWithCustomer) and send the first message.", build: function () { return withOverlay(messagesPage({ name: "Messages — new conversation" }), newConversationDialog()); } }
    ] }
  ];
}

// ================= 09 REVIEWS =================
const RVWS = [["Sarah Nakimuli", 5, "Peaceful riverside stay", "The river view banda was spotless and the staff were wonderful. The guided walk was a highlight.", "PUBLISHED", "BK-2398", null], ["Joseph Byamukama", 4, null, "Great base for the chimp trek. Breakfast could start a little earlier for early permits.", "PUBLISHED", "BK-2371", "Thank you Joseph! From December breakfast opens at 6:00 for trekkers."], ["Irene Namuli", 2, "Not as described", "The lake view was blocked by construction and nobody told us in advance.", "FLAGGED", "BK-2340", null], ["Emmanuel Kato", 5, null, "Fantastic hosts, we will be back.", "PENDING", null, null]];
const RV_ST = { PUBLISHED: ["Published", "success"], PENDING: ["Pending", "secondary"], FLAGGED: ["Flagged", "destructive"], HIDDEN: ["Hidden", "secondary"] };
function reviewCard(r, cw) {
  const first = r[0].split(" ")[0];
  return V({ name: "Review · " + r[0], fillW: true }, [H({ fillW: true, pad: 24, gap: 24, radius: 16, stroke: C.border, fill: C.white, cross: "start" }, [
    H({ w: 192, gap: 12, cross: "start" }, [F({ w: 40, h: 40, radius: 20, fill: C.primary, fo: 0.1, main: "center", cross: "center" }, [T(r[0].split(" ").map(function (x) { return x[0]; }).join(""), { size: 14, w: 600, color: C.primary })]), V({ gap: 2, pt: 2 }, [T(r[0], { size: 14, w: 600, color: C.s900 }), H({ gap: 4 }, [T(r[5] ? "Booked guest" : "Reviewer", { size: 12, w: 500, color: C.primary }), r[5] ? I("check-circle", 12, C.primary) : null])])]),
    V({ fillW: true, gap: 0 }, [
      H({ gap: 12 }, [stars(r[1]), T("· " + r[1] + "/5 · 2 Nov 2026", { size: 12, w: 500, color: C.s500 })]), spacer(1, 12),
      r[2] ? T(r[2], { size: 14, w: 600, color: C.s900 }) : null,
      T(r[3], { size: 14, color: C.s700, relaxed: true, fillW: true }), spacer(1, 24),
      r[6] ? V({ fillW: true, pad: 16, radius: 12, fill: C.s50, stroke: C.s100, gap: 8 }, [H({ gap: 8 }, [T("Your reply", { size: 14, w: 500, color: C.s900 }), T("· 3 Nov 2026", { size: 12, w: 500, color: C.s500 })]), T(r[6], { size: 14, color: C.s700, relaxed: true, fillW: true })])
        : V({ gap: 8, fillW: true }, [textarea({ placeholder: "Write a public reply to " + first + "...", h: 80 }), H({ fillW: true, main: "between" }, [T("Your reply will be public alongside this review.", { size: 12, color: C.s500 }), btnRaw("Post reply", { size: "xs", radius: 8 })])])
    ]),
    V({ w: 192, gap: 16, cross: "end" }, [V({ gap: 6, cross: "end" }, [badge(RV_ST[r[4]][0], RV_ST[r[4]][1]), r[5] ? T("Order: " + r[5], { size: 12, w: 500, color: C.s500 }) : null]), H({ gap: 8 }, [btn("Reply", { variant: "outline", size: "sm" }), H({ name: "Review actions", w: 32, h: 32, radius: 8, stroke: C.border, main: "center" }, [I("more-horizontal", 16, C.s600)])])])
  ])]);
}
function reviewsPage(o) {
  o = o || {};
  return screen(o.name || "Reviews", "Reviews", function (cw) {
    return [
      heroRow("Business portal", "Reviews", "View verified customer reviews and reply where allowed.", searchBox("Search reviews…")),
      statGrid([
        { label: "Average rating", value: o.empty ? "—" : "4.0", desc: (o.empty ? "0" : "4") + " reviews across all moderation states · out of 5", icon: "star", help: true },
        { label: "Published reviews", value: o.empty ? "0" : "2", desc: "Visible on your public listings", icon: "message-square", action: "View reviews" },
        { label: "Pending reviews", value: o.empty ? "0" : "1", desc: "Awaiting admin moderation", icon: "clock", action: "View reviews" },
        { label: "Flagged reviews", value: o.empty ? "0" : "1", desc: "Flagged for moderation", icon: "alert-triangle", action: "View reviews" },
        { label: "Total reviews", value: o.empty ? "0" : "4", desc: "All moderation states · all time", icon: "users" }
      ], cw, 5),
      H({ fillW: true, main: "between", pb: 16, stroke: C.border, sides: { b: 1 } }, [filterTabs([["All reviews", o.empty ? 0 : 4], ["Pending", o.empty ? 0 : 1], ["Published", o.empty ? 0 : 2], ["Flagged", o.empty ? 0 : 1]], "All reviews"), H({ gap: 8 }, [T("Sort by:", { size: 14, w: 600, color: C.s700 }), inputBox({ value: "Newest", select: true, w: 160, h: 36 })])]),
      o.empty ? emptyState("No reviews found", "You don't have any reviews in this category yet.") : V({ gap: 16, fillW: true }, RVWS.map(function (r) { return reviewCard(r, cw); }))
    ];
  }, { maxW: 1136 });
}
function flowReviews() {
  return [
    { section: "Reviews · /business/reviews", screens: [
      { title: "Reviews — populated", note: "5 StatCards, status FilterTabs, sort (Newest / Highest / Lowest). Each card: guest, stars, body, public reply form or existing reply, moderation badge and booking reference.", build: function () { return reviewsPage({}); } },
      { title: "Review menu", note: "Report to support · Open customer messages.", build: function () { return withOverlay(reviewsPage({ name: "Reviews — menu" }), menu([{ text: "Report to support" }, { text: "Open customer messages" }], { w: 200 }), { anchor: "Review actions", noScrim: true, dx: -168 }); } },
      { title: "Reviews — empty", note: "Average rating shows an em dash; EmptyState below.", build: function () { return reviewsPage({ empty: true, name: "Reviews — empty" }); } }
    ] }
  ];
}

// ================= 10 EARNINGS =================
function donut(size, parts) {
  const f = chartFrame(size, size, "PayoutBreakdownChart");
  const r = size / 2 - 14, cx = size / 2, cy = size / 2;
  let a0 = -Math.PI / 2;
  const total = parts.reduce(function (s, p) { return s + p[0]; }, 0) || 1;
  parts.forEach(function (p) {
    const a1 = a0 + Math.max(0.0001, (p[0] / total) * Math.PI * 2 - 0.04);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = "M" + (cx + r * Math.cos(a0)).toFixed(1) + " " + (cy + r * Math.sin(a0)).toFixed(1) + " A" + r + " " + r + " 0 " + large + " 1 " + (cx + r * Math.cos(a1)).toFixed(1) + " " + (cy + r * Math.sin(a1)).toFixed(1);
    const n = figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '"><path d="' + d + '" fill="none" stroke="' + p[1] + '" stroke-width="20"/></svg>');
    n.name = "Arc"; n.fills = []; f.appendChild(n); n.x = 0; n.y = 0;
    a0 = a1 + 0.04;
  });
  return f;
}
function earningsPage(o) {
  o = o || {};
  return screen(o.name || "Revenue & payouts", "Earnings", function (cw) {
    const big = Math.floor((cw - 16) * 2 / 3), small = cw - 16 - big;
    const rows = o.empty ? [] : [["4 Nov 2026", "Murchison River Lodge", "MTN Mobile Money", "payment", "SUCCESSFUL", "UGX 840,000", "UGX 100,800", "UGX 739,200"], ["2 Nov 2026", "Kibale Forest Edge Camp", "Card", "payment", "SUCCESSFUL", "UGX 700,000", "UGX 84,000", "UGX 616,000"], ["1 Nov 2026", "Murchison River Lodge", "Airtel Money", "payment", "PARTIALLY_REFUNDED", "UGX 460,000", "UGX 27,600", "UGX 202,400"], ["29 Oct 2026", "Kampala Boutique Stay", "Card", "payment", "SUCCESSFUL", "UGX 360,000", "UGX 43,200", "UGX 316,800"], ["22 Oct 2026", "Kibale Forest Edge Camp", "MTN Mobile Money", "payment", "FAILED", "UGX 430,000", "UGX 51,600", "UGX 0"]].map(function (r) {
      return [r[0], H({ gap: 12 }, [F({ w: 40, h: 40, radius: 8, fill: C.s100, stroke: C.border }), T(r[1], { size: 14, color: C.s700 })]), H({ gap: 8 }, [I(r[2] === "Card" ? "credit-card" : "phone", 16, C.s500), T(r[2], { size: 14, color: C.s700 })]), sb("payment", r[4], "table"), r[5], r[6], r[7], tableAction("View")];
    });
    return [
      heroRow("Business portal", "Revenue & payouts", "Track paid bookings, commission, and net payout.", H({ gap: 12 }, [H({ h: 40, px: 16, radius: 999, stroke: C.border, gap: 8 }, [I("calendar", 16, C.s400), T("All dates", { size: 14, w: 500, color: C.s700 })]), toolBtn("Export", "download")])),
      statGrid([
        { label: "Gross payments", value: o.empty ? "UGX 0" : "UGX 2,790,000", desc: "Successful payments before refunds", icon: "banknote", help: true },
        { label: "Platform commission (12%)", value: o.empty ? "UGX 0" : "UGX 255,600", desc: "Calculated after completed refunds", icon: "percent", help: true },
        { label: "Net business earnings", value: o.empty ? "UGX 0" : "UGX 1,874,400", desc: "After completed refunds and commission", icon: "credit-card", help: true },
        { label: "Completed refunds", value: o.empty ? "UGX 0" : "UGX 230,000", desc: "Refund amounts recorded as completed", icon: "undo-2", help: true }
      ], cw, 4),
      H({ gap: 16, fillW: true, cross: "start" }, [
        card([V({ pad: 24, gap: 12, fillW: true }, [
          H({ fillW: true, main: "between" }, [T("Revenue overview", { size: 14, w: 600, color: C.s900 }), inputBox({ value: "Daily", select: true, w: 120, h: 36 })]),
          legend([["Gross revenue", "#16A34A"], ["Net payout", "#22C55E"]]),
          o.empty ? V({ h: 240, fillW: true, main: "center", cross: "center" }, [T("No payments recorded yet.", { size: 14, color: C.s500 })]) : V({ gap: 8, fillW: true }, [lineChart(big - 48, 240, [{ name: "gross", color: "#16A34A", values: [0.2, 0.45, 0.3, 0.6, 0.5, 0.75, 0.65] }, { name: "net", color: "#22C55E", values: [0.15, 0.38, 0.25, 0.52, 0.43, 0.66, 0.57] }]), axisLabels(["22 Oct", "26 Oct", "29 Oct", "1 Nov", "2 Nov", "4 Nov"], big - 48)])
        ])], { w: big }),
        card([V({ pad: 24, gap: 16, fillW: true, h: 360 }, [
          H({ gap: 8 }, [T("Payout breakdown", { size: 14, w: 600, color: C.s900 }), I("info", 14, C.s300)]),
          H({ fillW: true, main: "center" }, [donut(160, o.empty ? [[1, C.s100]] : [[1240000, "#16A34A"], [410000, "#4ADE80"], [224400, "#FDE047"]])]),
          grow({ fillH: true }),
          V({ gap: 12, fillW: true }, [["Paid to you", "#16A34A", o.empty ? "UGX 0" : "UGX 1,240,000"], ["Processing", "#4ADE80", o.empty ? "UGX 0" : "UGX 410,000"], ["On hold", "#FDE047", o.empty ? "UGX 0" : "UGX 224,400"]].map(function (r) { return H({ fillW: true, main: "between" }, [H({ gap: 8 }, [dot(8, r[1]), T(r[0], { size: 12, w: 500, color: C.s700 })]), T(r[2], { size: 12, w: 500, color: C.s900 })]); }).concat([H({ fillW: true, main: "between", pt: 12, stroke: C.s100, sides: { t: 1 } }, [T("Total", { size: 12, w: 500, color: C.s900 }), T(o.empty ? "UGX 0" : "UGX 1,874,400", { size: 14, w: 600, color: C.s900 })])]))
        ])], { w: small })
      ]),
      H({ fillW: true, main: "between" }, [filterTabs([["All transactions", o.empty ? 0 : 5]], "All transactions"), searchBox("Search transactions…")]),
      o.empty ? emptyState("No transactions yet", "Paid bookings will show up here.") :
        table([{ label: "Date", weight: 1 }, { label: "Listing", weight: 2 }, { label: "Method", weight: 1.5 }, { label: "Status", weight: 1.3 }, { label: "Gross amount", weight: 1.1, align: "right", help: true }, { label: "Commission (12%)", weight: 1.2, align: "right", help: true }, { label: "Net payout", weight: 1.1, align: "right", help: true }, { label: "Actions", weight: 0.8, align: "right" }], rows, { w: cw, footer: tableFooter("Showing 1 to 5 of 5 transactions", 1, 1) })
    ];
  }, { maxW: 1136 });
}
function flowEarnings() {
  return [
    { section: "Earnings · /business/revenue", screens: [
      { title: "Revenue & payouts — populated", note: "Allocation-aware totals (multi-business orders split per booking). Commission 12% after completed refunds. Payout breakdown: paid, processing, on hold.", build: function () { return earningsPage({}); } },
      { title: "Revenue & payouts — empty", note: "Zero values stay visible; no transactions EmptyState.", build: function () { return earningsPage({ empty: true, name: "Revenue — empty" }); } }
    ] }
  ];
}

// ================= 11 NOTIFICATIONS =================
const NOTES = [["Booking request", "Sarah Nakimuli requested Murchison River Lodge for 9–11 Nov. Respond by 6 Nov.", "10 min ago", true, "calendar-clock"], ["New message", "Joseph Byamukama: Is the chimp permit included?", "1 h ago", true, "message-circle"], ["Payment received", "UGX 840,000 for BK-2417 via MTN Mobile Money.", "Yesterday", false, "banknote"], ["Listing needs changes", "Lake Bunyonyi Eco Lodge: replace the cover photo and resubmit.", "3 Nov", false, "clipboard-list"], ["Refund completed", "UGX 230,000 refunded for BK-2398.", "2 Nov", false, "undo-2"]];
function notificationsPage(o) {
  o = o || {};
  return screen(o.name || "Notifications", "Notifications", function (cw) {
    const items = o.empty ? [emptyState("No notifications", "Updates about bookings, payments, messages and reviews appear here.", { icon: "bell-off" })] : NOTES.filter(function (n) { return o.tab !== "Unread" || n[3]; }).map(function (n, i, arr) {
      return H({ name: "Notification · " + n[0], fillW: true, px: 20, py: 16, gap: 12, cross: "start", fill: n[3] ? C.successSoft : C.white, fo: n[3] ? 0.5 : 1, stroke: C.s100, sides: { b: i === arr.length - 1 ? 0 : 1 } }, [
        F({ w: 36, h: 36, radius: 18, fill: C.s100, main: "center", cross: "center" }, [I(n[4], 16, C.s600)]),
        V({ fillW: true, gap: 2 }, [H({ gap: 8 }, [T(n[0], { size: 14, w: 600 }), n[3] ? dot(8, C.primary) : null]), T(n[1], { size: 14, color: C.s600, fillW: true }), T(n[2], { size: 12, color: C.s500 })]),
        n[3] ? btnRaw("Mark as read", { variant: "ghost", size: "xs" }) : null
      ]);
    });
    return [
      pageHero("Business portal", "Notifications", "Updates sent to your account across the businesses you belong to. Opening a business booking selects its business."),
      H({ fillW: true, main: "between" }, [filterTabs([["All", o.empty ? 0 : 5], ["Unread", o.empty ? 0 : 2], ["My categories", null]], o.tab || "All"), H({ gap: 12 }, [searchBox("Search notifications…"), btnRaw("Mark all as read", { variant: "outline", size: "sm", disabled: !!o.empty })])]),
      o.tab === "My categories" ? T("Showing the categories selected in Settings → Notifications.", { size: 14, color: C.muted }) : null,
      o.empty ? items[0] : V({ fillW: true, radius: 16, stroke: C.border, fill: C.white, clip: true }, items),
      o.empty ? null : H({ fillW: true, main: "end" }, [pagination(1, 1)])
    ];
  }, { maxW: 1024 });
}
function flowNotifications() {
  return [
    { section: "Notification centre · /business/notifications", screens: [
      { title: "All notifications", note: "Recipient-owned NotificationCentre with a database-backed unread count in the header bell. Search, tabs and pagination are URL-backed.", build: function () { return notificationsPage({}); } },
      { title: "Unread", note: "Unread tab; Mark as read only writes the signed-in recipient's rows.", build: function () { return notificationsPage({ tab: "Unread", name: "Notifications — unread" }); } },
      { title: "My categories", note: "Applies the categories saved in Settings → Notifications.", build: function () { return notificationsPage({ tab: "My categories", name: "Notifications — my categories" }); } },
      { title: "Empty", note: "No notifications yet.", build: function () { return notificationsPage({ empty: true, name: "Notifications — empty" }); } }
    ] }
  ];
}

// ================= 12 SETTINGS =================
const SET_TABS = ["Business profile", "Verification & documents", "Notifications", "Staff access"];
function settingsShell(name, tab, kidsFn) {
  return screen(name, "Settings", function (cw) {
    return [pageHero("Business portal", "Settings", "Manage your business profile, verification documents, staff access, and preferences."),
      H({ name: "BusinessSettingsNavigation", gap: 4, pb: 0, stroke: C.border, sides: { b: 1 }, fillW: true }, SET_TABS.map(function (t) { return V({ px: 12, py: 10, stroke: t === tab ? C.primary : null, sides: { b: 2 } }, [T(t, { size: 14, w: t === tab ? 600 : 500, color: t === tab ? C.primary : C.s500 })]); }))
    ].concat(kidsFn(cw));
  }, { maxW: 896 });
}
function settingsProfile() {
  return settingsShell("Settings — business profile", "Business profile", function (cw) {
    return [V({ fillW: true, pad: 32, radius: 16, stroke: C.border, fill: C.white, shadow: "card", gap: 32 }, [
      H({ gap: 16, cross: "start" }, [F({ w: 40, h: 40, radius: 12, fill: C.primary, fo: 0.1, main: "center", cross: "center" }, [I("building-2", 20, C.primary)]), V({ gap: 2 }, [T("Business Information", { size: 18, w: 600, color: C.s900 }), T("Update your registered business details.", { size: 14, w: 500, color: C.s500 })])]),
      fieldRow([V({ gap: 8, fillW: true }, [fieldLabel("Business logo"), T("Shown in your business profile and customer conversations.", { size: 12, color: C.muted }), uploadBox("Upload business logo", false)]), V({ gap: 8, fillW: true }, [fieldLabel("Cover photo"), T("Shown at the top of your business overview.", { size: 12, color: C.muted }), uploadBox("Upload business cover photo", false)])]),
      fieldRow([f2("Business Name *", { value: BIZ_NAMES[0] }), f2("Support Email *", { value: "stays@nilecrater.test", help: "The email customers can use to contact your business." })]),
      fieldRow([f2("Phone Number *", { value: "+256 772 123456", help: "Include country code" }), f2("Physical Address *", { value: "Plot 12, Main Street, Jinja", help: "Registered business address for administration. Set each listing's customer-facing address in its listing form." })]),
      fieldRow([f2("City *", { value: "Jinja", select: true }), f2("Country", { value: "Uganda", select: true })]),
      fieldRow([f2("Registration number", { value: "80020001234567" }), f2("Contact name", { value: "Farida Nansubuga" }), f2("Contact role", { value: "Owner" })]),
      V({ gap: 6, fillW: true }, [fieldLabel("About the Business *"), textarea({ value: "Verified lodge and boutique-stay operator across Uganda's national parks and Kampala.", h: 112 }), T("This description appears on your business profile.", { size: 12, w: 500, color: C.s500 })]),
      H({ fillW: true, main: "end" }, [btnRaw("Save changes", { radius: 12 })])
    ])];
  });
}
function settingsNotifications() {
  return settingsShell("Settings — notifications", "Notifications", function () {
    const cats = [["Booking updates", true], ["Payment updates", true], ["Review prompts", true], ["Support updates", true], ["Safety advisories", false], ["Account updates", true]];
    const tileW = Math.floor((832 - 48 - 12) / 2);
    return [card([cardHeader("Notification categories", "Manage the updates shown in your account's notification centre."), cardContent([
      T("Choose what appears under My categories in your notification centre. These categories are shared across your account; All and Unread continue to show every update.", { size: 14, color: C.muted, relaxed: true, fillW: true }),
      H({ gap: 12, wrap: true, rowGap: 12, fillW: true }, cats.map(function (c) {
        return H({ name: "Category · " + c[0], w: tileW, pad: 16, radius: 12, stroke: c[1] ? C.primary : C.border, so: c[1] ? 0.25 : 1, fill: c[1] ? C.primary : C.white, fo: c[1] ? 0.05 : 1, main: "between" }, [T(c[0], { size: 14, color: C.s700 }), F({ w: 16, h: 16, radius: 4, fill: c[1] ? C.primary : C.white, stroke: c[1] ? C.primary : C.s500, dir: "V", main: "center", cross: "center" }, c[1] ? [I("check", 12, C.white)] : [])]);
      })),
      T("Updates appear in the app. These settings do not subscribe you to email, SMS or weekly reports.", { size: 12, color: C.muted, fillW: true }),
      btnRaw("Save categories", { size: "sm", radius: 8 })
    ], { gap: 20 })]), H({ gap: 12 }, [btn("Open notifications", { variant: "outline" }), btn("Open messages", { variant: "outline" })])];
  });
}
function settingsTeam(o) {
  o = o || {};
  return settingsShell("Settings — staff access", "Staff access", function (cw) {
    const rows = [
      [H({ gap: 12 }, [avatar("FN", 36), V({ gap: 0 }, [H({ gap: 6 }, [T("Farida Nansubuga", { size: 14, color: C.s700 }), H({ px: 6, py: 2, radius: 4, fill: C.primary, fo: 0.1 }, [T("OWNER", { size: 12, color: C.primary })])]), T("owner.stays@safarinexa.test", { size: 12, color: C.s500 })])]), "Owner · full access", "14 Aug 2026", null],
      [H({ gap: 12 }, [avatar("MT", 36), V({ gap: 0 }, [T("Multi-Business Tester", { size: 14, color: C.s700 }), T("business@dev.test", { size: 12, color: C.s500 })])]), "Owner · full access", "14 Aug 2026", null],
      [H({ gap: 12 }, [avatar("GA", 36), V({ gap: 0 }, [T("Grace Akello", { size: 14, color: C.s700 }), T("grace@nilecrater.test", { size: 12, color: C.s500 })])]), "Manager · listings, bookings, team", "2 Oct 2026", H({ name: "Remove member", w: 32, h: 32, radius: 8, stroke: C.border, main: "center" }, [I("trash-2", 16, C.s500)])],
      [H({ gap: 12 }, [avatar("JO", 36), V({ gap: 0 }, [T("james.okello@nilecrater.test", { size: 14, color: C.s700 }), pill("Invitation pending", "amber")])]), "Staff · bookings and messages", T("Expires: 11/11/2026", { size: 14, color: C.s500 }), btnRaw("Cancel", { variant: "ghost", size: "xs", color: C.red600 })]
    ];
    return [V({ fillW: true, pad: 32, radius: 16, stroke: C.border, fill: C.white, shadow: "card", gap: 24 }, [
      V({ gap: 4 }, [T("Staff Access", { size: 20, w: 600, color: C.s900 }), T("Manage who can access and manage this business portal.", { size: 14, w: 500, color: C.s500 })]),
      H({ gap: 12, fillW: true }, [inputBox({ placeholder: "Email address", value: o.inviting ? "james.okello@nilecrater.test" : "" }), inputBox({ value: "Staff", select: true, w: 160 }), btnRaw("Invite", { icon: "user-plus", radius: 12 })]),
      o.notConfigured ? alertBox("Email invitations are not configured. Share the invitation link manually.", "warning", "info") : null,
      T("Team members", { size: 16, w: 600, color: C.s900 }),
      table([{ label: "Member", weight: 2.4 }, { label: "Role & Permissions", weight: 2 }, { label: "Joined", weight: 1.2, help: true }, { label: "Actions", weight: 0.8, align: "right" }], rows, { w: 832 })
    ])];
  });
}
function flowSettings() {
  return [
    { section: "Settings · /business/settings (tabs)", screens: [
      { title: "Business profile", note: "Logo and cover uploads, registered details and About. /business/profile redirects here.", build: settingsProfile },
      { title: "Notifications", note: "?tab=notifications — NotificationPreferencesForm: six categories saved to the account and used by My categories. In-app only; no email or SMS subscription.", build: settingsNotifications },
      { title: "Staff access", note: "?tab=team — invite by email as Staff or Manager; owners are marked; pending invitations can be cancelled. /business/team redirects here.", build: function () { return settingsTeam({}); } }
    ] }
  ];
}

// ================= 13 VERIFICATION & DOCUMENTS =================
const VCOPY = { SUBMITTED: "Your documents have been submitted and are awaiting review. We'll notify you once there's an update.", NEEDS_CHANGES: "We need more information before we can approve your business. See the notes below and resubmit.", APPROVED: "Your business is verified. You can submit individual listings and photos for admin approval before publication.", NOT_STARTED: "You haven't submitted your business for verification yet." };
function vTimeline(status) {
  const order = ["Submitted", "Under review", "Additional info", "Approval"];
  const reached = { NOT_STARTED: 0, SUBMITTED: 1, UNDER_REVIEW: 2, NEEDS_CHANGES: 3, APPROVED: 4 }[status] || 0;
  const kids = [];
  order.forEach(function (l, i) {
    const done = i < reached, cur = i === reached - 1;
    if (i) kids.push(F({ w: 64, h: 2, fill: i < reached ? C.primary : C.s200 }));
    kids.push(V({ gap: 8, cross: "center", w: 96 }, [F({ w: 32, h: 32, radius: 16, fill: done ? C.primary : C.white, stroke: done ? C.primary : C.s200, sw: 2, main: "center", cross: "center", dir: "V" }, [done ? I(status === "NEEDS_CHANGES" && i === 2 ? "alert-circle" : "check", 16, C.white) : dot(8, C.s300)]), T(i === 0 && status === "NOT_STARTED" ? "Not submitted" : l, { size: 12, w: cur ? 600 : 500, color: done ? C.fg : C.s500, align: "center" }), done ? T(i === 0 ? "2 Nov 2026" : "", { size: 11, color: C.s500 }) : null]));
  });
  return H({ name: "VerificationTimeline", gap: 0, cross: "start" }, kids);
}
function verificationPage(status) {
  return settingsShell("Verification — " + status.toLowerCase(), "Verification & documents", function (cw) {
    const docs = status === "NOT_STARTED" ? [] : [["Certificate of incorporation.pdf", "Incorporation", "1.2 MB"], ["Trading licence 2026.pdf", "Licenses & permits", "840 KB"], ["URA TIN certificate.png", "Tax documents", "410 KB"]];
    return [
      V({ gap: 4 }, [T("Verification & documents", { size: 18, w: 600, color: C.s900 }), T("Submit documents and track your business approval.", { size: 14, color: C.s500 })]),
      card([H({ pad: 32, gap: 40, fillW: true }, [
        V({ w: 240, gap: 12 }, [T("Verification status", { size: 14, w: 600, color: C.s900 }), sb("verification", status), T(VCOPY[status], { size: 14, color: C.s500, relaxed: true, fillW: true }), status === "NEEDS_CHANGES" ? V({ fillW: true, pad: 12, radius: 8, fill: C.s50, stroke: C.s100 }, [T("Reviewer notes: Registration number does not match URSB records. Please upload the updated certificate.", { size: 14, color: C.s700, relaxed: true, fillW: true })]) : null]),
        V({ fillW: true, pl: 40, stroke: C.s100, sides: { l: 1 } }, [vTimeline(status)])
      ])]),
      card([cardHeader("Documents", "Registration documents, licenses, tax IDs, and other evidence. Submitting moves your business back into review."), cardContent([
        H({ gap: 12, fillW: true }, [inputBox({ value: "Select document type", select: true, w: 240 }), V({ fillW: true, py: 16, radius: 12, stroke: C.border, dash: true, cross: "center", gap: 4 }, [I("upload", 20, C.s400), T("PDF, JPG, PNG up to 5MB", { size: 12, color: C.s500 })])]),
        T("Uploaded documents", { size: 14, w: 600 }),
        docs.length ? V({ gap: 8, fillW: true }, docs.map(function (d) { return H({ fillW: true, pad: 12, radius: 12, stroke: C.border, gap: 12 }, [F({ w: 36, h: 36, radius: 8, fill: C.s100, main: "center", cross: "center" }, [I("file-text", 16, C.s600)]), V({ fillW: true, gap: 0 }, [T(d[0], { size: 14, w: 500 }), T(d[1] + " · " + d[2], { size: 12, color: C.s500 })]), pill("Attached", "green"), I("more-horizontal", 16, C.s400)]); })) : T("No documents uploaded yet.", { size: 14, color: C.muted }),
        V({ fillW: true, pad: 16, radius: 12, fill: C.s50, gap: 4 }, [T("Why we need these documents", { size: 14, w: 600 }), T("These help us verify your business is legitimate and compliant with local regulations.", { size: 14, color: C.muted, fillW: true }), T("Learn more ↗", { size: 14, w: 500, color: C.primary })]),
        V({ fillW: true, gap: 2 }, [T("Need help?", { size: 14, w: 600 }), T("If you're not sure what to upload, contact our support team.", { size: 14, color: C.muted })])
      ])])
    ];
  });
}
function flowVerification() {
  return [
    { section: "Verification · /business/settings/verification", screens: [
      { title: "Submitted", note: "Status card with VerificationTimeline; documents live in private storage. /business/verification redirects here.", build: function () { return verificationPage("SUBMITTED"); } },
      { title: "Needs changes", note: "Reviewer notes from the admin decision are shown under the status.", build: function () { return verificationPage("NEEDS_CHANGES"); } },
      { title: "Approved", note: "Verified businesses can submit listings for approval.", build: function () { return verificationPage("APPROVED"); } },
      { title: "Not started", note: "No documents yet.", build: function () { return verificationPage("NOT_STARTED"); } }
    ] }
  ];
}
