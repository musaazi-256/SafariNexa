"use client";
import { useFormState,useFormStatus } from "react-dom";
import Link from "next/link";
import { requestAccountEmail,finishAccountEmail } from "@/lib/actions/account-email";
import { Button } from "@/components/ui/button";
function Submit({label}:{label:string}){const{pending}=useFormStatus();return <Button type="submit" disabled={pending}>{pending?"Please wait…":label}</Button>;}
export function AccountEmailForm({purpose,token}:{purpose:"reset"|"verify";token?:string}){
 const [state,action]=useFormState(token?finishAccountEmail:requestAccountEmail,{message:""});
 return <form action={action} className="space-y-4">
 <input type="hidden" name="purpose" value={purpose}/>
 {token?<><input type="hidden" name="token" value={token}/>{purpose==="reset"&&<>
 <label className="block">New password<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className="form-control mt-2 w-full"/></label>
 <label className="block">Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={128} className="form-control mt-2 w-full"/></label></>}</>:<label className="block">Email<input name="email" type="email" autoComplete="email" required className="form-control mt-2 w-full"/></label>}
 <Submit label={token?(purpose==="reset"?"Update password":"Verify email"):"Send email link"}/>
 <p role="status" className="text-sm leading-relaxed">{state.message}</p><Link href="/auth/sign-in" className="block underline">Back to sign in</Link>
 </form>;
}
