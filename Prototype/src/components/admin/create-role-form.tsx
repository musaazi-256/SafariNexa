"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createRole } from "@/lib/actions/roles";

const PERMISSION_LABELS: Record<string, string> = {
  "businesses.manage": "Review business verification & listing submissions",
  "users.manage": "Invite admins and suspend/reactivate access",
  "payments.manage": "Approve refunds and settle payouts",
  "support.manage": "Reply to and close support cases",
  "reviews.moderate": "Moderate customer reviews"
};

export function CreateRoleForm({ permissions }: { permissions: Array<{ key: string }> }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) ?? "";
    const permissionKeys = formData.getAll("permissions").map(String);

    try {
      await createRole(name, description, permissionKeys);
      router.push("/admin/roles");
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
          <label htmlFor="name" className="text-sm font-medium text-slate-900">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. Listings Reviewer"
            className="form-control w-full outline-none focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium text-slate-900">Description</label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="What this level is for"
            className="form-control w-full outline-none focus:bg-white transition-all"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-900 mb-1.5">Permissions</legend>
          {permissions.map((permission) => (
            <label key={permission.key} className="flex items-start gap-3 text-sm font-medium text-slate-700">
              <input type="checkbox" name="permissions" value={permission.key} className="mt-0.5" />
              {PERMISSION_LABELS[permission.key] ?? permission.key}
            </label>
          ))}
        </fieldset>

        <div className="pt-4 flex items-center gap-4">
          <Button
            type="submit"
            loading={isPending}
            className="h-11 px-6 rounded-full bg-[#1e613c] hover:bg-[#15462b] text-white font-medium shadow-sm"
          >
            {isPending ? "Creating..." : "Create permission level"}
          </Button>
          <Link href="/admin/roles" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
