"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto max-w-xl space-y-5 px-4 py-16"><h1 className="text-2xl font-semibold">We couldn’t complete that request</h1><p>Check your latest booking or payment status before trying again.</p><div className="flex flex-wrap gap-3"><Button onClick={reset}>Try again</Button><Button asChild variant="outline"><Link href="/support">Contact support</Link></Button><Button asChild variant="outline"><Link href="/">Home</Link></Button></div></main>;
}
