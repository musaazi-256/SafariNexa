"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * ReUI Stepper API (Tailwind 3 port, no Base UI dependency).
 * Interactive when onValueChange is passed (steps become tabs with arrow-key navigation);
 * otherwise a read-only progress display (e.g. onboarding or booking progress).
 */
type Orientation = "horizontal" | "vertical";
type StepState = "active" | "completed" | "inactive";
type Indicators = { active?: React.ReactNode; completed?: React.ReactNode; inactive?: React.ReactNode; loading?: React.ReactNode };

const StepperContext = React.createContext<{ activeStep: number; setActiveStep?: (step: number) => void; orientation: Orientation; indicators: Indicators; id: string } | null>(null);
const StepItemContext = React.createContext<{ step: number; state: StepState; disabled: boolean; loading: boolean } | null>(null);

function useStepper() {
  const ctx = React.useContext(StepperContext);
  if (!ctx) throw new Error("Stepper parts must be used within <Stepper>.");
  return ctx;
}
function useStepItem() {
  const ctx = React.useContext(StepItemContext);
  if (!ctx) throw new Error("Step parts must be used within <StepperItem>.");
  return ctx;
}

function Stepper({ value, defaultValue = 1, onValueChange, orientation = "horizontal", indicators = {}, className, ...props }: React.ComponentProps<"div"> & { value?: number; defaultValue?: number; onValueChange?: (value: number) => void; orientation?: Orientation; indicators?: Indicators }) {
  const [internal, setInternal] = React.useState(defaultValue);
  const id = React.useId();
  const activeStep = value ?? internal;
  const setActiveStep = onValueChange ? (step: number) => { if (value === undefined) setInternal(step); onValueChange(step); } : undefined;
  return (
    <StepperContext.Provider value={{ activeStep, setActiveStep, orientation, indicators, id }}>
      <div data-slot="stepper" data-orientation={orientation} className={cn("w-full", className)} {...props} />
    </StepperContext.Provider>
  );
}

function StepperNav({ className, ...props }: React.ComponentProps<"nav">) {
  const { orientation, setActiveStep } = useStepper();
  return (
    <nav aria-label="Progress" data-slot="stepper-nav" data-orientation={orientation}>
      <ol role={setActiveStep ? "tablist" : undefined} aria-orientation={setActiveStep ? orientation : undefined} className={cn("group/stepper-nav flex", orientation === "horizontal" ? "w-full flex-row" : "flex-col", className)} data-orientation={orientation} {...(props as React.ComponentProps<"ol">)} />
    </nav>
  );
}

function StepperItem({ step, completed = false, disabled = false, loading = false, className, ...props }: React.ComponentProps<"li"> & { step: number; completed?: boolean; disabled?: boolean; loading?: boolean }) {
  const { activeStep, orientation } = useStepper();
  const state: StepState = completed || step < activeStep ? "completed" : step === activeStep ? "active" : "inactive";
  return (
    <StepItemContext.Provider value={{ step, state, disabled, loading: loading && step === activeStep }}>
      <li
        data-slot="stepper-item"
        data-state={state}
        aria-current={state === "active" ? "step" : undefined}
        className={cn("group/step flex items-center [&:not(:last-child)]:flex-1", orientation === "horizontal" ? "flex-row" : "flex-col", className)}
        {...props}
      />
    </StepItemContext.Provider>
  );
}

function StepperTrigger({ className, children, ...props }: React.ComponentProps<"button">) {
  const { activeStep, setActiveStep, id } = useStepper();
  const { step, state, disabled } = useStepItem();
  const classes = cn("inline-flex items-center gap-2.5 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60", className);
  if (!setActiveStep) return <div data-slot="stepper-trigger" data-state={state} className={classes}>{children}</div>;
  return (
    <button
      type="button"
      role="tab"
      id={`${id}-tab-${step}`}
      aria-selected={activeStep === step}
      aria-controls={`${id}-panel-${step}`}
      tabIndex={activeStep === step ? 0 : -1}
      data-slot="stepper-trigger"
      data-state={state}
      disabled={disabled}
      className={classes}
      onClick={() => setActiveStep(step)}
      onKeyDown={(event) => {
        const tabs = [...(event.currentTarget.closest("[role=tablist]")?.querySelectorAll<HTMLButtonElement>("[role=tab]:not(:disabled)") ?? [])];
        const at = tabs.indexOf(event.currentTarget);
        const go = (i: number) => { event.preventDefault(); tabs[(i + tabs.length) % tabs.length]?.focus(); };
        if (event.key === "ArrowRight" || event.key === "ArrowDown") go(at + 1);
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") go(at - 1);
        else if (event.key === "Home") go(0);
        else if (event.key === "End") go(tabs.length - 1);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function StepperIndicator({ className, children }: React.ComponentProps<"div">) {
  const { indicators } = useStepper();
  const { state, loading } = useStepItem();
  const custom = loading ? indicators.loading : indicators[state];
  return (
    <div
      data-slot="stepper-indicator"
      data-state={state}
      className={cn(
        "relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold",
        "data-[state=inactive]:bg-secondary data-[state=inactive]:text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:bg-primary data-[state=completed]:text-primary-foreground",
        className
      )}
    >
      {custom ?? children}
    </div>
  );
}

function StepperSeparator({ className }: React.ComponentProps<"div">) {
  const { orientation } = useStepper();
  const { state } = useStepItem();
  return <div aria-hidden="true" data-slot="stepper-separator" data-state={state} className={cn("m-0.5 rounded-sm bg-border data-[state=completed]:bg-primary", orientation === "horizontal" ? "h-0.5 flex-1" : "h-12 w-0.5", className)} />;
}

function StepperTitle({ className, ...props }: React.ComponentProps<"h3">) {
  const { state } = useStepItem();
  return <h3 data-slot="stepper-title" data-state={state} className={cn("text-sm font-medium leading-none", className)} {...props} />;
}

function StepperDescription({ className, ...props }: React.ComponentProps<"div">) {
  const { state } = useStepItem();
  return <div data-slot="stepper-description" data-state={state} className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

function StepperPanel({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="stepper-panel" className={cn("w-full", className)} {...props} />;
}

function StepperContent({ value, forceMount = false, className, children, ...props }: React.ComponentProps<"div"> & { value: number; forceMount?: boolean }) {
  const { activeStep, id, setActiveStep } = useStepper();
  const active = value === activeStep;
  if (!active && !forceMount) return null;
  return (
    <div role={setActiveStep ? "tabpanel" : undefined} id={`${id}-panel-${value}`} aria-labelledby={setActiveStep ? `${id}-tab-${value}` : undefined} hidden={!active} data-slot="stepper-content" className={cn("w-full", className)} {...props}>
      {children}
    </div>
  );
}

export { Stepper, StepperContent, StepperDescription, StepperIndicator, StepperItem, StepperNav, StepperPanel, StepperSeparator, StepperTitle, StepperTrigger };
