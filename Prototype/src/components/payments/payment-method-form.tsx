"use client";

import * as React from "react";
import { CreditCard, Globe, Smartphone } from "lucide-react";

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
    <form action={action} className="flex flex-col gap-3">
      {bookingId && <input type="hidden" name="bookingId" value={bookingId} />}
      {orderId && <input type="hidden" name="orderId" value={orderId} />}

      {PAYMENT_METHODS.map((item) => {
        const Icon = METHOD_ICONS[item.value];
        return (
          <label
            key={item.value}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3.5 text-sm transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <input
              type="radio"
              name="method"
              value={item.value}
              checked={method === item.value}
              onChange={() => setMethod(item.value)}
              className="h-4 w-4 text-primary"
              required
            />
            <Icon className="h-4 w-4 text-primary" />
            <span className="font-semibold">{item.label}</span>
          </label>
        );
      })}

      <Separator className="my-2" />

      {selected.kind === "mobile_money" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Mobile money number</Label>
          <Input id="phone" name="phone" type="tel" placeholder="e.g. 077X XXX XXX" required />
          <p className="text-xs text-muted-foreground">You will receive a prompt on your phone to approve the payment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cardName">Cardholder name</Label>
            <Input id="cardName" name="cardName" defaultValue={cardholderDefault} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cardNumber">Card number</Label>
            <Input id="cardNumber" name="cardNumber" type="text" placeholder="0000 0000 0000 0000" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="expiry">Expiry date</Label>
              <Input id="expiry" name="expiry" type="text" placeholder="MM/YY" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" name="cvv" type="text" placeholder="123" required />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" size="lg" className="mt-4">
        {payLabel}
      </Button>
    </form>
  );
}
