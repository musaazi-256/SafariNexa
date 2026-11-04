"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_CATEGORIES } from "@/lib/support";

export function SupportCaseForm({
  action,
  categories = SUPPORT_CATEGORIES,
  bookings,
  subjectPlaceholder = "e.g. Payment failed but I was charged"
}: {
  action: (formData: FormData) => void;
  categories?: readonly string[];
  /** Optional bookings the case can be linked to (business portal). */
  bookings?: Array<{ id: string; label: string }>;
  subjectPlaceholder?: string;
}) {
  const [category, setCategory] = React.useState<string>(categories[0]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary"
            >
              <input
                type="radio"
                name="category"
                value={item}
                checked={category === item}
                onChange={() => setCategory(item)}
                className="sr-only"
                required
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required placeholder={subjectPlaceholder} />
      </div>

      {bookings ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="relatedBookingId">Related booking (optional)</Label>
          <select id="relatedBookingId" name="relatedBookingId" defaultValue="" className="filter-select w-full">
            <option value="">No specific booking</option>
            {bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.label}</option>)}
          </select>
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={4} required placeholder="Tell us what's going on — include a booking reference if you have one." />
      </div>

      <Button type="submit" className="mt-1 self-start">
        Open case
      </Button>
    </form>
  );
}
