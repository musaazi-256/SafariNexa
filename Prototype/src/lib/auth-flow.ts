export type Surface = "customer" | "business" | "admin";

export type GoogleAuthDecision =
  | "existing_linked_account"
  | "existing_email_needs_provider_link"
  | "new_customer_profile"
  | "business_invitation"
  | "business_profile_required"
  | "business_verification_required"
  | "admin_allowed"
  | "admin_denied";

export function describeGoogleAuthDecision(surface: Surface, decision: GoogleAuthDecision) {
  const shared: Partial<Record<GoogleAuthDecision, string>> = {
    existing_linked_account: "Create session from existing SafariNexa user and linked Google provider.",
    existing_email_needs_provider_link:
      "Verify ownership of the existing email/password account, then link the Google provider.",
    new_customer_profile: "Create a lightweight customer profile from verified Google identity."
  };

  if (shared[decision]) return shared[decision];

  if (surface === "business") {
    const business: Partial<Record<GoogleAuthDecision, string>> = {
      business_invitation: "Accept invitation and attach Google provider to invited business user.",
      business_profile_required: "Create or join business profile before portal access.",
      business_verification_required: "Gate publishing/bookings/payouts until business verification is approved."
    };
    return business[decision] ?? "Unsupported business Google authentication decision.";
  }

  if (surface === "admin") {
    const admin: Partial<Record<GoogleAuthDecision, string>> = {
      admin_allowed: "Allow admin session only after DB allowlist, role, status, and permission checks.",
      admin_denied: "Deny unknown, suspended, inactive, or unassigned-role Google identities."
    };
    return admin[decision] ?? "Unsupported admin Google authentication decision.";
  }

  return "Unsupported decision for this surface.";
}
