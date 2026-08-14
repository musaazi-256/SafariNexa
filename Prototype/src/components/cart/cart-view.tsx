"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { useCartStore } from "@/lib/cart";
import { formatUGX } from "@/lib/booking";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalMinor = useCartStore((state) => state.getTotalMinor);
  const router = useRouter();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <main className="flex-1 bg-muted/30 pb-20 pt-10" />;
  }

  const totalItems = items.length;

  return (
    <main className="flex-1 bg-muted/30 pb-20 pt-10">
      <Container>
        <h1 className="mb-8 text-3xl font-extrabold sm:text-4xl">Shopping Cart</h1>

        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-16 text-center shadow-sm">
            <ShoppingCart className="mb-6 h-16 w-16 text-muted-foreground opacity-30" />
            <h2 className="mb-3 text-2xl font-bold">Your cart is empty</h2>
            <p className="mb-8 text-muted-foreground max-w-md">
              Looks like you haven&apos;t added any trips, accommodations, or activities to your cart yet.
            </p>
            <Button size="lg" asChild>
              <Link href="/explore">Start Exploring</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
            <div className="flex flex-col gap-6">
              <p className="font-semibold text-muted-foreground">
                {totalItems} Item{totalItems > 1 ? "s" : ""} in Cart
              </p>
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex gap-6 p-4 sm:p-6 relative">
                    {item.image && (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary sm:h-24 sm:w-24">
                        <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 80px, 96px" className="object-cover" />
                      </div>
                    )}
                    
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-bold line-clamp-2">{item.title}</h3>
                          <p className="mt-1 text-sm font-semibold capitalize text-primary">{item.type}</p>
                        </div>
                        
                        <p className="text-lg font-extrabold whitespace-nowrap hidden sm:block">
                          {formatUGX(item.totalMinor)}
                        </p>
                      </div>
                      
                      <div className="mt-4 flex flex-col gap-1 text-sm text-muted-foreground">
                        {item.startDate && item.endDate && item.startDate !== item.endDate && (
                          <p>
                            <span className="font-medium text-foreground">Dates:</span> {item.startDate} to {item.endDate}
                          </p>
                        )}
                        {item.startDate && (item.endDate === item.startDate || !item.endDate) && (
                          <p>
                            <span className="font-medium text-foreground">Date:</span> {item.startDate}
                            {item.time && ` at ${item.time}`}
                          </p>
                        )}
                        {item.roomTypeName && (
                          <p>
                            <span className="font-medium text-foreground">Room:</span> {item.roomTypeName}
                          </p>
                        )}
                        {item.participants > 0 && (
                          <p>
                            <span className="font-medium text-foreground">Guests:</span> {item.participants}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-brand-red transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                        
                        <p className="text-lg font-extrabold sm:hidden">
                          {formatUGX(item.totalMinor)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <Card className="sticky top-28 shadow-card-hover">
                <CardContent className="flex flex-col gap-6 p-6">
                  <h2 className="text-xl font-bold">Order Summary</h2>
                  
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items ({totalItems}):</span>
                      <span className="font-semibold text-foreground">{formatUGX(getTotalMinor())}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxes:</span>
                      <span className="font-semibold text-foreground">Included</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-4">
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-3xl font-extrabold">{formatUGX(getTotalMinor())}</span>
                    </div>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold h-12 text-lg gap-2"
                    onClick={() => router.push('/checkout/multi')}
                  >
                    Checkout Now <ArrowRight className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
