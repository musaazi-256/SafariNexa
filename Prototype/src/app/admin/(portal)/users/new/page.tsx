"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { inviteAdmin } from "@/lib/actions/admin";

export default function AdminNewUserPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      await inviteAdmin(email);
      router.push("/admin/users");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-8 pb-20 font-sans">
      
      {/* Back Link */}
      <Link href="/admin/users" className="inline-flex items-center text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to users
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Invite Admin User</h1>
        <p className="text-[14px] text-slate-500 font-semibold max-w-xl">
          Send an invitation to grant administrative access to the SafariNexa portal. If they already have an account, their permissions will be elevated.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-[13px] font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[13px] font-bold text-slate-900">Email address</label>
            <input 
              id="email"
              name="email"
              type="email" 
              required
              placeholder="admin@example.com"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] outline-none focus:bg-white focus:border-[#1e613c] focus:ring-1 focus:ring-[#1e613c] transition-all"
            />
          </div>

          <div className="pt-4 flex items-center gap-4">
            <Button 
              type="submit" 
              disabled={isPending}
              className="h-11 px-6 rounded-full bg-[#1e613c] hover:bg-[#15462b] text-white font-bold shadow-sm"
            >
              {isPending ? "Sending invite..." : "Send invitation"}
            </Button>
            <Link href="/admin/users" className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>

    </div>
  );
}
