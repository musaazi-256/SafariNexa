"use client";

import * as React from "react";
import BasePhoneInput, { getCountryCallingCode, type Country, type Value } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * ReUI PhoneInput (Tailwind 3 port). Country picker + formatted number.
 * The country picker is a native <select> (keyboard and mobile friendly) instead of ReUI's combobox.
 * Pass `name` to submit the E.164 value (e.g. +256772123456) with a server-action form.
 */
type PhoneInputProps = Omit<React.ComponentProps<"input">, "onChange" | "value" | "defaultValue" | "ref"> & {
  value?: string;
  defaultValue?: string;
  onChange?: (value: Value | "") => void;
  defaultCountry?: Country;
  invalid?: boolean;
};

/**
 * Turn stored numbers like "0772 123 456", "256772123456" or "+256 772-123-456" into E.164
 * ("+256772123456"). Local numbers starting with 0 are read as Ugandan. Unknown shapes give "".
 */
function toE164(raw: string | null | undefined, countryCode = "256"): string {
  const compact = (raw ?? "").replace(/[\s().-]/g, "");
  if (!compact) return "";
  const e164 = compact.startsWith("+") ? compact : compact.startsWith("00") ? `+${compact.slice(2)}` : compact.startsWith("0") ? `+${countryCode}${compact.slice(1)}` : compact.startsWith(countryCode) ? `+${compact}` : "";
  return /^\+\d{7,15}$/.test(e164) ? e164 : "";
}

function PhoneInput({ value, defaultValue, onChange, defaultCountry = "UG", name, invalid, className, readOnly, disabled, ...props }: PhoneInputProps) {
  const [internal, setInternal] = React.useState<string>(() => toE164(defaultValue, getCountryCallingCode(defaultCountry)));
  const current = value !== undefined ? toE164(value, getCountryCallingCode(defaultCountry)) : internal;
  // In international mode the box always shows "+256", which would satisfy `required` with no number.
  // Validate the real value instead, so the browser blocks submit until a number is entered.
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    wrapperRef.current?.querySelector<HTMLInputElement>("[data-slot=phone-input-number]")?.setCustomValidity(props.required && !current ? "Enter a phone number." : "");
  }, [current, props.required]);
  return (
    <div ref={wrapperRef} data-slot="phone-input" className={cn("w-full", className)}>
      <BasePhoneInput
        className={cn(
          "flex h-11 w-full items-stretch overflow-hidden rounded-xl border bg-white transition-shadow focus-within:ring-2",
          invalid ? "border-destructive focus-within:ring-destructive/20" : "border-input focus-within:border-primary focus-within:ring-ring/30",
          (disabled || readOnly) && "bg-muted/40"
        )}
        international
        defaultCountry={defaultCountry}
        value={current || undefined}
        onChange={(next) => { if (value === undefined) setInternal(next ?? ""); onChange?.(next ?? ""); }}
        countrySelectComponent={CountrySelect}
        inputComponent={NumberInput}
        flags={flags}
        readOnly={readOnly}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...props}
      />
      {name ? <input type="hidden" name={name} value={current} /> : null}
    </div>
  );
}

const NumberInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => (
  <input ref={ref} data-slot="phone-input-number" className={cn("min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm", className)} {...props} />
));
NumberInput.displayName = "PhoneNumberInput";

type CountrySelectProps = {
  value?: Country;
  onChange: (country?: Country) => void;
  options: Array<{ value?: Country; label: string; divider?: boolean }>;
  disabled?: boolean;
  readOnly?: boolean;
};

function CountrySelect({ value, onChange, options, disabled, readOnly }: CountrySelectProps) {
  const Flag = value ? flags[value] : undefined;
  return (
    <div className="relative flex shrink-0 items-center gap-1.5 border-r border-input bg-muted/30 pl-3 pr-2">
      <span aria-hidden="true" className="flex h-4 w-6 overflow-hidden rounded-sm bg-muted [&>svg]:h-full [&>svg]:w-full">{Flag ? <Flag title="" /> : null}</span>
      <span aria-hidden="true" className="text-sm tabular-nums text-muted-foreground">{value ? `+${getCountryCallingCode(value)}` : ""}</span>
      {readOnly ? null : <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />}
      <select
        aria-label="Country calling code"
        value={value ?? ""}
        disabled={disabled || readOnly}
        onChange={(event) => onChange((event.target.value || undefined) as Country | undefined)}
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-default"
      >
        {options.filter((option) => !option.divider && option.value).map((option) => (
          <option key={option.value} value={option.value}>{option.label} (+{getCountryCallingCode(option.value!)})</option>
        ))}
      </select>
    </div>
  );
}

export { PhoneInput, toE164 };
