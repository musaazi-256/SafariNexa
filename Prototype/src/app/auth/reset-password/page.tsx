import { SiteHeader } from "@/components/site-header";
import { AccountEmailForm } from "@/components/account-email-form";
export default function ResetPasswordPage({searchParams}:{searchParams:{token?:string}}){return <><SiteHeader/><main className="container max-w-lg space-y-5 py-12"><h1 className="text-2xl font-bold">Choose a new password</h1><AccountEmailForm purpose="reset" token={searchParams.token}/></main></>;}
