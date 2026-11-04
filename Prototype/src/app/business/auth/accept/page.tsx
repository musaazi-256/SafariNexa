import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { auth } from "@/auth";
import { acceptInvitation } from "@/lib/actions/accept-invitation";
import { Button } from "@/components/ui/button";
export default async function AcceptBusiness({searchParams}:{searchParams:{token?:string}}){
 const session=await auth();const back=`/business/auth/accept?token=${encodeURIComponent(searchParams.token??"")}`;
 return <main className="container flex min-h-screen max-w-md flex-col justify-center gap-6 py-12"><Link href="/" className="self-center"><Logo /></Link><Card><CardHeader><CardTitle className="text-2xl">Join your business</CardTitle><CardDescription>Sign in with the invited email address to join this business.</CardDescription></CardHeader><CardContent>{session?.user ? <form action={acceptInvitation}><input type="hidden" name="token" value={searchParams.token??""}/><input type="hidden" name="surface" value="business"/><Button className="w-full">Join business</Button></form> : <Button asChild className="w-full"><Link href={`/business/auth/sign-in?returnTo=${encodeURIComponent(back)}`}>Sign in to accept</Link></Button>}</CardContent></Card></main>;
}
