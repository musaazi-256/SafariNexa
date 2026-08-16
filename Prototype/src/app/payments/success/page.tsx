import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Container } from "@/components/ui/container";

export default function PaymentSuccessPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Container className="flex min-h-[70vh] items-center justify-center py-14">
          <div className="flex flex-col items-center text-center max-w-md">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Payment successful!</h1>
            <p className="text-slate-500 mb-8">
              Your payment has been processed and your booking is confirmed. We have sent a receipt to your email.
            </p>
            <Link href="/bookings">
              <Button size="lg" className="w-full bg-[#1e613c] hover:bg-[#15462b] text-white">
                View my bookings
              </Button>
            </Link>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
