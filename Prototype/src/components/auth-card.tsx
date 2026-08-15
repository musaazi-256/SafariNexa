import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { safeReturnTo } from "@/lib/return-to";

type Surface = "customer" | "business" | "admin";

const SURFACE_META: Record<Surface, { label: string; googleHref: string; provider: "credentials" | "admin-credentials"; defaultReturn: string; signInPath: string }> = {
  customer: { label: "customer account", googleHref: "/auth/google", provider: "credentials", defaultReturn: "/", signInPath: "/auth/sign-in" },
  business: { label: "business account", googleHref: "/business/auth/google", provider: "credentials", defaultReturn: "/business/dashboard", signInPath: "/business/auth/sign-in" },
  admin: { label: "admin account", googleHref: "/admin/auth/google", provider: "admin-credentials", defaultReturn: "/admin/dashboard", signInPath: "/admin/login" }
};

const ERROR_COPY: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  admin_denied: "This account is not an active admin. Access has been logged."
};

export function AuthCard({
  surface = "customer",
  returnTo,
  error
}: {
  surface?: Surface;
  returnTo?: string;
  error?: string;
}) {
  const meta = SURFACE_META[surface];
  const target = safeReturnTo(returnTo, meta.defaultReturn);

  async function credentialsAction(formData: FormData) {
    "use server";
    try {
      let email = formData.get("email")?.toString();
      let password = formData.get("password")?.toString();

      // Automatically fallback to our seeded demo accounts if fields are left empty
      if (!email) {
        if (surface === "admin") email = "admin@safarinexa.test";
        else if (surface === "business") email = "business@dev.test";
        else email = "customer@safarinexa.test";
      }
      
      if (!password) {
        password = "Passw0rd!";
      }

      await signIn(meta.provider, {
        email,
        password,
        redirectTo: target
      });
    } catch (thrown) {
      if (thrown instanceof AuthError) {
        const errorCode = surface === "admin" ? "admin_denied" : "invalid_credentials";
        redirect(`${meta.signInPath}?error=${errorCode}&returnTo=${encodeURIComponent(target)}`);
      }
      throw thrown;
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <p className="text-xs font-extrabold uppercase tracking-wide text-primary">{surface} authentication</p>
        <CardTitle className="text-3xl">Sign in to your {meta.label}</CardTitle>
        <CardDescription>Continue with Google or the email already stored in the SafariNexa database.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive">
            {ERROR_COPY[error] ?? "Something went wrong. Please try again."}
          </p>
        ) : null}

        <Button asChild variant="secondary" className="w-full">
          <Link href={`${meta.googleHref}?returnTo=${encodeURIComponent(target)}`}>Continue with Google</Link>
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs font-semibold uppercase text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <form action={credentialsAction} className="flex flex-col gap-3">
          <input type="hidden" name="returnTo" value={target} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${surface}-email`}>Email</Label>
            <Input
              id={`${surface}-email`}
              name="email"
              type="email"
              placeholder="Leave empty to use a demo account"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${surface}-password`}>Password</Label>
            <Input
              id={`${surface}-password`}
              name="password"
              type="password"
              placeholder="Leave empty to use a demo account"
            />
          </div>
          <Button type="submit" className="mt-1">
            Sign in with email
          </Button>
        </form>

        {surface === "customer" ? (
          <p className="text-center text-sm text-muted-foreground">
            New to SafariNexa?{" "}
            <Link href={`/auth/create-account?returnTo=${encodeURIComponent(target)}`} className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        ) : null}
        {surface === "business" ? (
          <p className="text-center text-sm text-muted-foreground">
            New business?{" "}
            <Link href="/business/onboarding" className="font-semibold text-primary hover:underline">
              Start onboarding
            </Link>
          </p>
        ) : null}
        {surface === "admin" ? (
          <p className="text-center text-xs text-muted-foreground">
            Admin accounts are provisioned by SafariNexa super admins only — there is no self-service sign-up.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
