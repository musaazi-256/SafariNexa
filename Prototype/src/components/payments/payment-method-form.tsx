"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { CreditCard, Globe, Smartphone, Loader2, Lock } from "lucide-react";

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

function SubmitButton({ payLabel }: { payLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="mt-6 w-full bg-[#0d5932] hover:bg-[#0a4526] text-white font-bold rounded-full h-12 text-base shadow-sm gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Processing payment...</span>
        </>
      ) : (
        <>
          <Lock className="h-4 w-4" />
          <span>{payLabel}</span>
        </>
      )}
    </Button>
  );
}

export function PaymentMethodForm({
  bookingId,
  orderId,
  payLabel,
  cardholderDefault,
  action
}: {
  bookingId?: string;
  orderId?: string;
  payLabel: string;
  cardholderDefault?: string;
  action: (formData: FormData) => void;
}) {
  const [method, setMethod] = React.useState(PAYMENT_METHODS[0].value);
  const selected = PAYMENT_METHODS.find((item) => item.value === method) ?? PAYMENT_METHODS[0];

  return (
    <form action={action} className="flex flex-col gap-4">
      {bookingId && <input type="hidden" name="bookingId" value={bookingId} />}
      {orderId && <input type="hidden" name="orderId" value={orderId} />}

      <div className="flex flex-col gap-2.5">
        {PAYMENT_METHODS.map((item) => {
          const Icon = METHOD_ICONS[item.value];
          const isChecked = method === item.value;
          return (
            <label
              key={item.value}
              className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 text-sm transition-all ${
                isChecked
                  ? "border-[#0d5932] bg-[#0d5932]/5 shadow-sm"
                  : "border-slate-200 hover:border-slate-300"
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
                  <p className="font-bold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500 font-medium">{item.helper}</p>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <Separator className="my-2" />

      {selected.kind === "mobile_money" ? (
        <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
          <Label htmlFor="phone" className="font-bold text-slate-900">
            Mobile money number
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="e.g. 077X XXX XXX or 070X XXX XXX"
            className="h-11 rounded-xl bg-white"
            required
          />
          <p className="text-xs text-slate-500 font-medium">
            You will receive a USSD prompt on your phone to enter your PIN and approve the payment.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cardName" className="font-bold text-slate-900">
              Cardholder name
            </Label>
            <Input id="cardName" name="cardName" defaultValue={cardholderDefault} className="h-11 rounded-xl bg-white" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cardNumber" className="font-bold text-slate-900">
              Card number
            </Label>
            <Input id="cardNumber" name="cardNumber" type="text" placeholder="0000 0000 0000 0000" className="h-11 rounded-xl bg-white" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expiry" className="font-bold text-slate-900">
                Expiry date
              </Label>
              <Input id="expiry" name="expiry" type="text" placeholder="MM/YY" className="h-11 rounded-xl bg-white" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cvv" className="font-bold text-slate-900">
                CVV
              </Label>
              <Input id="cvv" name="cvv" type="text" placeholder="123" className="h-11 rounded-xl bg-white" required />
            </div>
          </div>
        </div>
      )}

      <SubmitButton payLabel={payLabel} />
    </form>
  );
}
