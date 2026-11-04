import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function TravellerDefaultFields({nationality, emergencyContact}: {nationality?: string | null; emergencyContact?: string | null}) {
  return <><div className="flex flex-col gap-1.5"><Label htmlFor="nationality">Nationality (optional)</Label><Input id="nationality" name="nationality" maxLength={100} defaultValue={nationality || ""}/></div><div className="flex flex-col gap-1.5"><Label htmlFor="emergencyContact">Emergency contact (optional)</Label><Input id="emergencyContact" name="emergencyContact" maxLength={250} defaultValue={emergencyContact || ""}/></div><p className="text-base md:text-sm text-muted-foreground sm:col-span-2 leading-relaxed">These details are saved with this booking and shared with the booked business and authorised admins. Clear optional details you do not want to share.</p></>;
}
