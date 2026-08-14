"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function CreateAccountForm({ returnTo }: { returnTo: string }) {
  const [form, setForm] = React.useState({ name: "", email: "", password: "" });
  const [status, setStatus] = React.useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = React.useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Something went wrong." }));
      setError(body.error ?? "Something went wrong.");
      setStatus("error");
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, callbackUrl: returnTo });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <p className="text-xs font-extrabold uppercase tracking-wide text-primary">Customer account</p>
        <CardTitle className="text-3xl">Create your account</CardTitle>
        <CardDescription>Only needed when you book, pay, save, message, or review — browsing stays open.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Button asChild variant="secondary" className="w-full">
          <Link href={`/auth/google?returnTo=${encodeURIComponent(returnTo)}`}>Continue with Google</Link>
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs font-semibold uppercase text-muted-foreground">or</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <Button type="submit" disabled={status === "loading"} className="mt-1">
            {status === "loading" ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href={`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
