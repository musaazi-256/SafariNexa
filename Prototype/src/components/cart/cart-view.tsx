"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2, Pencil, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { CartItem, useCartStore } from "@/lib/cart";
import { formatUGX, nightsBetween } from "@/lib/booking";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EditCartItemModal } from "@/components/cart/edit-cart-item-modal";

export function CartView() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalMinor = useCartStore((state) => state.getTotalMinor);
  const router = useRouter();

  const [editingItem, setEditingItem] = React.useState<CartItem | null>(null);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <main className="flex-1 bg-white pb-20 pt-6" />;
  }

  const totalItems = items.length;
  const firstItem = items[0];

  return (
    <main className="flex-1 bg-white pb-20 pt-6">
      <Container>
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium mb-6 flex-wrap">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link href="/accommodation" className="hover:text-slate-900 transition-colors">Accommodation</Link>
          {firstItem && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-600 font-medium truncate max-w-[180px] sm:max-w-none">{firstItem.title}</span>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Cart</span>
        </div>

        {/* Page Title */}
        <h1 className="mb-8 text-3xl font-extrabold sm:text-4xl text-[#0d5932] tracking-tight">
          Cart
        </h1>

        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <ShoppingCart className="mb-6 h-16 w-16 text-slate-300 opacity-60" />
            <h2 className="mb-3 text-2xl font-bold text-slate-900">Your cart is empty</h2>
            <p className="mb-8 text-slate-500 max-w-md text-sm">
              Looks like you haven&apos;t added any trips, accommodations, or activities to your cart yet.
            </p>
            <Button size="lg" className="bg-[#0d5932] hover:bg-[#0a4526] text-white font-bold rounded-full px-8" asChild>
              <Link href="/explore">Start Exploring</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Left List of Items */}
            <div className="flex flex-col gap-6">
              {items.map((item) => {
                const isMultiNight = item.startDate && item.endDate && item.startDate !== item.endDate;
                const numNights = isMultiNight ? nightsBetween(item.startDate!, item.endDate!) : 0;

                return (
                  <div key={item.id} className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="flex flex-col sm:flex-row gap-5">
                      {/* Thumbnail Image */}
                      {item.image ? (
                        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                          <Image src={item.image} alt={item.title} fill sizes="112px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-28 w-28 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300">
                          <ShoppingCart className="h-8 w-8" />
                        </div>
                      )}

                      {/* Details Column */}
                      <div className="flex flex-1 flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className="text-xs font-bold tracking-wider text-[#0d5932] uppercase">
                                {item.type}
                              </span>
                              <h2 className="text-xl font-extrabold text-slate-900 line-clamp-1 mt-0.5">
                                {item.title}
                              </h2>
                            </div>

                            <div className="text-right shrink-0 hidden sm:block">
                              <span className="text-xl font-extrabold text-slate-900">
                                {formatUGX(item.totalMinor)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
                            {isMultiNight && (
                              <p className="flex items-center gap-2 font-medium">
                                <span className="font-semibold text-slate-700">Dates:</span> {item.startDate} to {item.endDate}
                                <span className="inline-block rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700">
                                  {numNights} night{numNights > 1 ? "s" : ""}
                                </span>
                              </p>
                            )}
                            {item.startDate && !isMultiNight && (
                              <p className="font-medium">
                                <span className="font-semibold text-slate-700">Date:</span> {item.startDate}
                                {item.time && ` at ${item.time}`}
                              </p>
                            )}
                            {item.roomTypeName && (
                              <p className="font-medium text-slate-600">
                                <span className="font-semibold text-slate-700">Room:</span> {item.roomTypeName}
                              </p>
                            )}
                            {item.participants > 0 && (
                              <p className="font-medium text-slate-600">
                                <span className="font-semibold text-slate-700">Guests:</span> {item.participants}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="sm:hidden mt-3">
                          <span className="text-lg font-extrabold text-slate-900">{formatUGX(item.totalMinor)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Separator Line */}
                    <div className="my-5 border-t border-slate-100" />

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="flex items-center gap-1.5 text-sm font-bold text-[#0d5932] hover:text-[#0a4526] transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>

                      <Button
                        onClick={() => router.push(`/checkout/multi?itemId=${item.id}`)}
                        className="bg-[#0d5932] hover:bg-[#0a4526] text-white font-bold rounded-full px-6 h-10 text-sm shadow-sm"
                      >
                        Only checkout this
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Summary Sidebar */}
            <div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sticky top-28">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Booking summary</h2>
                
                <div className="border-t border-slate-100 pt-4 mb-4 space-y-3">
                  {items.map((item) => (
                    <div key={item.id}>
                      <p className="font-bold text-sm text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 font-medium">
                        {item.roomTypeName || (item.type === "ACCOMMODATION" ? "Accommodation" : item.type)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-slate-900 mb-1">
                    <span className="text-base font-bold">Total</span>
                    <span className="text-xl font-extrabold">{formatUGX(getTotalMinor())}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-6">
                    See rooms and total breakdown to the left
                  </p>

                  <Button
                    onClick={() => router.push("/checkout/multi")}
                    className="w-full bg-[#0d5932] hover:bg-[#0a4526] text-white font-bold h-12 rounded-full text-base shadow-sm"
                  >
                    Checkout Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <EditCartItemModal
          item={editingItem}
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
        />
      </Container>
    </main>
  );
}
