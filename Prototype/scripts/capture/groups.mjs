// Figma page groups per portal, in the same order and wording as the hand-built
// SafariNexa plugins (design/figma-admin-portal, design/figma-business-portal), so
// the captured files read the same. Each route pattern belongs to one group; a
// page that matches none appears under "Detected automatically · not yet grouped".
// `shell: true` collects the header, sidebar and account menus.
// `legacy` lists the pages the hand-built plugin generates; the captured plugin
// removes them (they are superseded), except "00 · Design system", which it keeps.

const OLD_ADMIN = ["Authentication & access", "Portal shell & navigation", "Dashboard", "Businesses", "Business verification", "Listing reviews", "Bookings", "Payments, refunds & payouts", "Users & access", "Roles & permissions", "Reviews moderation", "Support", "Audit trail", "Notifications", "Settings", "Profile & sign out"];
const OLD_BUSINESS = ["Entry & sign in", "Onboarding", "Portal shell & navigation", "Overview", "Listings", "Guides", "Bookings", "Messages", "Reviews", "Earnings", "Notifications", "Settings & staff access", "Verification & documents"];
const legacy = (names) => ["00 · Cover & flow map", ...names.map((n, i) => String(i + 1).padStart(2, "0") + " · " + n)];

export const GROUPS = {
  admin: {
    eyebrow: "SafariNexa Admin Portal",
    cover: "Admin Portal — complete UI",
    legacy: legacy(OLD_ADMIN),
    entry: "Entry: /admin/login → (Google callback | email) → /admin/dashboard. Sidebar reaches every flow; dashboard cards deep-link into Businesses, Verification, Bookings, Payments, Support and Audit.",
    groups: [
      { id: "01", name: "Authentication & access", routes: ["/admin/login", "/admin/auth/accept", "/admin/auth/access-denied"] },
      { id: "02", name: "Portal shell & navigation", routes: [], shell: true },
      { id: "03", name: "Dashboard", routes: ["/admin/dashboard"] },
      { id: "04", name: "Businesses", routes: ["/admin/businesses", "/admin/businesses/[id]"] },
      { id: "05", name: "Business verification", routes: ["/admin/verification", "/admin/verification/[id]"] },
      { id: "06", name: "Listing reviews", routes: ["/admin/listings", "/admin/listings/[id]"] },
      { id: "07", name: "Bookings", routes: ["/admin/bookings", "/admin/bookings/[id]"] },
      { id: "08", name: "Payments, refunds & payouts", routes: ["/admin/payments"] },
      { id: "09", name: "Users & access", routes: ["/admin/users", "/admin/users/new"] },
      { id: "10", name: "Roles & permissions", routes: ["/admin/roles", "/admin/roles/new"] },
      { id: "11", name: "Reviews moderation", routes: ["/admin/reviews"] },
      { id: "12", name: "Support", routes: ["/admin/support", "/admin/support/[id]"] },
      { id: "13", name: "Audit trail", routes: ["/admin/audit"] },
      { id: "14", name: "Notifications", routes: ["/admin/notifications"] },
      { id: "15", name: "Settings", routes: ["/admin/settings"] },
      { id: "16", name: "Profile & sign out", routes: ["/admin/profile"] },
    ],
  },
  business: {
    eyebrow: "SafariNexa Business Portal",
    cover: "Business Portal — complete UI",
    legacy: legacy(OLD_BUSINESS),
    entry: "Entry: /business → sign in (Google | email | invitation) → onboarding for new businesses → /business/dashboard. The sidebar reaches every flow; the business switcher changes which business is managed.",
    groups: [
      { id: "01", name: "Entry & sign in", routes: ["/business", "/business/auth/sign-in", "/business/auth/accept"] },
      { id: "02", name: "Onboarding", routes: ["/business/onboarding", "/business/onboarding/setup"] },
      { id: "03", name: "Portal shell & navigation", routes: [], shell: true },
      { id: "04", name: "Overview", routes: ["/business/dashboard"] },
      { id: "05", name: "Listings", routes: ["/business/listings", "/business/listings/new", "/business/listings/[id]/edit", "/business/listings/[id]/review", "/business/listings/[id]/availability"] },
      { id: "06", name: "Guides", routes: ["/business/guides", "/business/guides/new"] },
      { id: "07", name: "Bookings", routes: ["/business/bookings", "/business/bookings/[id]", "/business/bookings/calendar"] },
      { id: "08", name: "Messages", routes: ["/business/messages"] },
      { id: "09", name: "Reviews", routes: ["/business/reviews"] },
      { id: "10", name: "Earnings", routes: ["/business/revenue"] },
      { id: "11", name: "Notifications", routes: ["/business/notifications"] },
      { id: "12", name: "Settings & staff access", routes: ["/business/settings", "/business/profile", "/business/team"] },
      { id: "13", name: "Verification & documents", routes: ["/business/settings/verification", "/business/verification"] },
      // Pages added after the hand-built plugin.
      { id: "14", name: "Payments & refunds", routes: ["/business/payments"] },
      { id: "15", name: "Customers", routes: ["/business/customers"] },
      { id: "16", name: "Support", routes: ["/business/support", "/business/support/[id]"] },
    ],
  },
  customer: {
    eyebrow: "SafariNexa Customer Website",
    cover: "Customer Website — complete UI",
    legacy: [],
    entry: "Entry: / (home) → explore or search → a listing → reserve or add to cart → checkout → simulated payment → booking confirmed. Signing in is required only to book, save, review or message.",
    groups: [
      { id: "01", name: "Home & discovery", routes: ["/", "/explore", "/search", "/destinations", "/destinations/[slug]"] },
      { id: "02", name: "Site header & navigation", routes: [], shell: true },
      { id: "03", name: "Sign in & account access", routes: ["/auth/sign-in", "/auth/create-account", "/auth/verify", "/auth/success", "/auth/forgot-password", "/auth/reset-password"] },
      { id: "04", name: "Accommodation", routes: ["/accommodation", "/accommodation/[id]"] },
      { id: "05", name: "Tours", routes: ["/tours", "/tours/[id]"] },
      { id: "06", name: "Restaurants", routes: ["/restaurants", "/restaurants/[id]"] },
      { id: "07", name: "Transport", routes: ["/transport", "/transport/[id]"] },
      { id: "08", name: "Guides", routes: ["/guides", "/guides/[id]"] },
      { id: "09", name: "Trip planner", routes: ["/trip-planner", "/trip-planner/[id]"] },
      { id: "10", name: "Cart & checkout", routes: ["/cart", "/checkout", "/checkout/multi"] },
      { id: "11", name: "Payments & receipts", routes: ["/payments", "/payments/success", "/payments/cancelled", "/payments/receipt"] },
      { id: "12", name: "Bookings", routes: ["/bookings", "/bookings/[id]"] },
      { id: "13", name: "Saved", routes: ["/saved", "/profile/saved"] },
      { id: "14", name: "Reviews", routes: ["/reviews/new"] },
      { id: "15", name: "Messages & support", routes: ["/profile/messages", "/support", "/support/[id]"] },
      { id: "16", name: "Notifications", routes: ["/notifications"] },
      { id: "17", name: "Profile & settings", routes: ["/profile", "/profile/preferences", "/profile/payment-settings"] },
      { id: "18", name: "Safety", routes: ["/safety"] },
    ],
  },
};
