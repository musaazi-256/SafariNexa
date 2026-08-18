import { redirect } from "next/navigation";
import { User, Phone, Mail } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAdminProfile } from "@/lib/actions/admin";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { adminUser: { include: { role: true } } }
  });

  if (!user || !user.adminUser) {
    redirect("/admin/login");
  }

  async function saveProfile(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    await updateAdminProfile(name, phone);
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-8 pb-20 font-sans">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e613c] mb-1">ADMIN PORTAL</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">My Profile</h1>
        <p className="text-[13px] text-slate-500 font-semibold max-w-2xl">Manage your personal admin account details and preferences.</p>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-6 pt-8 px-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#E4F2E8] text-[#1e613c] flex items-center justify-center border-2 border-white shadow-sm">
              <User className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-xl">{user.name || "Admin User"}</CardTitle>
              <CardDescription className="text-[13px] font-semibold text-slate-500 mt-1">
                {user.adminUser.role.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form action={saveProfile} className="space-y-6 max-w-[500px]">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-slate-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" /> Email address
              </Label>
              <Input 
                id="email" 
                value={user.email} 
                disabled 
                className="bg-slate-50 text-slate-500 border-slate-200" 
              />
              <p className="text-xs text-slate-400 font-medium mt-1">Email cannot be changed directly.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" /> Full name
              </Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={user.name ?? ""} 
                placeholder="Enter your full name" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-semibold text-slate-700 flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" /> Phone number
              </Label>
              <Input 
                id="phone" 
                name="phone" 
                type="tel" 
                defaultValue={user.phone ?? ""} 
                placeholder="+256 7XX XXX XXX" 
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="h-11 px-8 rounded-full bg-[#1e613c] hover:bg-[#15462b] text-white font-bold shadow-sm transition-all">
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
