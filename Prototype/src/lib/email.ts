import { isDemoMode } from "@/lib/dev-mode";
import { db } from "@/lib/db";
/** Provider contract: https://resend.com/docs/api-reference/emails/send-email */
export function emailConfigured() { return isDemoMode() || Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && (process.env.AUTH_URL || process.env.NEXTAUTH_URL)); }
export function applicationOrigin() {
  const origin=process.env.AUTH_URL||process.env.NEXTAUTH_URL||(isDemoMode()?"http://localhost:3000":undefined);
  if(!origin)throw new Error("Application URL is not configured.");
  const url=new URL(origin);
  if(!isDemoMode() && process.env.NODE_ENV==="production" && url.protocol!=="https:")throw new Error("A secure application URL is required.");
  return url.origin;
}
export async function sendAccountEmail(to:string,subject:string,text:string,key:string) {
  if(isDemoMode()) {
    await db.auditLog.create({data:{surface:"CUSTOMER",action:"demo_email",outcome:"SUCCESS",actorEmail:to,metadata:{subject,text,key}}});
    return;
  }
  if(!emailConfigured())throw new Error("Email delivery is not configured.");
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json","Idempotency-Key":key},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[to],subject,text}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error("Email delivery failed. Please try again later.");
}
