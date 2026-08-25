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

export function MultiCheckoutForm() {
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
    () => cartItems.reduce((sum, item) => sum + item.totalMinor, 0),
    [cartItems]
  );

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

    startTransition(async () => {
      try {
        const orderId = await createBulkOrderAction(cartItems, { fullName, email, phone });
        if (itemId) {
          cartItems.forEach((item) => useCartStore.getState().removeItem(item.id));
        } else {
          useCartStore.getState().clearCart();
        }
        router.push(`/payments?orderId=${orderId}`);
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <form action={handleCheckout} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traveller details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" placeholder="+256 7XX XXX XXX" required />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 mt-4">
          <h2 className="text-xl font-bold">Your Itinerary</h2>
          {cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex gap-4">
                {item.image && (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-secondary">
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                  </div>
                )}
                <div className="flex flex-col flex-1">
                  <p className="font-bold">{item.title}</p>
                  <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                  {item.startDate && item.endDate && (
                    <p className="text-sm text-muted-foreground">
                      {item.startDate} to {item.endDate}
                    </p>
                  )}
                  {item.roomTypeName && <p className="text-sm font-medium text-brand-blue">{item.roomTypeName}</p>}
                </div>
                <div className="font-bold whitespace-nowrap">{formatUGX(item.totalMinor)}</div>
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
            <span>Total Due</span>
            <span>{formatUGX(totalMinor)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Includes taxes and fees.</p>
          <Separator className="my-2" />
          <Button type="submit" size="lg" className="w-full" disabled={isPending || cartItems.length === 0}>
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Proceed to payment"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
