import { describeGoogleAuthDecision, type GoogleAuthDecision, type Surface } from "@/lib/auth-flow";
import { Card, CardContent } from "@/components/ui/card";

const decisionsBySurface: Record<Surface, GoogleAuthDecision[]> = {
  customer: ["existing_linked_account", "existing_email_needs_provider_link", "new_customer_profile"],
  business: [
    "existing_linked_account",
    "existing_email_needs_provider_link",
    "business_invitation",
    "business_profile_required",
    "business_verification_required"
  ],
  admin: ["admin_allowed", "existing_email_needs_provider_link", "admin_denied"]
};

export function GoogleFlowPanel({ surface }: { surface: Surface }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {decisionsBySurface[surface].map((decision) => (
        <Card key={decision} className="border-dashed">
          <CardContent className="pt-5">
            <strong className="text-sm font-bold capitalize">{decision.replaceAll("_", " ")}</strong>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {describeGoogleAuthDecision(surface, decision)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
