import Link from "next/link";
import { XCircle } from "lucide-react";
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
          <div className="flex flex-col items-center text-center max-w-md">
            <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-8 w-8 text-rose-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Payment cancelled</h1>
            <p className="text-slate-500 mb-8">
              You cancelled the payment process. Your booking is still saved as pending. You can try paying again from your bookings page.
            </p>
            <div className="flex gap-4 w-full">
              <Link href="/bookings" className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  My bookings
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button size="lg" className="w-full bg-[#1e613c] hover:bg-[#15462b] text-white">
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
