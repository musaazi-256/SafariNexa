"use client";

import Image from "next/image";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useCartStore } from "@/lib/cart";
import { formatUGX } from "@/lib/booking";
import { createBulkOrderAction } from "@/app/checkout/multi/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TravellerDefaultFields } from "@/components/checkout/traveller-default-fields";
import { ServiceDetailsFields } from "@/components/checkout/service-details-fields";
import { fulfilmentFromForm } from "@/lib/booking-operations";

export function MultiCheckoutForm({ defaults }: { defaults?: { fullName: string; email: string; phone: string; nationality?: string | null; emergencyContact?: string | null } }) {
  const allCartItems = useCartStore((state) => state.items);
  const searchParams = useSearchParams();
  const itemId = searchParams.get("itemId");

  const cartItems = React.useMemo(() => {
    if (itemId) {
      const match = allCartItems.filter((item) => item.id === itemId);
      return match.length > 0 ? match : allCartItems;
    }
    return allCartItems;
  }, [allCartItems, itemId]);

  const totalMinor = React.useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.type.toUpperCase()==="RESTAURANT" ? 0 : item.totalMinor), 0),
    [cartItems]
  );

  const [error, setError] = React.useState("");
  const [mounted, setMounted] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  async function handleCheckout(formData: FormData) {
    const fullName = String(formData.get("fullName"));
    const email = String(formData.get("email"));
    const phone = String(formData.get("phone"));

    setError("");
    startTransition(async () => {
      try {
        const orderId = await createBulkOrderAction(cartItems.map(item=>({...item,fulfilment:fulfilmentFromForm(formData,item.id)})), { fullName, email, phone, nationality: String(formData.get("nationality") || ""), emergencyContact: String(formData.get("emergencyContact") || "") });
        if (itemId) {
          cartItems.forEach((item) => useCartStore.getState().removeItem(item.id));
        } else {
          useCartStore.getState().clearCart();
        }
        router.push(`/payments?orderId=${orderId}`);
      } catch (err) {
        console.error(err);
        setError("We could not reserve these items. Check dates, availability and group sizes, then try again. No payment was collected.");
      }
    });
  }

  return (
    <form action={handleCheckout} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <p className="rounded border p-4 text-sm">Request-to-book services require acceptance before payment. Restaurant requests reserve tables, not meals. Final prices are validated on the server.</p>
        {cartItems.map(item=><ServiceDetailsFields key={item.id} prefix={item.id} type={item.type} initial={item.fulfilment}/>)}
        <Card>
          <CardHeader>
            <CardTitle>Traveller details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" autoComplete="name" defaultValue={defaults?.fullName} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" defaultValue={defaults?.email} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={defaults?.phone} placeholder="+256 7XX XXX XXX" required />
            </div>
            <TravellerDefaultFields nationality={defaults?.nationality} emergencyContact={defaults?.emergencyContact}/>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-xl font-bold">Your Itinerary</h2>
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap gap-3 p-4">
                {item.image && (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-bold">{item.title}</p>
                  <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                  {item.startDate && item.endDate && (
                    <p className="text-sm text-muted-foreground">
                      {item.startDate} to {item.endDate}
                    </p>
                  )}
                  {item.roomTypeName && <p className="text-sm font-medium text-brand-blue">{item.roomTypeName}</p>}
                </div>
                <div className="font-bold whitespace-nowrap">{item.type.toUpperCase()==="RESTAURANT" ? "Table request · no prepayment" : formatUGX(item.totalMinor)}</div>
              </CardContent>
            </Card>
          ))}
          {cartItems.length === 0 && <div className="text-muted-foreground p-4">Your cart is empty.</div>}
        </div>
      </div>

      <Card className="sticky top-24 h-fit">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-base font-bold">
            <span>Estimated booking total</span>
            <span>{formatUGX(totalMinor)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Not charged on submission. Review listing inclusions and exclusions. The server validates the final payable amount.</p>
          <Separator className="my-2" />
          {error && <p role="alert" className="rounded-xl border border-destructive p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={isPending || cartItems.length === 0}>
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit and check booking status"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
