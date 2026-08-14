import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Set up your business - SafariNexa",
  description: "Begin your onboarding to become a partner on SafariNexa.",
};

const ONBOARDING_STEPS = [
  {
    num: 1,
    title: "Business basics",
    description: "Business name, category, contact details",
    isActive: true,
  },
  {
    num: 2,
    title: "Profile details",
    description: "Location, services, operating regions",
    isActive: false,
  },
  {
    num: 3,
    title: "Verification",
    description: "Documents and ownership review",
    isActive: false,
  },
  {
    num: 4,
    title: "Submit for review",
    description: "Admin review before publishing",
    isActive: false,
  },
];

export default function OnboardingIntroPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:gap-24 py-10 lg:py-20">
      {/* Left side content */}
      <div className="flex-1 space-y-8">
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Set up your SafariNexa business profile
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-lg">
          Create your provider account, add business details, and prepare verification so travelers can book with confidence.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button asChild size="lg" className="bg-[#0f6b40] hover:bg-[#0a5230] text-white px-8 rounded-lg h-12">
            <Link href="/business/onboarding/setup">
              Begin onboarding
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="text-[#0f6b40] hover:text-[#0a5230] hover:bg-[#0f6b40]/10 px-8 rounded-lg h-12 font-medium">
            <Link href="/business/requirements">
              Learn requirements
            </Link>
          </Button>
        </div>
      </div>

      {/* Right side card */}
      <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
        <Card className="rounded-[32px] border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white p-4 sm:p-8">
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl font-bold text-slate-900">Onboarding steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {ONBOARDING_STEPS.map((step) => (
              <div key={step.num} className="flex gap-4">
                <div 
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    step.isActive 
                      ? "bg-[#0f6b40] text-white" 
                      : "bg-[#f5f0e1] text-[#0f6b40]"
                  }`}
                >
                  {step.num}
                </div>
                <div className="flex flex-col pt-1">
                  <span className="text-base font-semibold text-slate-900">{step.title}</span>
                  <span className="text-sm text-slate-500 mt-1">{step.description}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
