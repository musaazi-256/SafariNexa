import { SiteHeader } from "@/components/site-header";
import { AccountEmailForm } from "@/components/account-email-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
export default function ResetPasswordPage({searchParams}:{searchParams:{token?:string}}) {
  return <><SiteHeader /><main><Container className="flex min-h-[70vh] items-center justify-center py-14"><Card className="w-full max-w-md"><CardHeader><CardTitle>Choose a new password</CardTitle><CardDescription>Enter and confirm your new password to secure your account.</CardDescription></CardHeader><CardContent><AccountEmailForm purpose="reset" token={searchParams.token} /></CardContent></Card></Container></main></>;
}
