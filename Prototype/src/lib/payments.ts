import type { PaymentProvider } from "@prisma/client";

export type PaymentMethodKind = "mobile_money" | "card";

export type PaymentMethodConfig = {
  value: string;
  label: string;
  helper: string;
  provider: PaymentProvider;
  kind: PaymentMethodKind;
};

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    value: "mtn",
    label: "MTN Mobile Money",
    helper: "Pay via MTN MoMo prompt on your phone",
    provider: "MTN_MOBILE_MONEY",
    kind: "mobile_money"
  },
  {
    value: "airtel",
    label: "Airtel Money",
    helper: "Pay via Airtel Money prompt on your phone",
    provider: "AIRTEL_MONEY",
    kind: "mobile_money"
  },
  {
    value: "card",
    label: "Visa / Mastercard",
    helper: "Local card payment, via Flutterwave",
    provider: "CARD",
    kind: "card"
  },
  {
    value: "stripe",
    label: "International card",
    helper: "Pay with Stripe — best for cards issued outside East Africa",
    provider: "STRIPE",
    kind: "card"
  }
];

export function kindForProvider(provider: PaymentProvider): PaymentMethodKind {
  return provider === "MTN_MOBILE_MONEY" || provider === "AIRTEL_MONEY" ? "mobile_money" : "card";
}

/** "•••• 1234" from either a phone number or a card number — same masked shape for both,
 * matching how most receipts show a payment reference without exposing the full value. */
export function maskLast4(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "");
  const last4 = digits.slice(-4) || "0000";
  return `•••• ${last4}`;
}

export function processingMessageFor(provider: PaymentProvider, maskedReference: string | null) {
  if (kindForProvider(provider) === "mobile_money") {
    return `Confirm the prompt sent to your phone (${maskedReference ?? "on file"}).`;
  }
  return `Verifying your card (${maskedReference ?? "on file"})...`;
}

export function simulatedFailureReasonFor(provider: PaymentProvider) {
  return kindForProvider(provider) === "mobile_money"
    ? "No confirmation received on your phone — request timed out."
    : "Card declined by issuing bank.";
}
