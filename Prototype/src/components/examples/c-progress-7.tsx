import { Circle, CircleCheck } from "lucide-react";

import { Progress } from "@/components/ui/progress";

const steps = [
  { label: "Business basics", completed: true },
  { label: "Contact person", completed: true },
  { label: "Verification documents", completed: false },
  { label: "Admin review", completed: false }
];

/** ReUI c-progress-7 · Multi-step progress (business onboarding checklist). */
export function SetupProgress() {
  const done = steps.filter((s) => s.completed).length;
  return (
    <div className="w-full max-w-xs space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Business setup</span>
        <span className="text-xs text-muted-foreground">{done} of {steps.length} steps</span>
      </div>
      <Progress value={(done / steps.length) * 100} aria-label="Business setup progress" />
      <ul className="flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-2 text-sm">
            {step.completed ? <CircleCheck aria-hidden="true" className="h-4 w-4 text-success" /> : <Circle aria-hidden="true" className="h-4 w-4 text-muted-foreground" />}
            <span className={step.completed ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
            <span className="sr-only">{step.completed ? "(done)" : "(to do)"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
