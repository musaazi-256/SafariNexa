"use client";

import Link from "next/link";
import { User, Phone, Mail } from "lucide-react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import type { PersonalProfileState } from "@/lib/actions/business-personal-profile";

type Details = {name: string; phone: string; email: string};
function ProfileFields({name,phone,email}:Details) {
  const {pending} = useFormStatus();
  return <fieldset disabled={pending} className="min-w-0 space-y-6">
    <div className="space-y-2">
      <Label htmlFor="personal-email" className="flex items-center gap-2"><Mail aria-hidden="true" className="h-4 w-4 text-slate-400" />Email address</Label>
      <Input id="personal-email" type="email" value={email} disabled />
      <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
    </div>
    <div className="space-y-2">
      <Label htmlFor="personal-name" className="flex items-center gap-2"><User aria-hidden="true" className="h-4 w-4 text-slate-400" />Full name</Label>
      <Input id="personal-name" name="name" autoComplete="name" defaultValue={name} maxLength={100} required />
    </div>
    <div className="space-y-2">
      <Label htmlFor="personal-phone" className="flex items-center gap-2"><Phone aria-hidden="true" className="h-4 w-4 text-slate-400" />Phone number</Label>
      <PhoneInput id="personal-phone" name="phone" autoComplete="tel" defaultValue={phone} />
    </div>
    <div className="flex flex-wrap gap-3 pt-2">
      <Button type="submit" loadingText="Saving changes…">Save changes</Button>
      <Button asChild variant="outline" disabled={pending}><Link href="/business/profile">Cancel</Link></Button>
    </div>
  </fieldset>;
}
export function PersonalProfileForm({action,...details}:Details & {action:(state:PersonalProfileState,data:FormData)=>Promise<PersonalProfileState>}) {
  const [state,formAction] = useFormState(action,{});
  return <form action={formAction} className="max-w-lg space-y-4">
    <ProfileFields {...details} />
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
  </form>;
}
