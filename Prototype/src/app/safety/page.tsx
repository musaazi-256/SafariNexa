import { AlertTriangle, Phone, ShieldAlert, HeartPulse, Building, MapPin } from "lucide-react";

import { PageHero } from "@/components/page-hero";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SafetyPage() {
  return (
    <>
      <SiteHeader />
      <PageHero 
        eyebrow="Safety" 
        title="Travel Safety & SOS" 
        description="Emergency contacts, travel advisories, and immediate support." 
      />
      <main className="container py-8">
        
        {/* SOS Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Emergency Assistance</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="destructive" className="h-auto py-6 flex flex-col items-center justify-center gap-2" asChild>
              <a href="tel:999">
                <Phone className="h-8 w-8" />
                <span className="font-bold text-lg">Call Police (999)</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50" asChild>
              <a href="tel:112">
                <HeartPulse className="h-8 w-8" />
                <span className="font-bold text-lg">Medical Emergency</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2 text-amber-600 border-amber-200 hover:bg-amber-50" asChild>
              <a href="tel:+256712667705">
                <ShieldAlert className="h-8 w-8" />
                <span className="font-bold text-lg">Tourism Police</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2" asChild>
              <a href="tel:999">
                <Building className="h-8 w-8 text-primary" />
                <span className="font-bold text-lg">Contact My Hotel</span>
              </a>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="directory" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="directory">Emergency Directory</TabsTrigger>
            <TabsTrigger value="advisories">Travel Advisories</TabsTrigger>
            <TabsTrigger value="support">SafariNexa Support</TabsTrigger>
          </TabsList>
          
          <TabsContent value="directory" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-muted-foreground" /> Essential Numbers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Uganda Police (Toll Free)</span>
                    <span className="font-bold">999 / 112</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Tourism Police Commander</span>
                    <span className="font-bold">+256 712 667 705</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Fire Brigade</span>
                    <span className="font-bold">112</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-muted-foreground" /> Major Hospitals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Nakasero Hospital (Kampala)</h4>
                    <p className="text-sm text-muted-foreground"><MapPin className="inline h-3 w-3 mr-1" /> Akii Bua Road, Nakasero</p>
                    <p className="text-sm font-medium mt-1">+256 312 246 000</p>
                  </div>
                  <div className="pt-2 border-t">
                    <h4 className="font-semibold">Mulago National Referral Hospital</h4>
                    <p className="text-sm text-muted-foreground"><MapPin className="inline h-3 w-3 mr-1" /> Mulago Hill, Kampala</p>
                    <p className="text-sm font-medium mt-1">+256 414 554 001</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="advisories">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" /> Active Weather Advisory: Heavy Rains
                </CardTitle>
                <CardDescription className="text-amber-700/80">Issued: October 10, 2026</CardDescription>
              </CardHeader>
              <CardContent className="text-amber-900 text-sm">
                Heavy rains are expected in the South-Western region (Bwindi, Mgahinga) over the next 48 hours. 
                Roads may become slippery. Travelers are advised to use 4x4 vehicles and allow extra travel time.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>24/7 SafariNexa Support</CardTitle>
                <CardDescription>We&apos;re here to help if you encounter issues with your booking.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full sm:w-auto">Open Support Chat</Button>
                <p className="text-sm text-muted-foreground mt-4">
                  Or email us at <span className="font-medium">urgent@safarinexa.com</span> for critical issues.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </main>
    </>
  );
}
