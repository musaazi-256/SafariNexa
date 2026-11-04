import { PLATFORM_COMMISSION_RATE } from "@/lib/revenue";
import { isDemoMode } from "@/lib/dev-mode";
import { DemoSettingsForm } from "@/components/admin/demo-settings-form";
import { PageHero } from "@/components/page-hero";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdminSession } from "@/lib/admin";

export default async function AdminSettingsPage() {
  await requireAdminSession();
  const demo = isDemoMode();

  return (
    <>
      <PageHero variant="portal" eyebrow="Admin portal" title="Platform Settings" description={demo ? "Manage platform settings and preferences on this device." : "Review platform configuration."} />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="commission">Commission & Fees</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Global platform configuration.</CardDescription>
            </CardHeader>
            <DemoSettingsForm storageKey="safarinexa-demo-general-settings">
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input required id="platformName" defaultValue="SafariNexa" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Global Support Email</Label>
                  <Input required id="supportEmail" type="email" defaultValue="support@safarinexa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Global Support Phone</Label>
                  <PhoneInput id="contactPhone" defaultValue="+256 800 000000" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={!demo}>Save changes</Button>
            </CardFooter>
            </DemoSettingsForm>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission & Fees</CardTitle>
              <CardDescription>Current commission applied to revenue calculations and business settlements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="accommodationFee">Accommodation Commission (%)</Label>
                  <Input id="accommodationFee" type="number" readOnly value={PLATFORM_COMMISSION_RATE * 100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tourFee">Safaris & Tours Commission (%)</Label>
                  <Input id="tourFee" type="number" readOnly value={PLATFORM_COMMISSION_RATE * 100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportFee">Transport Commission (%)</Label>
                  <Input id="transportFee" type="number" readOnly value={PLATFORM_COMMISSION_RATE * 100} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4"><p className="text-sm text-muted-foreground leading-relaxed">A standard rate applies to all paid service categories.</p></CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Categories</CardTitle>
              <CardDescription>Manage the main categories enabled on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Accommodation</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">Hotels, lodges, guesthouses</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Safaris & Tours</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">Tour operators and packages</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between border-b pb-4 opacity-50">
                  <div>
                    <p className="font-medium">Restaurant Delivery</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">Food delivery (Phase 2)</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    Disabled
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
