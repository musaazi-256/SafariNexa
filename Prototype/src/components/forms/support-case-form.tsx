"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_CATEGORIES } from "@/lib/support";

export function SupportCaseForm({ action }: { action: (formData: FormData) => void }) {
  const [category, setCategory] = React.useState<string>(SUPPORT_CATEGORIES[0]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORT_CATEGORIES.map((item) => (
            <label
              key={item}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary"
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
        <Input id="subject" name="subject" required placeholder="e.g. Payment failed but I was charged" />
      </div>

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
