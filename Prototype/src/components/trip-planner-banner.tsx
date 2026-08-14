import Link from "next/link";
import { Building2, Car, Compass, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";

const STEPS = [
  { label: "Stay", icon: Building2 },
  { label: "Safari", icon: Compass },
  { label: "Food", icon: UtensilsCrossed },
  { label: "Transport", icon: Car }
];

export function TripPlannerBanner() {
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-green to-[#062617] p-8 text-white sm:p-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">Plan a full trip, not just one booking</h2>
          <p className="mt-2 max-w-lg text-white/85">
            Browse verified stays, safaris, restaurants, and rides across Uganda. Compare freely — you only need an
            account when you&apos;re ready to book.
          </p>
          <Button asChild variant="secondary" size="lg" className="mt-6">
            <Link href="/trip-planner">Start planning your trip</Link>
          </Button>
        </div>

        <div className="flex items-center">
          {STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold">{step.label}</span>
              </div>
              {index < STEPS.length - 1 ? <span className="mx-2 mb-5 h-px w-8 border-t border-dashed border-white/40 sm:w-12" /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
