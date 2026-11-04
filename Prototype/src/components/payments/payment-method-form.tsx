"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { CreditCard, Globe, Smartphone, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PAYMENT_METHODS } from "@/lib/payments";

const METHOD_ICONS: Record<string, typeof Smartphone> = {
  mtn: Smartphone,
  airtel: Smartphone,
  card: CreditCard,
  stripe: Globe
};

function SubmitButton({ payLabel, enabled }: { payLabel: string; enabled:boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      loading={pending} loadingText="Processing payment…" disabled={!enabled}
      className="mt-6 w-full bg-[#0d5932] hover:bg-[#0a4526] text-white font-medium rounded-full h-12 text-base shadow-sm gap-2"
    >
      <Lock aria-hidden="true" className="h-4 w-4" /><span>{payLabel}</span>
    </Button>
  );
}

export function PaymentMethodForm({
  bookingId,
  orderId,
  payLabel,
  cardholderDefault,
  demo = false,
  enabled = false,
  action
}: {
  bookingId?: string;
  orderId?: string;
  payLabel: string;
  cardholderDefault?: string;
  demo?: boolean;
  enabled?: boolean;
  action: (formData: FormData) => void;
}) {
  const [method, setMethod] = React.useState(demo ? PAYMENT_METHODS[0].value : "stripe");
  const selected = PAYMENT_METHODS.find((item) => item.value === method) ?? PAYMENT_METHODS[0];

  return (
    <form action={action} className="flex flex-col gap-4">
      {bookingId && <input type="hidden" name="bookingId" value={bookingId} />}
      {orderId && <input type="hidden" name="orderId" value={orderId} />}

      <div className="flex flex-col gap-2.5">
        {PAYMENT_METHODS.filter(item=>demo || item.value === "stripe").map((item) => {
          const Icon = METHOD_ICONS[item.value];
          const isChecked = method === item.value;
          return (
            <label
              key={item.value}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 text-sm transition-all ${
                isChecked
                  ? "border-[#0d5932] bg-[#0d5932]/5 shadow-sm"
                  : "border-border hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <input
                  type="radio"
                  name="method"
                  value={item.value}
                  checked={isChecked}
                  onChange={() => setMethod(item.value)}
                  className="h-4 w-4 text-[#0d5932] focus:ring-[#0d5932]"
                  required
                />
                <Icon className={`h-5 w-5 ${isChecked ? "text-[#0d5932]" : "text-slate-400"}`} />
                <div>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500 font-medium">{demo ? (item.kind === "mobile_money" ? "Pay with your mobile money account" : "Pay with your card") : item.helper}</p>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <Separator className="my-2" />

      {demo && (selected.kind === "mobile_money" ? (
        <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 border border-border">
          <Label htmlFor="phone" className="font-medium text-slate-900">
            Mobile money number (optional)
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="e.g. 077X XXX XXX or 070X XXX XXX"
            className="h-11 rounded-xl bg-white"
          />
          <p className="text-xs text-slate-500 font-medium">
            No payment is sent. This field is only for previewing the mobile money prompt.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 border border-border">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-900"><CreditCard className="h-5 w-5 text-[#0d5932]"/>Card payment simulation</div>
          <p className="text-xs text-slate-500 font-medium">No card details are collected. Choose the simulated result below to demonstrate authorization.</p>
        </div>
      ))}
      {demo ? <label className="text-xs font-medium text-slate-500">Simulation result<select name="outcome" className="form-control mt-2 w-full"><option value="success">Payment succeeds</option><option value="failed">Payment is declined</option></select></label> : <p className="text-sm text-slate-500 leading-relaxed">{enabled ? "Continue to secure hosted card checkout." : "Online payments are not configured."}</p>}

      <SubmitButton payLabel={payLabel} enabled={enabled} />
    </form>
  );
}
