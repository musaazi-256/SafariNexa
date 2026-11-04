// 05 Listings · 06 Guides · 07 Bookings

const LST_STATUS = { DRAFT: ["Draft", "secondary"], PUBLISHED: ["Published", "success"], ARCHIVED: ["Archived", "secondary"] };
const SUB_STATUS = { NOT_SUBMITTED: ["Not submitted", "secondary"], SUBMITTED: ["Submitted", "warning"], UNDER_REVIEW: ["Under review", "warning"], NEEDS_CHANGES: ["Needs changes", "warning"], APPROVED: ["Approved", "success"], REJECTED: ["Rejected", "destructive"] };
function lsb(s) { return badge(LST_STATUS[s][0], LST_STATUS[s][1], "table"); }
function ssb(s) { return badge(SUB_STATUS[s][0], SUB_STATUS[s][1], "table"); }
const LISTINGS = [
  ["Murchison River Lodge", "ACCOMMODATION", "Masindi", "UGX 340,000", "PUBLISHED", "APPROVED", "Today, 9:14 AM"],
  ["Kibale Forest Edge Camp", "ACCOMMODATION", "Fort Portal", "UGX 350,000", "PUBLISHED", "UNDER_REVIEW", "Yesterday, 4:02 PM"],
  ["Lake Bunyonyi Eco Lodge", "ACCOMMODATION", "Kabale", "UGX 310,000", "DRAFT", "NEEDS_CHANGES", "Nov 2, 2026"],
  ["Kampala Boutique Stay", "ACCOMMODATION", "Kampala", "UGX 280,000", "PUBLISHED", "APPROVED", "Oct 30, 2026"],
  ["Nile Sunrise Retreat", "ACCOMMODATION", "Jinja", "UGX 420,000", "DRAFT", "NOT_SUBMITTED", "Oct 28, 2026"],
  ["Crater Rim Hideaway", "ACCOMMODATION", "Fort Portal", "UGX 390,000", "ARCHIVED", "APPROVED", "Oct 12, 2026"]
];
const TYPE_ICON = { ACCOMMODATION: "bed", TOUR: "compass", RESTAURANT: "utensils", TRANSPORT: "car" };
function breadcrumbs(items) {
  const kids = [];
  items.forEach(function (it, i) { if (i) kids.push(I("chevron-right", 14, C.s400)); kids.push(T(it, { size: 14, color: i === items.length - 1 ? C.fg : C.muted, w: i === items.length - 1 ? 500 : 400 })); });
  return H({ name: "Breadcrumbs", gap: 6 }, kids);
}
function heroRow(eyebrow, title, desc, action) {
  return H({ fillW: true, main: "between", cross: "end" }, [pageHero(eyebrow, title, desc), action || null]);
}

function listingsPage(o) {
  o = o || {};
  return screen(o.name || "Listings", "Listings", function (cw) {
    const rows = o.empty ? [] : LISTINGS.map(function (l, i) {
      return [
        H({ gap: 12 }, [F({ w: 48, h: 48, radius: 8, fill: C.s100, clip: true, main: "center", cross: "center" }, [I("image", 16, C.s400)]), V({ gap: 0 }, [T(l[0], { size: 14, color: C.s700 }), T("ACC-" + (4211 + i * 37), { size: 12, color: C.s500 })])]),
        H({ gap: 8 }, [I(TYPE_ICON[l[1]], 16, C.s500), T(l[1].toLowerCase(), { size: 14, color: C.s700, capitalize: true })]),
        H({ gap: 8 }, [I("map-pin", 16, C.s500), T(l[2], { size: 14, color: C.s700 })]),
        l[3],
        V({ gap: 8 }, [lsb(l[4]), H({ gap: 4 }, [ssb(l[5]), T("Submission", { size: 12, color: C.fg, underline: true })])]),
        l[6],
        H({ gap: 8 }, [btnRaw("Edit", { size: "xs", variant: "outline", icon: "pencil", radius: 8, iconColor: C.s400 }), H({ name: "Listing actions", w: 32, h: 32, main: "center" }, [I("more-horizontal", 16, C.s400)])])
      ];
    });
    return [
      heroRow("Business portal", "Listings", "Create and manage your service offerings.", btnRaw("Create listing", { icon: "plus", radius: 8 })),
      statGrid([
        { label: "Total listings", value: o.empty ? "0" : "6", desc: (o.empty ? "0" : "3") + " currently published", icon: "list" },
        { label: "Draft listings", value: o.empty ? "0" : "2", desc: "Not published; may include submitted drafts", icon: "clock", help: true },
        { label: "Archived listings", value: o.empty ? "0" : "1", desc: "Archived and unavailable for new bookings", icon: "archive" },
        { label: "Bookings this month", value: o.empty ? "0" : "14", desc: "Bookings created this calendar month", icon: "calendar", action: "View bookings" }
      ], cw, 4),
      H({ fillW: true, main: "between", pb: 4, stroke: C.border, sides: { b: 1 } }, [filterTabs([["All listings", o.empty ? 0 : 6], ["Restaurants", 0], ["Experiences", 0], ["Transport", 0], ["Accommodation", o.empty ? 0 : 6]], "All listings"), searchBox("Search listings…")]),
      o.empty ? emptyState("No listings found", "You don't have any listings in this category yet.") :
        table([{ label: "Listing", weight: 2.4 }, { label: "Type", weight: 1.2 }, { label: "Location", weight: 1.2 }, { label: "Price", weight: 1 }, { label: "Status", weight: 1.6 }, { label: "Updated", weight: 1.2 }, { label: "Actions", weight: 1.2, align: "right" }], rows, { w: cw, footer: tableFooter("Showing 1 to 6 of 6 listings", 1, 1) })
    ];
  }, { maxW: 1136 });
}
function listingRowMenu(published) {
  const items = published ? [{ text: "Unpublish" }] : [{ text: "Submit for review", color: C.primary }];
  return menu(items.concat([{ text: "Submission & feedback" }, { text: "Archive", danger: true }]), { w: 160 });
}

function typeChooser(unverified) {
  return screen(unverified ? "Create listing — account under review" : "Create listing — choose type", "Listings", function (cw) {
    if (unverified) return [V({ fillW: true, minH: 480, main: "center", cross: "center", gap: 16 }, [
      F({ w: 64, h: 64, radius: 32, fill: "#FFEDD5", main: "center", cross: "center" }, [I("building-2", 32, C.orange600)]),
      type.page("Your account is under review", { color: C.s900 }),
      T("You cannot create listings yet. Our admins are currently reviewing your submitted verification documents. Once you are fully approved, you will be able to start adding your services here.", { size: 14, w: 500, color: C.s500, align: "center", width: 512, relaxed: true }),
      btn("Return to Dashboard", { variant: "outline" })
    ])];
    const opts = [["Accommodation", "Lodges, hotels, guesthouses — with room types and add-ons.", "building-2"], ["Tour", "Safaris, treks, and guided experiences.", "compass"], ["Restaurant", "Dining spots taking reservation requests.", "utensils"], ["Transport", "Airport transfers and Kampala special hire.", "car"]];
    const w = Math.floor((cw - 20) / 2);
    return [breadcrumbs(["Listings", "Create listing"]), type.page("What are you listing?"), H({ gap: 20, wrap: true, rowGap: 20, w: cw }, opts.map(function (op) {
      return card([V({ pad: 24, gap: 8, fillW: true }, [I(op[2], 24, C.primary), T(op[0], { size: 16, w: 600 }), T(op[1], { size: 14, color: C.muted, fillW: true, relaxed: true })])], { w: w });
    }))];
  }, { maxW: 896 });
}
function fieldRow(items) { return H({ gap: 16, fillW: true, cross: "start" }, items); }
function f2(label, o) { return field(label, Object.assign({}, o, { fillW: true })); }
function baseFieldsCard(filled) {
  return sectionCard("Listing details", null, [
    f2("Title *", { value: filled ? "Murchison River Lodge" : "", placeholder: "" }),
    V({ gap: 6, fillW: true }, [fieldLabel("Description *"), textarea({ value: filled ? "Riverside lodge on the Victoria Nile with bandas, a family suite and guided nature walks." : "", h: 112 })]),
    fieldRow([f2("City *", { value: filled ? "Masindi (current)" : "Kampala", select: true }), f2("Destination (optional)", { value: filled ? "Murchison Falls" : "None / Unassigned", select: true })]),
    f2("Address *", { value: filled ? "Paraa, Murchison Falls National Park" : "" }),
    fieldRow([f2("Latitude (optional)", { value: filled ? "2.2837" : "" }), f2("Longitude (optional)", { value: filled ? "31.5642" : "" })]),
    fieldRow([f2("Base price (UGX) *", { value: filled ? "340000" : "" }), f2("Booking mode (reviewed by admin)", { value: "Request to book — accept before payment", select: true })]),
    V({ gap: 6, fillW: true }, [fieldLabel("Cover photo"), uploadBox("Upload a cover photo", filled)]),
    V({ gap: 6, fillW: true }, [fieldLabel("Gallery photos"), uploadBox("Add gallery photos", filled, 4)])
  ]);
}
function uploadBox(label, filled, n) {
  if (filled) return H({ gap: 12 }, Array.from({ length: n || 1 }, function () { return F({ w: 96, h: 72, radius: 12, fill: C.s100, main: "center", cross: "center" }, [I("image", 16, C.s400)]); }).concat([V({ w: 96, h: 72, radius: 12, stroke: C.border, dash: true, main: "center", cross: "center" }, [I("plus", 16, C.s400)])]));
  return V({ fillW: true, py: 24, radius: 12, stroke: C.border, dash: true, cross: "center", gap: 6 }, [I("upload", 20, C.s400), T(label, { size: 14, w: 500, color: C.s600 }), T("JPG, PNG or WebP", { size: 12, color: C.s500 })]);
}
function accommodationCard(filled) {
  return sectionCard("Accommodation details", null, [
    fieldRow([f2("Property type *", { value: filled ? "Lodge" : "Hotel", select: true }), f2("Max guests *", { value: filled ? "12" : "" })]),
    fieldRow([f2("Check-in time *", { value: filled ? "14:00" : "", placeholder: "14:00" }), f2("Check-out time *", { value: filled ? "11:00" : "", placeholder: "11:00" })]),
    V({ gap: 8, fillW: true }, [fieldLabel("Amenities"), H({ gap: 24 }, [checkbox(true, "Wi-Fi"), checkbox(true, "Parking"), checkbox(false, "Swimming pool"), checkbox(true, "Airport transfer")])]),
    V({ gap: 6, fillW: true }, [fieldLabel("Cancellation policy"), textarea({ value: filled ? "Free cancellation up to 7 days before check-in." : "", h: 80 })])
  ]);
}
function roomTypesCard(filled) {
  const room = function (name, price, sleeps) {
    return V({ name: "Room · " + name, pad: 16, radius: 12, stroke: C.border, gap: 16, fillW: true }, [
      H({ fillW: true, main: "between" }, [T(name || "New room type", { size: 14, w: 600 }), I("trash-2", 16, C.s400)]),
      fieldRow([f2("Room name", { value: name }), f2("Price / night (UGX)", { value: price }), f2("Max occupancy (Sleeps)", { value: sleeps })]),
      fieldRow([f2("Bedrooms count", { value: "1" }), f2("Bed Type", { value: "1 Double Bed", placeholder: "e.g. 1 Double Bed, 1 King Bed, 2 Single Beds" }), f2("Total rooms of this type", { value: "4" })]),
      f2("Key Room Features (comma-separated)", { value: "Water view, Free WiFi", help: "Specify unique room highlights shown on the room preview card." }),
      fieldRow([f2("Refund Policy Notice (optional)", { placeholder: "e.g. Free cancellation before check-in date" }), f2("Member Discount / Special Badge (optional)", { placeholder: "e.g. Member Price $38 off" })]),
      V({ gap: 6, fillW: true }, [fieldLabel("Room Photos"), T("Upload photos specifically for this room type.", { size: 12, color: C.s500 }), uploadBox("Add room photos", true, 2)])
    ]);
  };
  return sectionCard("Room types", null, (filled ? [room("Garden View Room", "340000", "2"), room("Riverside Banda", "420000", "2")] : [room("", "", "")]).concat([btnRaw("Add room type", { variant: "outline", icon: "plus", size: "sm" })]));
}
function addOnsCard(filled) {
  const row = function (n, p, d) { return V({ pad: 16, radius: 12, stroke: C.border, gap: 12, fillW: true }, [fieldRow([f2("Add-on name", { value: n }), f2("Price / night (UGX)", { value: p })]), f2("Description (optional)", { value: d })]); };
  return sectionCard("Optional add-ons", null, (filled ? [row("Airport pickup", "60000", "Private transfer from Bugungu or Pakuba airstrip."), row("Guided nature walk", "40000", "1-hour guided walk around the lodge grounds.")] : []).concat([btnRaw("Add add-on", { variant: "outline", icon: "plus", size: "sm" })]));
}
function tourCard() {
  return sectionCard("Tour details", null, [
    fieldRow([f2("Safari type *", { value: "Gorilla & Chimp Trekking", select: true }), f2("Duration (days) *", { value: "1" }), f2("Difficulty *", { value: "Moderate", select: true })]),
    fieldRow([f2("Group size — min *", { value: "2" }), f2("Group size — max *", { value: "8" })]),
    fieldRow([V({ gap: 6, fillW: true }, [fieldLabel("Included (one per line)"), textarea({ value: "Park fees\nRanger guide\nLunch", h: 96 })]), V({ gap: 6, fillW: true }, [fieldLabel("Not included (one per line)"), textarea({ value: "Tips\nTravel insurance", h: 96 })])]),
    V({ gap: 6, fillW: true }, [fieldLabel("Itinerary (one day per line)"), textarea({ value: "Day 1: Briefing at Kanyanchu, forest trek, chimp viewing", h: 80 })]),
    f2("Assigned Guide", { value: "Moses Okwir", select: true })
  ]);
}
function restaurantCard() {
  return sectionCard("Restaurant details", null, [
    fieldRow([f2("Cuisine type *", { value: "Local Ugandan", select: true }), f2("Price range *", { value: "UGX 20,000 - 45,000 per person", select: true })]),
    fieldRow([f2("Opening hours *", { value: "Daily · 08:00 - 22:00", select: true }), f2("Reservation duration (minutes)", { value: "90" })]),
    fieldRow([f2("Seating capacity *", { value: "60" }), f2("Menu URL (optional)", { placeholder: "https://" })])
  ]);
}
function transportCard() {
  return sectionCard("Transport details", null, [
    fieldRow([f2("Category *", { value: "Airport transfer", select: true }), f2("Vehicle type *", { value: "SUV / 4x4", select: true })]),
    fieldRow([f2("Passenger capacity *", { value: "4" }), f2("Estimated duration (minutes)", { value: "75" })]),
    f2("Fare notes", { value: "Fixed fare per vehicle, not per passenger." })
  ]);
}
function listingForm(kind, o) {
  o = o || {};
  const edit = !!o.edit, filled = edit || !!o.filled;
  const labels = { ACCOMMODATION: "Accommodation", TOUR: "Tour", RESTAURANT: "Restaurant", TRANSPORT: "Transport" };
  return screen(o.name || ("New " + labels[kind].toLowerCase() + " listing"), "Listings", function (cw) {
    const typeCards = kind === "ACCOMMODATION" ? [accommodationCard(filled), roomTypesCard(filled), addOnsCard(filled)] : kind === "TOUR" ? [tourCard()] : kind === "RESTAURANT" ? [restaurantCard()] : [transportCard()];
    return [
      breadcrumbs(edit ? ["Listings", "Murchison River Lodge", "Edit"] : ["Listings", "Create listing", labels[kind]]),
      edit ? H({ fillW: true, main: "between" }, [type.page("Edit listing"), H({ gap: 16 }, [linkText("View public listing"), linkText("Submission & feedback"), linkText("Manage availability and date pricing")])]) : type.page("New " + labels[kind].toLowerCase() + " listing"),
      o.publishedRevision ? alertBox("This listing is live. Saving creates a draft revision; the approved version stays published until an admin approves the change.", "warning", "info") : null,
      baseFieldsCard(filled)
    ].concat(typeCards, [edit ? H({ gap: 12 }, [btn("Save changes", { size: "lg" }), btn("Cancel", { variant: "outline", size: "lg" })]) : btn("Create draft listing", { size: "lg" })]);
  }, { maxW: 896 });
}
function lockedEdit() {
  return screen("Edit — locked during review", "Listings", function () {
    return [V({ gap: 16, w: 672 }, [type.page("Submission is locked during review"), T("Withdraw the pending submission before editing. The approved live version remains unchanged.", { size: 14, color: C.fg, fillW: true }), linkText("Submission & feedback")])];
  }, { maxW: 672 });
}
function reviewPage(o) {
  o = o || {};
  return screen(o.name || "Listing review", "Listings", function (cw) {
    const hist = o.noHistory ? [T("No submissions yet.", { size: 14, color: C.muted })] : [
      V({ pad: 20, radius: 16, stroke: C.border, gap: 8, fillW: true }, [H({ gap: 8 }, [ssb(o.state || "NEEDS_CHANGES"), T("Submitted 2 Nov 2026 · reviewed 3 Nov 2026", { size: 14, w: 600 })]), T("Reviewer notes: The cover photo shows a different property. Please replace it and confirm the family suite occupancy.", { size: 14, color: C.fg, relaxed: true, fillW: true }), linkText("View exact submitted information and photos")]),
      V({ pad: 20, radius: 16, stroke: C.border, gap: 8, fillW: true }, [H({ gap: 8 }, [ssb("APPROVED"), T("Submitted 14 Oct 2026 · reviewed 15 Oct 2026", { size: 14, w: 600 })])])
    ];
    return [
      btnRaw("← Back to listings", { variant: "ghost", size: "sm" }),
      pageHero("Listing review", "Lake Bunyonyi Eco Lodge", "Review your saved listing, photos and submission feedback."),
      H({ gap: 12 }, [T("Publication", { size: 14, color: C.muted }), lsb(o.publication || "DRAFT"), T("Review", { size: 14, color: C.muted }), ssb(o.state || "NEEDS_CHANGES")]),
      o.unverified ? V({ fillW: true, pad: 20, radius: 16, fill: C.warning, fo: 0.05, stroke: C.warning, so: 0.3 }, [T("Business verification must be approved before this listing can be submitted. View business verification", { size: 14, relaxed: true, fillW: true })]) : null,
      linkText("Manage operational availability and date-specific prices"),
      V({ fillW: true, pad: 20, radius: 16, fill: C.white, stroke: C.border }, [T("Uploading a photo does not approve it. Submit the saved listing or draft revision below. Admin reviews every cover, gallery and room photo with the details. Pending submissions are locked. Published listings stay live while a revision is reviewed.", { size: 14, relaxed: true, fillW: true })]),
      linkText(o.publication === "PUBLISHED" ? "Edit a draft revision — keep approved listing live" : "Edit draft listing"),
      o.errors ? V({ fillW: true, pad: 20, radius: 16, fill: C.warning, fo: 0.05, stroke: C.warning, so: 0.3, gap: 8 }, [T("Before submitting", { size: 14, w: 600 }), T("• Add at least one gallery photo\n• Add at least one room type with a price", { size: 14, relaxed: true })]) : null,
      o.state === "SUBMITTED" || o.state === "UNDER_REVIEW" ? btn("Withdraw to make changes", { variant: "outline" }) : btn("Submit listing and photos for approval", { disabled: !!o.errors || !!o.unverified }),
      card([cardHeader("Review history"), cardContent(hist, { gap: 12 })]),
      V({ fillW: true, pad: 20, radius: 16, fill: C.white, stroke: C.border }, [H({ gap: 8 }, [I("chevron-right", 16, C.fg), T("Preview current saved information and photos", { size: 14, w: 600 })])])
    ];
  }, { maxW: 896 });
}
function availabilityPage(o) {
  o = o || {};
  const base = screen("Availability", "Listings", function (cw) {
    const days = [];
    const lead = 0; // 1 Nov 2026 is a Sunday
    for (let i = 0; i < lead; i++) days.push(null);
    for (let d = 1; d <= 30; d++) days.push(d);
    const cell = Math.floor((672 - 6 * 6) / 7);
    const set = { 3: "2/4", 4: "1/4", 5: "0/4", 6: "4/4", 12: "3/4", 13: "3/4", 20: "2/4", 21: "4/4", 27: "1/4", 28: "0/4" };
    const grid = H({ name: "Calendar", gap: 6, wrap: true, rowGap: 6, w: 672 }, ["S", "M", "T", "W", "T", "F", "S"].map(function (l) { return H({ w: cell, main: "center" }, [T(l, { size: 12, w: 500, color: C.muted })]); }).concat(days.map(function (d) {
      if (d === null) return F({ w: cell, h: 64 });
      const info = set[d];
      return V({ name: "Day " + d, w: cell, h: 64, radius: 12, stroke: info ? C.primary : C.border, so: info ? 0.4 : 1, fill: info ? C.primary : (o.selected === d ? C.secondary : null), fo: info ? 0.05 : 1, main: "center", cross: "center", gap: 2 }, [T(String(d), { size: 12, w: 600 }), T(info || "Set", { size: 12, color: C.muted })]);
    })));
    return [
      linkText("Back to listing"),
      type.page("Availability — Murchison River Lodge"),
      T("Capacity includes existing bookings. Set zero to close an unbooked date. Prices are whole UGX and are confirmed at checkout.", { size: 14, fillW: true, relaxed: true }),
      H({ gap: 6 }, [btnRaw("Garden View Room", { size: "sm", fill: C.s900, color: C.white, stroke: C.s900 }), btnRaw("Riverside Banda", { size: "sm", variant: "outline" }), btnRaw("Family Suite", { size: "sm", variant: "outline" })]),
      H({ w: 672, main: "between" }, [H({ w: 32, h: 32, radius: 16, main: "center", opacity: 0.4 }, [I("chevron-left", 16, C.muted)]), T("November 2026", { size: 14, w: 600 }), H({ w: 32, h: 32, radius: 16, main: "center" }, [I("chevron-right", 16, C.muted)])]),
      grid
    ];
  }, { maxW: 672 });
  if (!o.modal) return base;
  return withOverlay(base, dialog("2026-11-12", null, [
    field("Capacity", { value: "4" }),
    V({ gap: 2, fillW: true, pad: 12, radius: 12, fill: C.s50 }, [T("Remaining", { size: 12, w: 500, color: C.muted }), T("3", { size: 16, w: 600 }), T("Calculated automatically from capacity minus existing reservations.", { size: 12, color: C.muted, fillW: true })]),
    field("Price override (UGX, optional)", { value: "380000" })
  ], [btn("Save", { size: "sm" })]));
}
function flowListings() {
  return [
    { section: "Listings list · /business/listings", screens: [
      { title: "Listings — populated", note: "PageHero + Create listing, 4 StatCards, type FilterTabs with counts, PortalSearch, table with publication and latest submission status.", build: function () { return listingsPage({}); } },
      { title: "Listings — empty", note: "EmptyState when nothing matches the type filter or search.", build: function () { return listingsPage({ empty: true, name: "Listings — empty" }); } },
      { title: "Row menu — draft", note: "Draft: Submit for review (disabled until business is approved and listing is a draft not already in review), Submission & feedback, Archive.", build: function () { return withOverlay(listingsPage({ name: "Listings — draft menu" }), listingRowMenu(false), { anchor: "Listing actions", noScrim: true, dx: -128 }); } },
      { title: "Row menu — published", note: "Published: Unpublish (sets DRAFT), Submission & feedback, Archive (sets ARCHIVED). Only owners and managers.", build: function () { return withOverlay(listingsPage({ name: "Listings — published menu" }), listingRowMenu(true), { anchor: "Listing actions", noScrim: true, dx: -128 }); } }
    ] },
    { section: "Create listing · /business/listings/new", screens: [
      { title: "Choose a listing type", note: "Four type cards → /business/listings/new?type=…", build: function () { return typeChooser(false); } },
      { title: "Blocked — account under review", note: "Shown instead of the chooser until verification is approved.", build: function () { return typeChooser(true); } },
      { title: "New accommodation (empty)", note: "ListingBaseFields + AccommodationTypeFields + RoomTypeEditor + AddOnEditor. Creates a DRAFT.", build: function () { return listingForm("ACCOMMODATION"); } },
      { title: "New tour", note: "TourTypeFields: safari type, duration, difficulty, group size, inclusions, itinerary, assigned guide.", build: function () { return listingForm("TOUR", { filled: true }); } },
      { title: "New restaurant", note: "RestaurantTypeFields: cuisine, price range, opening hours, reservation duration, seating capacity, menu URL.", build: function () { return listingForm("RESTAURANT", { filled: true }); } },
      { title: "New transport", note: "TransportTypeFields: category, vehicle, capacity, duration, fare notes.", build: function () { return listingForm("TRANSPORT", { filled: true }); } }
    ] },
    { section: "Edit listing · /business/listings/[id]/edit", screens: [
      { title: "Edit draft (accommodation)", note: "Owners and managers only. Rooms/add-ons with bookings are kept even if removed from the form.", build: function () { return listingForm("ACCOMMODATION", { edit: true, name: "Edit listing — draft" }); } },
      { title: "Edit published — draft revision", note: "Saving a published listing stores draftForm/draftSnapshot and redirects to review; the live version stays published.", build: function () { return listingForm("ACCOMMODATION", { edit: true, publishedRevision: true, name: "Edit listing — revision" }); } },
      { title: "Locked during review", note: "A SUBMITTED or UNDER_REVIEW submission blocks editing.", build: lockedEdit }
    ] },
    { section: "Submission & feedback · /business/listings/[id]/review", screens: [
      { title: "Needs changes", note: "Latest submission NEEDS_CHANGES with reviewer notes; history entries expand to the exact submitted snapshot.", build: function () { return reviewPage({}); } },
      { title: "Not submitted — incomplete", note: "\"Before submitting\" lists missing requirements; submit is disabled.", build: function () { return reviewPage({ state: "NOT_SUBMITTED", errors: true, noHistory: true, name: "Listing review — incomplete" }); } },
      { title: "Under review", note: "Pending submissions are locked; Withdraw to make changes.", build: function () { return reviewPage({ state: "UNDER_REVIEW", name: "Listing review — under review" }); } },
      { title: "Business not verified", note: "Warning links to business verification; submit disabled.", build: function () { return reviewPage({ state: "NOT_SUBMITTED", unverified: true, noHistory: true, name: "Listing review — unverified" }); } }
    ] },
    { section: "Availability · /business/listings/[id]/availability", screens: [
      { title: "Availability calendar", note: "AvailabilityCalendarEditor. Room-type pills for accommodation; each day shows remaining/capacity or \"Set\". Up to 12 months ahead.", build: function () { return availabilityPage({}); } },
      { title: "Modal — edit a date", note: "Capacity, calculated remaining, optional price override.", build: function () { return availabilityPage({ modal: true, selected: 12 }); } }
    ] }
  ];
}

// ================= 06 GUIDES =================
const GUIDES = [["Moses Okwir", "DESTINATION SPECIALIST", 9, "English, Luganda, Swahili"], ["Grace Aciro", "GENERAL", 6, "English, Acholi"], ["Daniel Ssali", "GENERAL", 4, "English, Luganda"], ["Patience Kyomuhendo", "DESTINATION SPECIALIST", 11, "English, Runyankole, French"], ["Ronald Ssebunya", "GENERAL", 3, "English, Luganda"]];
function guidesPage(empty) {
  return screen(empty ? "Guides — empty" : "Guides", "Guides", function (cw) {
    const w = Math.floor((cw - 32) / 3);
    return [
      heroRow("Business portal", "Guides", "Manage guides that can be assigned to your tours.", btnRaw("Add guide", { icon: "plus" })),
      empty ? emptyState("No guides yet", "Add your first guide to assign them to tours.", { action: btn("Add guide", { variant: "secondary" }) }) :
        H({ gap: 16, wrap: true, rowGap: 16, w: cw }, GUIDES.map(function (g) {
          return card([V({ pad: 24, gap: 16, fillW: true }, [
            H({ gap: 12 }, [F({ w: 48, h: 48, radius: 24, fill: C.secondary, main: "center", cross: "center" }, [I("user", 24, C.muted)]), V({ gap: 2 }, [T(g[0], { size: 16, w: 600 }), T(g[1], { size: 12, color: C.muted })])]),
            V({ gap: 0 }, [T(g[2] + " years experience", { size: 14, color: C.muted }), T(g[3], { size: 14, color: C.muted })])
          ])], { w: w });
        }))
    ];
  }, { maxW: 1136 });
}
function newGuide() {
  return screen("Add a new guide", "Guides", function (cw) {
    return [breadcrumbs(["Guides", "Add guide"]), type.page("Add a new guide"), card([V({ pad: 24, gap: 16, fillW: true }, [
      f2("Full name", {}), V({ gap: 6, fillW: true }, [fieldLabel("Bio"), textarea({ h: 80 })]),
      fieldRow([f2("Years of experience", {}), f2("Hourly rate (UGX, optional)", {})]),
      f2("Languages (comma separated)", { placeholder: "English, Swahili, Luganda..." }),
      f2("Photo URL (optional)", {}),
      f2("Specialization", { value: "General Guide", select: true }),
      fieldRow([f2("Destination (optional)", { value: "No specific destination", select: true }), f2("Availability note (optional)", { placeholder: "e.g. Weekdays only, book 3 days ahead" })]),
      V({ gap: 8 }, [checkbox(false, "Has own vehicle", null, { w: 400 }), H({ opacity: 0.5 }, [checkbox(false, "Mark as Top Guide", null, { w: 400 })])])
    ])]), btn("Add Guide", { size: "lg" })];
  }, { maxW: 896 });
}
function flowGuides() {
  return [
    { section: "Guides · /business/guides", screens: [
      { title: "Guides — populated", note: "Guide cards: avatar or initials, specialization, years of experience, languages.", build: function () { return guidesPage(false); } },
      { title: "Guides — empty", note: "EmptyState with Add guide.", build: function () { return guidesPage(true); } }
    ] },
    { section: "Add guide · /business/guides/new", screens: [
      { title: "Add a new guide", note: "Top Guide is disabled: status is assigned by SafariNexa.", build: newGuide }
    ] }
  ];
}

// ================= 07 BOOKINGS =================
const BOOKINGS = [
  ["BK-2421", "Kibale Forest Edge Camp", "Joseph Byamukama", "+256 772 410 221", "12 Nov 2026", "2:00 pm", "AWAITING_BUSINESS_CONFIRMATION", "UGX 700,000"],
  ["BK-2417", "Murchison River Lodge", "Sarah Nakimuli", "+256 701 228 904", "9 Nov 2026", "2:00 pm", "AWAITING_BUSINESS_CONFIRMATION", "UGX 840,000"],
  ["BK-2409", "Lake Bunyonyi Eco Lodge", "Irene Namuli", "No phone provided", "7 Nov 2026", "2:00 pm", "CONFIRMED", "UGX 620,000"],
  ["BK-2398", "Murchison River Lodge", "Emmanuel Kato", "+256 752 118 330", "1 Nov 2026", "2:00 pm", "REFUND_REQUESTED", "UGX 460,000"],
  ["BK-2384", "Kampala Boutique Stay", "Florence Achen", "+256 783 990 145", "28 Oct 2026", "2:00 pm", "COMPLETED", "UGX 360,000"],
  ["BK-2371", "Kibale Forest Edge Camp", "Robert Wasswa", "+256 704 662 018", "22 Oct 2026", "2:00 pm", "CANCELLED_BY_CUSTOMER", "UGX 430,000"],
  ["BK-2360", "Murchison River Lodge", "Peter Tumusiime", "+256 772 004 991", "18 Oct 2026", "2:00 pm", "PENDING_PAYMENT", "UGX 580,000"]
];
function statusSelect(value, open) {
  return H({ name: "PortalSelectFilter", gap: 8 }, [T("Booking status", { size: 14, w: 500, color: C.s600 }), inputBox({ value: value || "All bookings (24)", select: true, w: 280, h: 36, focus: open })]);
}
function bookingsPage(o) {
  o = o || {};
  return screen(o.name || "Bookings", "Bookings", function (cw) {
    const rows = o.empty ? [] : BOOKINGS.map(function (b) {
      return [
        linkText(b[0], { color: C.fg, underline: false }),
        H({ gap: 12 }, [F({ w: 40, h: 40, radius: 8, fill: C.s100 }), V({ gap: 0 }, [T(b[1], { size: 14, color: C.s700 }), T(b[0], { size: 12, color: C.s500 })])]),
        V({ gap: 0 }, [T(b[2], { size: 14, color: C.s700 }), T(b[3], { size: 12, color: C.s500 })]),
        V({ gap: 0 }, [T(b[4], { size: 14, color: C.s700 }), T(b[5], { size: 12, color: C.s500 })]),
        sb("booking", b[6], "table"),
        b[7],
        H({ name: "Booking actions", w: 32, h: 32, radius: 8, stroke: C.border, main: "center" }, [I("more-horizontal", 16, C.s600)])
      ];
    });
    return [
      heroRow("Business portal", "Bookings", "Handle booking requests and confirmations.", H({ gap: 12 }, [toolBtn("Export", "download"), btn("Calendar view", { variant: "outline" })])),
      statGrid([
        { label: "Awaiting confirmation", value: o.empty ? "0" : "2", desc: "Requests needing a response", icon: "clock", action: "View requests" },
        { label: "Confirmed", value: o.empty ? "0" : "6", desc: "Currently confirmed bookings", icon: "check", action: "View bookings" },
        { label: "Completed", value: o.empty ? "0" : "11", desc: "Includes bookings awaiting or receiving a review", icon: "calendar-check", action: "View bookings" },
        { label: "Cancelled", value: o.empty ? "0" : "3", desc: "Cancelled by customers, businesses or admins", icon: "x", action: "View bookings" },
        { label: "Confirmed booking value", value: o.empty ? "UGX 0" : "UGX 9,840,000", desc: "Confirmed and completed bookings · all time", icon: "banknote", help: true }
      ], cw, 5),
      H({ fillW: true, main: "between", pb: 16, stroke: C.border, sides: { b: 1 } }, [statusSelect(o.filter, o.selectOpen), searchBox("Reference, listing or customer…", { value: o.q, w: 320 })]),
      o.empty ? emptyState("No bookings found", "No bookings match your search and status. Try another status or clear the search.") :
        table([{ label: "Reference", weight: 1, help: true }, { label: "Listing", weight: 2.6 }, { label: "Customer", weight: 1.8 }, { label: "Date", weight: 1.2 }, { label: "Status", weight: 1.6, help: true }, { label: "Total", weight: 1.2, align: "right" }, { label: "Actions", weight: 0.8, align: "right" }], rows, { w: cw, footer: tableFooter("Showing 1 to 7 of 24 bookings", 1, 4) })
    ];
  }, { maxW: 1136 });
}
function bookingFilterMenu() {
  const opts = [["All bookings", 24], ["Needs your confirmation", 2], ["Confirmed", 6], ["Awaiting customer payment", 1], ["Payment processing", 0], ["Payment failed", 0], ["Completed", 11], ["Cancelled", 3], ["Refunds", 1], ["Support needed", 0]];
  return menu(opts.map(function (o, i) { return { text: o[0] + " (" + o[1] + ")", check: i === 0, hover: i === 1 }; }), { w: 280 });
}
function bookingDetail(o) {
  o = o || {};
  const st = o.status || "AWAITING_BUSINESS_CONFIRMATION";
  return screen(o.name || "Booking detail", "Bookings", function (cw) {
    const side = 360, main = cw - side - 32;
    const chat = card([cardHeader("Messages about this booking"), cardContent([
      V({ fillW: true, gap: 12, pad: 16, radius: 12, fill: C.chatBg }, [
        H({ fillW: true }, [V({ px: 14, py: 10, radius: 16, fill: C.white, stroke: C.border, w: 360 }, [T("Hello! Could we get an early check-in around noon?", { size: 14, fillW: true })])]),
        H({ fillW: true, main: "end" }, [V({ px: 14, py: 10, radius: 16, fill: C.chat, w: 360 }, [T("Yes, noon works. We'll have the banda ready.", { size: 14, color: C.white, fillW: true })])])
      ]),
      H({ gap: 8, fillW: true }, [inputBox({ placeholder: "Write a message…" }), btnRaw("", { icon: "send", w: 44, px: 0 })])
    ])]);
    const actions = st === "AWAITING_BUSINESS_CONFIRMATION" ? [btn(o.instant ? "Confirm booking" : "Accept request — ask customer to pay", { size: "lg", fillW: true }), btn("Decline booking", { variant: "destructive", fillW: true })]
      : st === "PENDING_PAYMENT" ? [btn("Withdraw accepted request", { variant: "outline", fillW: true })]
      : [T("No action needed on this booking right now.", { size: 12, color: C.muted, align: "center", fillW: true })];
    return [
      o.complete ? btn("Mark service completed") : null,
      breadcrumbs(["Bookings", "BK-2417"]),
      o.transport ? V({ fillW: true, pad: 16, radius: 4, stroke: C.border, gap: 12 }, [T("Assign / update transfer driver and vehicle", { size: 14, w: 600 }), fieldRow([f2("Driver name", { value: "Peter Ochola" }), f2("Driver phone", { value: "+256 772 555 010" }), f2("Vehicle", { value: "Toyota Land Cruiser · UBA 123X" })]), btn("Save transfer details", { size: "sm" })]) : null,
      H({ gap: 32, fillW: true, cross: "start" }, [
        V({ w: main, gap: 0 }, [
          sb("booking", st), spacer(1, 8), type.page(o.transport ? "Entebbe Airport Transfer" : "Murchison River Lodge"), T("Booking BK-2417", { size: 14, color: C.muted }), spacer(1, 24),
          H({ gap: 16, fillW: true }, [kv("PARTICIPANTS", "2"), kv("START", "9 Nov 2026"), kv("END", "11 Nov 2026")]),
          spacer(1, 32), T("Room & add-ons", { size: 18, w: 600 }), spacer(1, 8),
          card([V({ pad: 24, gap: 8, fillW: true }, [T("Room: Riverside Banda · 1 Double Bed · Breakfast included", { size: 14 }), T("Add-on: Airport pickup — UGX 60,000", { size: 14 })])]),
          spacer(1, 32), card([cardHeader("Traveller details"), cardContent([H({ gap: 16, fillW: true }, [kv("Lead traveller", "Sarah Nakimuli"), kv("Nationality", "Ugandan"), kv("Emergency contact", "+256 701 000 111")])])]),
          spacer(1, 24), card([cardHeader("Booking progress & service details"), cardContent([T("Requested 2 Nov 2026 · respond by 6 Nov 2026 to avoid auto-cancellation.", { size: 14, color: C.muted, fillW: true }), T("Terms saved when this booking was requested", { size: 14, w: 600 }), T("Free cancellation up to 7 days before check-in.", { size: 14, color: C.muted })])]),
          spacer(1, 32), T("Customer", { size: 18, w: 600 }), spacer(1, 8),
          card([V({ pad: 24, gap: 8, fillW: true }, [T("Name: Sarah Nakimuli", { size: 14 }), T("Email: sarah.nakimuli@gmail.com", { size: 14 }), T("Phone: +256 701 228 904", { size: 14 })])]),
          o.paid ? V({ pt: 32, gap: 8, fillW: true }, [T("Payment history", { size: 18, w: 600 }), card([H({ pad: 24, fillW: true, main: "between" }, [T("MTN MOBILE MONEY · successful", { size: 14 }), T("UGX 840,000", { size: 14, w: 700 })])])]) : null,
          spacer(1, 32), chat
        ]),
        card([cardHeader("Booking summary"), cardContent([H({ fillW: true, main: "between" }, [T("Total", { size: 14, color: C.muted }), T("UGX 840,000", { size: 18, w: 700 })]), hr()].concat(actions), { gap: 12 })], { w: side })
      ])
    ];
  }, { maxW: 1136 });
}
function bookingCalendar(empty) {
  return screen(empty ? "Booking calendar — empty" : "Booking calendar", "Bookings", function (cw) {
    const rows = empty ? [] : [["9 Nov 2026", "Murchison River Lodge", "BK-2417", "AWAITING_BUSINESS_CONFIRMATION"], ["12 Nov 2026", "Kibale Forest Edge Camp", "BK-2421", "AWAITING_BUSINESS_CONFIRMATION"], ["14 Nov 2026", "Lake Bunyonyi Eco Lodge", "BK-2409", "CONFIRMED"], ["20 Nov 2026", "Kampala Boutique Stay", "BK-2430", "CONFIRMED"]].map(function (r) { return [r[0], r[1], r[2], sb("booking", r[3], "table")]; });
    return [linkText("Back to bookings"), type.page("Upcoming booking calendar"), T("Next 100 scheduled bookings, ordered by service date.", { size: 14 }), toolBtn("Export", "download"),
      empty ? T("No upcoming bookings.", { size: 14 }) : table([{ label: "Date" }, { label: "Listing", weight: 2 }, { label: "Booking" }, { label: "Status", weight: 1.4 }], rows, { w: cw })];
  }, { maxW: 1136 });
}
function flowBookings() {
  return [
    { section: "Bookings list · /business/bookings", screens: [
      { title: "Bookings — populated", note: "5 StatCards, one status select + search (counts follow the search), table with reference, listing, customer, service date, staff-perspective status and total.", build: function () { return bookingsPage({}); } },
      { title: "Status filter open", note: "PortalSelectFilter options from BUSINESS_BOOKING_FILTERS.", build: function () { return withOverlay(bookingsPage({ name: "Bookings — filter open", selectOpen: true }), bookingFilterMenu(), { anchor: "Select", noScrim: true }); } },
      { title: "Row menu", note: "View details · Message customer (→ /business/messages?bookingId=…).", build: function () { return withOverlay(bookingsPage({ name: "Bookings — row menu" }), menu([{ text: "View details" }, { text: "Message customer" }], { w: 160 }), { anchor: "Booking actions", noScrim: true, dx: -128 }); } },
      { title: "Bookings — no results", note: "EmptyState after a search with no matches.", build: function () { return bookingsPage({ empty: true, q: "BK-9999", name: "Bookings — no results" }); } }
    ] },
    { section: "Booking detail · /business/bookings/[id]", screens: [
      { title: "Request awaiting response", note: "Request-to-book: \"Accept request — ask customer to pay\" moves it to PENDING_PAYMENT; Decline cancels.", build: function () { return bookingDetail({}); } },
      { title: "Instant booking awaiting confirmation", note: "bookingMode INSTANT: the primary action reads \"Confirm booking\".", build: function () { return bookingDetail({ instant: true, name: "Booking detail — instant" }); } },
      { title: "Accepted — awaiting customer payment", note: "PENDING_PAYMENT on a request: Withdraw accepted request.", build: function () { return bookingDetail({ status: "PENDING_PAYMENT", name: "Booking detail — pending payment" }); } },
      { title: "Confirmed, service date passed", note: "\"Mark service completed\" appears once the end date has passed. Payment history listed.", build: function () { return bookingDetail({ status: "CONFIRMED", complete: true, paid: true, name: "Booking detail — complete service" }); } },
      { title: "Transport — assign driver", note: "Confirmed transport bookings show the driver and vehicle assignment form.", build: function () { return bookingDetail({ status: "CONFIRMED", transport: true, paid: true, name: "Booking detail — transport" }); } }
    ] },
    { section: "Calendar · /business/bookings/calendar", screens: [
      { title: "Upcoming booking calendar", note: "Table of the next 100 scheduled bookings with CSV export.", build: function () { return bookingCalendar(false); } },
      { title: "No upcoming bookings", note: "Empty text state.", build: function () { return bookingCalendar(true); } }
    ] }
  ];
}
