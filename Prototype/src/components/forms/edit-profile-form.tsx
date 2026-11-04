"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

export function EditProfileForm({
  name,
  phone,
  dateOfBirth,
  action
}: {
  name: string;
  phone: string;
  dateOfBirth: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" defaultValue={name} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <PhoneInput id="phone" name="phone" autoComplete="tel" defaultValue={phone} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={dateOfBirth} />
      </div>
      <Button type="submit" className="mt-1 self-start">
        Save changes
      </Button>
    </form>
  );
}
