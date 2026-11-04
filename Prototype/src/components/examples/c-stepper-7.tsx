"use client";

import { useState } from "react";
import { Check, CreditCard, Loader2, Lock, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stepper, StepperContent, StepperIndicator, StepperItem, StepperNav, StepperPanel, StepperSeparator, StepperTitle, StepperTrigger } from "@/components/ui/stepper";

const steps = [
  { title: "Traveller details", icon: <UserRound className="h-4 w-4" /> },
  { title: "Payment", icon: <CreditCard className="h-4 w-4" /> },
  { title: "Confirmation", icon: <Lock className="h-4 w-4" /> }
];

/** ReUI c-stepper-7 · Stepper with icons and status badges (checkout flow). */
export function CheckoutStepper() {
  const [current, setCurrent] = useState(2);
  return (
    <Stepper value={current} onValueChange={setCurrent} indicators={{ completed: <Check className="h-3.5 w-3.5" />, loading: <Loader2 className="h-3.5 w-3.5 animate-spin" /> }} className="w-full max-w-xl space-y-8">
      <StepperNav className="gap-3">
        {steps.map((step, index) => (
          <StepperItem key={step.title} step={index + 1} className="relative flex-1 items-start">
            <StepperTrigger className="flex grow flex-col items-start gap-2.5">
              <StepperIndicator className="h-8 w-8 border-2 border-transparent data-[state=inactive]:border-border data-[state=inactive]:bg-transparent data-[state=completed]:bg-success">{step.icon}</StepperIndicator>
              <div className="flex flex-col items-start gap-1">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Step {index + 1}</div>
                <StepperTitle className="text-base font-semibold group-data-[state=inactive]/step:text-muted-foreground">{step.title}</StepperTitle>
                <Badge variant="default" className="hidden group-data-[state=active]/step:inline-flex">In progress</Badge>
                <Badge variant="success" className="hidden group-data-[state=completed]/step:inline-flex">Completed</Badge>
                <Badge variant="secondary" className="hidden text-muted-foreground group-data-[state=inactive]/step:inline-flex">Pending</Badge>
              </div>
            </StepperTrigger>
            {index < steps.length - 1 ? <StepperSeparator className="absolute left-10 right-0 top-4 m-0 w-[calc(100%-2.75rem)] flex-none group-data-[state=completed]/step:bg-success" /> : null}
          </StepperItem>
        ))}
      </StepperNav>
      <StepperPanel className="text-sm">
        {steps.map((step, index) => <StepperContent key={step.title} value={index + 1} className="flex items-center justify-center rounded-xl border border-dashed border-border p-6">{step.title} form</StepperContent>)}
      </StepperPanel>
      <div className="flex items-center justify-between gap-2.5">
        <Button variant="outline" onClick={() => setCurrent((s) => s - 1)} disabled={current === 1}>Previous</Button>
        <Button variant="outline" onClick={() => setCurrent((s) => s + 1)} disabled={current === steps.length}>Next</Button>
      </div>
    </Stepper>
  );
}
