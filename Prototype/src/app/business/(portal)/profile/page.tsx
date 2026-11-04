import Link from "next/link";
import { redirect } from "next/navigation";
import { User, Mail, Phone, Pencil } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PersonalProfileForm } from "@/components/business/personal-profile-form";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { updateBusinessPersonalProfile } from "@/lib/actions/business-personal-profile";

export default async function BusinessPersonalProfilePage({searchParams}:{searchParams?:{edit?:string}}) {
  const {session,business,businessId,account} = await requireBusinessSession();
  if (!businessId || !business || !account) redirect("/business/onboarding");
  const membership = await db.businessUser.findUnique({
    where:{businessId_userId:{businessId,userId:session.user.id}},select:{role:true}
  });
  if (!membership) redirect("/business/onboarding");
  const editing = searchParams?.edit === "profile";
  const role = {OWNER:"Business owner",MANAGER:"Manager",STAFF:"Staff"}[membership.role];
  return <div className="mx-auto max-w-[800px] space-y-6 pb-20">
    <PageHero variant="portal" title="My profile" description="Manage your personal account details and contact information." />
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
              {account.image && <AvatarImage src={account.image} alt={account.name ?? "Your profile"} />}
              <AvatarFallback><User aria-hidden="true" className="h-8 w-8" /></AvatarFallback>
            </Avatar>
            <div className="min-w-0"><CardTitle className="break-words text-xl">{account.name || account.email}</CardTitle><CardDescription className="mt-1 break-words">{role} · {business.name}</CardDescription></div>
          </div>
          {!editing && <Button asChild variant="outline"><Link href="/business/profile?edit=profile"><Pencil aria-hidden="true" />Edit profile</Link></Button>}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-8">
        {editing ? <PersonalProfileForm name={account.name ?? ""} phone={account.phone ?? ""} email={account.email} action={updateBusinessPersonalProfile} /> : <dl className="max-w-lg space-y-6">
          <div><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Mail aria-hidden="true" className="h-4 w-4" />Email address</dt><dd className="mt-2 break-words text-sm font-medium">{account.email}</dd></div>
          <div><dt className="flex items-center gap-2 text-sm text-muted-foreground"><User aria-hidden="true" className="h-4 w-4" />Full name</dt><dd className="mt-2 break-words text-sm font-medium">{account.name || "Not provided"}</dd></div>
          <div><dt className="flex items-center gap-2 text-sm text-muted-foreground"><Phone aria-hidden="true" className="h-4 w-4" />Phone number</dt><dd className="mt-2 break-words text-sm font-medium">{account.phone || "Not provided"}</dd></div>
        </dl>}
        <p className="mt-6 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">These personal details are used across your SafariNexa account. Manage your business’s registered details in <Link href="/business/settings" className="text-primary underline underline-offset-4">Business settings</Link>.</p>
      </CardContent>
    </Card>
  </div>;
}
