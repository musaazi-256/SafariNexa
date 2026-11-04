"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { inviteAdmin } from "@/lib/actions/admin";

export function InviteAdminForm({ roles }: { roles: Array<{ id: string; name: string; description: string | null }> }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const roleId = formData.get("roleId") as string;

    try {
      await inviteAdmin(email, roleId);
      router.push("/admin/users");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-900">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="admin@example.com"
            className="form-control w-full outline-none focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="roleId" className="text-sm font-medium text-slate-900">Permission level</label>
          <select
            id="roleId"
            name="roleId"
            required
            defaultValue=""
            className="form-control w-full outline-none focus:bg-white transition-all"
          >
            <option value="" disabled>Choose a permission level&hellip;</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Defines exactly what this person can do.{" "}
            <Link href="/admin/roles" className="font-semibold text-[#1e613c] hover:underline">
              Review what each level grants
            </Link>
            .
          </p>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <Button
            type="submit"
            loading={isPending}
            className="h-11 px-6 rounded-full bg-[#1e613c] hover:bg-[#15462b] text-white font-medium shadow-sm"
          >
            {isPending ? "Sending invite..." : "Send invitation"}
          </Button>
          <Link href="/admin/users" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
