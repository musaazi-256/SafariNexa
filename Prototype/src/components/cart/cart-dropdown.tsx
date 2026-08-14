"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { useCartStore } from "@/lib/cart";
import { formatUGX } from "@/lib/booking";
import { Button } from "@/components/ui/button";

export function CartDropdown() {
  const items = useCartStore((state) => state.items);
  const getTotalMinor = useCartStore((state) => state.getTotalMinor);
  
  // Handle hydration mismatch with Zustand persist
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
        <ShoppingCart className="h-5 w-5" />
      </Button>
    );
  }

  const totalItems = items.length;

  return (
    <div className="group relative">
      <Link href="/cart">
        <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white">
              {totalItems}
            </span>
          )}
        </Button>
      </Link>

      {/* Dropdown Container */}
      <div className="absolute right-0 top-full mt-2 hidden w-[360px] flex-col rounded-xl border border-border bg-white p-4 shadow-lg group-hover:flex z-50">
        <h3 className="mb-4 text-lg font-bold">Your Cart</h3>
        
        {totalItems === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <ShoppingCart className="mx-auto mb-3 h-10 w-10 opacity-20" />
            <p>Your cart is empty.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-2">
              {items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex gap-3">
                  {item.image ? (
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                      <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-md bg-muted" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                    <p className="mt-1 text-sm font-bold">{formatUGX(item.totalMinor)}</p>
                  </div>
                </div>
              ))}
              {totalItems > 3 && (
                <p className="text-center text-xs text-muted-foreground pt-2">
                  + {totalItems - 3} more item{totalItems - 3 > 1 ? "s" : ""}
                </p>
              )}
            </div>
            
            <div className="border-t border-border pt-4">
              <div className="mb-4 flex items-center justify-between font-bold">
                <span className="text-muted-foreground">Total:</span>
                <span className="text-lg">{formatUGX(getTotalMinor())}</span>
              </div>
              <Button asChild className="w-full bg-brand-green font-bold text-white hover:bg-brand-green/90">
                <Link href="/cart">Go to Cart</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
