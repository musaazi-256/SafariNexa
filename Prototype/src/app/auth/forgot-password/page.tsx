import { SiteHeader } from "@/components/site-header";
import { AccountEmailForm } from "@/components/account-email-form";
export default function ForgotPasswordPage(){return <><SiteHeader/><main className="container max-w-lg space-y-5 py-12"><h1 className="text-2xl font-bold">Reset your password</h1><p>Request a single-use password reset link. Google-only accounts should use Google sign-in.</p><AccountEmailForm purpose="reset"/></main></>;}
