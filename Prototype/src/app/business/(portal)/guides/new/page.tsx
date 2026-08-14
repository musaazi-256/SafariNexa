import { redirect } from "next/navigation";
import { type GuideSpecialization } from "@prisma/client";

import { auth } from "@/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";

export default async function NewGuidePage() {
  const { business, businessId } = await requireBusinessSession();
  if (!business || !businessId) redirect("/business/auth/sign-in");

  async function createGuide(formData: FormData) {
    "use server";
    const activeSession = await auth();
    if (!activeSession?.user) redirect("/business/auth/sign-in");
    const activeBusinessId = activeSession.user.businessIds[0];
    if (!activeBusinessId) redirect("/business/auth/sign-in");

    const name = String(formData.get("name") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const experienceYears = Math.max(0, Number(formData.get("experienceYears")) || 0);
    const hourlyRateMinor = formData.get("hourlyRateMinor") ? Number(formData.get("hourlyRateMinor")) : null;
    const photoUrl = String(formData.get("photoUrl") ?? "").trim() || null;
    
    const specialization = String(formData.get("specialization") ?? "GENERAL") as GuideSpecialization;
    const hasOwnVehicle = formData.get("hasOwnVehicle") === "on";
    const isTopGuide = formData.get("isTopGuide") === "on";
    
    const languages = String(formData.get("languages") ?? "")
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    await db.guide.create({
      data: {
        businessId: activeBusinessId,
        name,
        bio,
        experienceYears,
        hourlyRateMinor,
        photoUrl,
        specialization,
        hasOwnVehicle,
        isTopGuide,
        languages
      }
    });

    redirect("/business/guides");
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Guides", href: "/business/guides" },
          { label: "Add guide", href: "/business/guides/new" }
        ]}
      />
      <h1 className="mb-6 text-3xl font-extrabold">Add a new guide</h1>

      <form action={createGuide} className="flex flex-col gap-6">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required />
            </div>
            
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" required />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="experienceYears">Years of experience</Label>
              <Input id="experienceYears" name="experienceYears" type="number" min={0} required />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hourlyRateMinor">Hourly rate (UGX, optional)</Label>
              <Input id="hourlyRateMinor" name="hourlyRateMinor" type="number" min={0} />
            </div>
            
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="languages">Languages (comma separated)</Label>
              <Input id="languages" name="languages" placeholder="English, Swahili, Luganda..." required />
            </div>
            
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="photoUrl">Photo URL (optional)</Label>
              <Input id="photoUrl" name="photoUrl" type="url" />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="specialization">Specialization</Label>
              <select
                id="specialization"
                name="specialization"
                defaultValue="GENERAL"
                className="flex h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm"
              >
                <option value="GENERAL">General Guide</option>
                <option value="DESTINATION_SPECIALIST">Destination Specialist</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="hasOwnVehicle" className="h-4 w-4 rounded border-input" />
                Has own vehicle
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isTopGuide" className="h-4 w-4 rounded border-input" />
                Mark as Top Guide
              </label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-fit">
          Add Guide
        </Button>
      </form>
    </>
  );
}
