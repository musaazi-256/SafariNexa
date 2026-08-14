import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ProtectedAction({
  action,
  returnTo,
  children
}: {
  action: string;
  returnTo: string;
  children?: React.ReactNode;
}) {
  const href = `/auth/sign-in?reason=${encodeURIComponent(action)}&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-primary">
          <Lock className="h-4 w-4" />
          <span className="text-xs font-extrabold uppercase tracking-wide">Account required</span>
        </div>
        <h2 className="mt-2 text-xl font-bold">{action}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Guests can browse freely, but SafariNexa asks for an account here. Sign in or create one and you&apos;ll come
          straight back to this exact step — nothing you selected is lost.
        </p>
        {children}
        <Button asChild className="mt-4">
          <Link href={href}>Continue to sign in</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
