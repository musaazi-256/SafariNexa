import { SiteHeader } from "@/components/site-header";
import { AccountEmailForm } from "@/components/account-email-form";
export default function VerifyEmailPage({searchParams}:{searchParams:{token?:string}}){return <><SiteHeader/><main className="container max-w-lg space-y-5 py-12"><h1 className="text-2xl font-bold">Verify your email</h1><p>{searchParams.token?"Confirm below to verify ownership of this email address.":"Request a single-use email verification link."}</p><AccountEmailForm purpose="verify" token={searchParams.token}/></main></>;}
