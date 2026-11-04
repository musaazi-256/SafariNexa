"use client";

import { useAsyncTask } from "@/hooks/use-async-task";

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
import { PhoneInput } from "@/components/ui/phone-input";
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

  const hasRestaurant = cartItems.some(item => item.type.toUpperCase() === "RESTAURANT");
  const hasPaidService = cartItems.some(item => item.type.toUpperCase() !== "RESTAURANT");
  const restaurantOnly = hasRestaurant && !hasPaidService;
  const checkoutNotice = restaurantOnly
    ? "Review your table reservation details and send your request. No payment is required."
    : hasRestaurant
      ? "Review your booking details, then continue to payment for the paid items. Restaurant table reservations do not require payment."
      : "Review your booking and traveller details, then continue to payment.";

  const [error, setError] = React.useState("");
  const [mounted, setMounted] = React.useState(false);
  const [isPending, startTransition] = useAsyncTask();
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
        <p className="rounded border p-4 text-sm leading-relaxed">{checkoutNotice}</p>
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
              <PhoneInput id="phone" name="phone" autoComplete="tel" defaultValue={defaults?.phone} required />
            </div>
            <TravellerDefaultFields nationality={defaults?.nationality} emergencyContact={defaults?.emergencyContact}/>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-xl font-semibold">Your Itinerary</h2>
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex gap-4">
                {item.image && (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                  </div>
                )}
                <div className="flex flex-col flex-1">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground capitalize leading-relaxed">{item.type}</p>
                  {item.startDate && item.endDate && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.startDate} to {item.endDate}
                    </p>
                  )}
                  {item.roomTypeName && <p className="text-sm font-medium text-brand-blue leading-relaxed">{item.roomTypeName}</p>}
                </div>
                <div className="font-semibold whitespace-nowrap">{item.type.toUpperCase()==="RESTAURANT" ? "Table request · no prepayment" : formatUGX(item.totalMinor)}</div>
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
          <div className="flex items-center justify-between text-base font-semibold">
            <span>{restaurantOnly ? "Reservation total" : "Estimated booking total"}</span>
            <span>{formatUGX(totalMinor)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{restaurantOnly ? "Meals are paid separately at the restaurant." : "You’ll review the final amount and choose your payment method in the next step."}</p>
          <Separator className="my-2" />
          {error && <p role="alert" className="rounded-xl border border-destructive p-3 text-sm text-destructive leading-relaxed">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={isPending} loadingText="Continuing…" disabled={cartItems.length === 0}>
            {restaurantOnly ? "Send reservation request" : "Continue to payment"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
