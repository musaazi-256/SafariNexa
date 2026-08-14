import type { Metadata } from "next";

import { OnboardingWizard } from "@/components/business/onboarding-wizard";

export const metadata: Metadata = {
  title: "Business Onboarding",
  description: "Set up your business profile to start accepting bookings on SafariNexa.",
};

export default function BusinessOnboardingPage() {
  return <OnboardingWizard />;
}
