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
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          {NOTIFICATION_TYPES.map((type: NotificationType) => (
            <label
              key={type}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3.5 text-sm has-[:checked]:border-[#1e613c] has-[:checked]:bg-[#1e613c]/5 transition-colors"
            >
              <span className="font-bold text-slate-700">{NOTIFICATION_TYPE_LABELS[type]}</span>
              <input type="checkbox" name={`notify_${type}`} defaultChecked={notify[type]} className="h-4 w-4 accent-[#1e613c]" />
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

      <Button type="submit" className="self-start bg-[#1e613c] hover:bg-[#164a2e] text-white font-bold h-11 px-6 rounded-lg shadow-sm">
        Save preferences
      </Button>
    </form>
  );
}
