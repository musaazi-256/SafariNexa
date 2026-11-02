import Link from "next/link";
import { auth } from "@/auth";
import { acceptInvitation } from "@/lib/actions/accept-invitation";
import { Button } from "@/components/ui/button";
export default async function AcceptAdmin({searchParams}:{searchParams:{token?:string}}){
 const session=await auth();const back=`/admin/auth/accept?token=${encodeURIComponent(searchParams.token??"")}`;
 return <main className="container max-w-lg space-y-5 py-12"><h1 className="text-2xl font-bold">Accept admin invitation</h1><p>Sign in with the invited email to accept your assigned role. This does not grant Super Admin access.</p>{session?.user?<form action={acceptInvitation}><input type="hidden" name="token" value={searchParams.token??""}/><input type="hidden" name="surface" value="admin"/><Button>Accept assigned role</Button></form>:<Link className="underline" href={`/auth/sign-in?returnTo=${encodeURIComponent(back)}`}>Sign in to accept</Link>}</main>;
}
