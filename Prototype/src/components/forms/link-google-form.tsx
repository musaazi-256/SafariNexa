"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LinkGoogleForm({ email, returnTo }: { email: string; returnTo: string }) {
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "linked" | "error">("idle");
  const [error, setError] = React.useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const response = await fetch("/api/auth/google-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Something went wrong." }));
      setError(body.error ?? "Something went wrong.");
      setStatus("error");
      return;
    }

    setStatus("linked");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2 text-primary">
          <Link2 className="h-4 w-4" />
          <span className="text-xs font-extrabold uppercase tracking-wide">Confirm it&apos;s you</span>
        </div>
        <CardTitle>Link Google to your existing account</CardTitle>
        <CardDescription>
          <strong>{email}</strong> already has a SafariNexa account. Enter its password once to link Google — we never
          attach a new sign-in method without confirming you own the account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "linked" ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm font-medium text-success">
              Google linked. Continue with Google once more to finish signing in.
            </p>
            <Button onClick={() => signIn("google", { callbackUrl: returnTo })}>Continue with Google</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link-password">Password</Label>
              <Input
                id="link-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Verifying…" : "Verify and link Google"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
