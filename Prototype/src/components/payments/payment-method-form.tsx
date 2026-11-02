"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

function Submit({ label, enabled }: { label: string; enabled: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" className="w-full" disabled={!enabled || pending}>
    {pending ? "Opening secure checkout…" : label}
  </Button>;
}
export function PaymentMethodForm({ bookingId, orderId, payLabel, enabled = false, action }: {
  bookingId?: string; orderId?: string; payLabel: string; cardholderDefault?: string;
  enabled?: boolean; action: (data: FormData) => void;
}) {
  return <form action={action} className="flex flex-col gap-4">
    {bookingId && <input type="hidden" name="bookingId" value={bookingId} />}
    {orderId && <input type="hidden" name="orderId" value={orderId} />}
    <input type="hidden" name="method" value="stripe" />
    <div className="rounded-xl border p-4">
      <h2 className="font-bold">Secure hosted card checkout</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter card details only on the provider’s secure page. SafariNexa does not collect your card number or security code.</p>
    </div>
    <p role="status" className="rounded-xl bg-muted p-4 text-sm">
      {enabled ? "Your booking stays unpaid until the provider confirms payment." : "Online payments are not configured. No money has been collected. Review or cancel pending bookings in My bookings."}
    </p>
    <p className="text-sm text-muted-foreground">MTN Mobile Money and Airtel Money are not connected and cannot accept payments here.</p>
    <Submit label={payLabel} enabled={enabled} />
  </form>;
}
