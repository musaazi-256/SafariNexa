import { PhoneInput } from "@/components/ui/phone-input";

/** ReUI c-phone-input-8 · Read-only phone input (e.g. a verified contact number). */
export function PhoneInputReadOnly() {
  return <PhoneInput readOnly value="+256772123456" aria-label="Business phone" className="max-w-xs" />;
}
