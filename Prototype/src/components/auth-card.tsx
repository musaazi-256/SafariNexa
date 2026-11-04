import { PageTitle } from "@/components/page-header";
import { isDemoMode } from "@/lib/dev-mode";
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

// Seeded identities remain available in deployed demo builds.
const DEMO_ACCOUNT: Record<Surface, { email: string; label: string }> = {
  customer: { email: "customer@safarinexa.test", label: "Continue as customer" },
  business: { email: "business@dev.test", label: "Continue as business" },
  admin: { email: "admin@safarinexa.test", label: "Continue as admin" }
};
const DEMO_PASSWORD = "Passw0rd!";

const ERROR_COPY: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  admin_denied: "This account is not an active admin. Access has been logged."
};

export function AuthCard({
  hideGoogle = false,
  surface = "customer",
  returnTo,
  error
}: {
  hideGoogle?: boolean;
  surface?: Surface;
  returnTo?: string;
  error?: string;
}) {
  const meta = SURFACE_META[surface];
  const demo = isDemoMode();
  const demoAccount = DEMO_ACCOUNT[surface];
  const target = safeReturnTo(returnTo, meta.defaultReturn);

  async function credentialsAction(formData: FormData) {
    "use server";
    try {
      let email = formData.get("email")?.toString();
      let password = formData.get("password")?.toString();

      if (!email?.trim() || !password) {
        redirect(`${meta.signInPath}?error=invalid_credentials`);
      }

      await signIn(isDemoMode() && formData.get("demo") === "true" ? "demo" : meta.provider, {
        surface,
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
        <p className="text-xs font-medium uppercase tracking-wide text-primary">{surface} authentication</p>
        <PageTitle>Sign in to your {meta.label}</PageTitle>
        <CardDescription>{demo ? "This is a demo. The details below are filled in for you, so just continue." : "Continue with Google or your SafariNexa email."}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive leading-relaxed">
            {ERROR_COPY[error] ?? "Something went wrong. Please try again."}
          </p>
        ) : null}

        {!hideGoogle && !demo ? (
          <>
            <Button asChild variant="secondary" className="w-full">
              <Link href={`${meta.googleHref}?returnTo=${encodeURIComponent(target)}`}>Continue with Google</Link>
            </Button>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs font-medium uppercase text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>
          </>
        ) : null}

        <form action={credentialsAction} className="flex flex-col gap-3">
          {demo ? <input type="hidden" name="demo" value="true" /> : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${surface}-email`}>Email</Label>
            <Input
              id={`${surface}-email`}
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="username"
              defaultValue={demo ? demoAccount.email : undefined}
              readOnly={demo}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${surface}-password`}>Password</Label>
            <Input
              id={`${surface}-password`}
              name="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              defaultValue={demo ? DEMO_PASSWORD : undefined}
              readOnly={demo}
              required
            />
          </div>
          <Button type="submit" className="mt-1">
            {demo ? demoAccount.label : "Sign in with email"}
          </Button>
        </form>

        {surface === "customer" ? (
          <p className="text-center text-sm text-muted-foreground leading-relaxed">
            New to SafariNexa?{" "}
            <Link href={`/auth/create-account?returnTo=${encodeURIComponent(target)}`} className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        ) : null}
        {surface === "business" ? (
          <p className="text-center text-sm text-muted-foreground leading-relaxed">
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
