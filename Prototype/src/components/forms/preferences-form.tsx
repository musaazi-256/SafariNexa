"use client";

import type { NotificationType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NOTIFICATION_TYPES, NOTIFICATION_TYPE_LABELS, type NotificationPreferences } from "@/lib/preferences";

export function PreferencesForm({
  notify,
  nationality,
  emergencyContact,
  action
}: {
  notify: NotificationPreferences;
  nationality: string;
  emergencyContact: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold">Notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose what SafariNexa keeps you posted on.</p>
        <div className="mt-4 flex flex-col gap-2.5">
          {NOTIFICATION_TYPES.map((type: NotificationType) => (
            <label
              key={type}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <span className="font-semibold">{NOTIFICATION_TYPE_LABELS[type]}</span>
              <input type="checkbox" name={`notify_${type}`} defaultChecked={notify[type]} className="h-4 w-4 accent-primary" />
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h2 className="text-lg font-bold">Traveller defaults</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pre-filled at checkout so you don&apos;t retype them each time.</p>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nationality">Nationality</Label>
            <Input id="nationality" name="nationality" defaultValue={nationality} placeholder="e.g. Ugandan" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="emergencyContact">Emergency contact</Label>
            <Input id="emergencyContact" name="emergencyContact" defaultValue={emergencyContact} placeholder="Name and phone number" />
          </div>
        </div>
      </div>

      <Button type="submit" className="self-start">
        Save preferences
      </Button>
    </form>
  );
}
