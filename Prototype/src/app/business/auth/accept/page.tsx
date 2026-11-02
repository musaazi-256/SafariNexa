import Link from "next/link";
import { auth } from "@/auth";
import { acceptInvitation } from "@/lib/actions/accept-invitation";
import { Button } from "@/components/ui/button";
export default async function AcceptBusiness({searchParams}:{searchParams:{token?:string}}){
 const session=await auth();const back=`/business/auth/accept?token=${encodeURIComponent(searchParams.token??"")}`;
 return <main className="container max-w-lg space-y-5 py-12"><h1 className="text-2xl font-bold">Accept business invitation</h1><p>Sign in with the invited email to join this business.</p>{session?.user?<form action={acceptInvitation}><input type="hidden" name="token" value={searchParams.token??""}/><input type="hidden" name="surface" value="business"/><Button>Join business</Button></form>:<Link className="underline" href={`/business/auth/sign-in?returnTo=${encodeURIComponent(back)}`}>Sign in to accept</Link>}</main>;
}
