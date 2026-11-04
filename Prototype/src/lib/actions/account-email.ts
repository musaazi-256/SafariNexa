"use server";
import { isDemoMode } from "@/lib/dev-mode";
import { randomBytes,createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { emailConfigured, applicationOrigin, sendAccountEmail } from "@/lib/email";
export async function requestAccountEmail(_previous:{message:string},data:FormData) {
  if(!emailConfigured())return {message:"Email delivery is not configured. Please contact support; no reset or verification email has been sent."};
  const email=String(data.get("email")??"").trim().toLowerCase();
  const purpose=data.get("purpose")==="verify"?"verify":"reset";
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {message:"Enter a valid email address."};
  const generic={message:"If this account is eligible, a link has been sent. Check your inbox and spam folder. Links expire after 15 minutes."};
  const user=await db.user.findUnique({where:{email}});
  if(!user || (purpose==="reset"&&!user.passwordHash) || (purpose==="verify"&&user.emailVerified))return generic;
  const identifier=`${purpose}:${user.id}`;
  const existing=await db.verificationToken.findFirst({where:{identifier,expires:{gt:new Date(Date.now()+14*60*1000)}}});
  if(existing)return generic;
  const token=randomBytes(32).toString("hex"),digest=createHash("sha256").update(token).digest("hex");
  await db.$transaction([db.verificationToken.deleteMany({where:{identifier}}),db.verificationToken.create({data:{identifier,token:digest,expires:new Date(Date.now()+15*60*1000)}})]);
  try{
    await sendAccountEmail(email,purpose==="reset"?"Reset your SafariNexa password":"Verify your SafariNexa email",`Open this link to ${purpose==="reset"?"reset your password":"verify your email"}: ${applicationOrigin()}/auth/${purpose==="reset"?"reset-password":"verify"}?token=${token}\nIf you did not request this, ignore this email.`,`account:${digest}`);
  }catch{return {message:"Email delivery failed. Please try again in a minute. No password has been changed."};}
  return isDemoMode() ? {message:"Your message is ready. Open the Email inbox from the footer to continue."} : generic;
}
export async function finishAccountEmail(_previous:{message:string},data:FormData) {
  const token=String(data.get("token")??"");
  const purpose=data.get("purpose")==="verify"?"verify":"reset";
  if(!/^[a-f0-9]{64}$/.test(token))return {message:"This link is invalid or expired. Request a new one."};
  const digest=createHash("sha256").update(token).digest("hex");
  const record=await db.verificationToken.findUnique({where:{token:digest}});
  if(!record||record.expires<new Date()||!record.identifier.startsWith(purpose+":"))return {message:"This link is invalid or expired. Request a new one."};
  const password=String(data.get("password")??"");
  if(purpose==="reset"&&(password.length<12||password.length>128||password!==data.get("confirmPassword")))return {message:"Use 12–128 characters and matching passwords."};
  const hash=purpose==="reset"?await bcrypt.hash(password,12):null;
  try{
    await db.$transaction(async tx=>{
      const consumed=await tx.verificationToken.deleteMany({where:{token:digest,expires:{gt:new Date()}}});
      if(!consumed.count)throw new Error("Expired");
      await tx.user.update({where:{id:record.identifier.slice(purpose.length+1)},data:hash?{passwordHash:hash}:{emailVerified:new Date()}});
    });
  }catch{return {message:"This link could not be used. Request a new one."};}
  return {message:purpose==="reset"?"Password updated. You can now sign in. Other sessions will need to sign in again.":"Email verified. You can now continue with your account."};
}
