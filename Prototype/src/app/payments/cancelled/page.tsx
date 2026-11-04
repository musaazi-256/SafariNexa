import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";

export default function PaymentCancelledPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[70vh] items-center justify-center py-14">
          <Card className="w-full max-w-md"><CardContent className="flex flex-col items-center pt-8 text-center">
            <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-8 w-8 text-rose-600" />
            </div>
            <PageHeader title={<>Payment cancelled</>} description={<>
              You cancelled the payment process. Your booking is still saved as pending. You can try paying again from your bookings page.
            </>} />
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" size="lg" className="w-full"><Link href="/bookings" className="flex-1">
                  My bookings
                </Link></Button>
              <Button asChild size="lg" className="w-full"><Link href="/" className="flex-1">
                  Home
                </Link></Button>
            </div>
          </CardContent></Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
