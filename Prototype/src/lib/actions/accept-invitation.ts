"use server";
import { createHash } from "crypto";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
export async function acceptInvitation(data:FormData) {
 const session=await auth();
 if(!session?.user?.email)throw new Error("Sign in with the invited email first.");
 const token=String(data.get("token")??"");
 if(!/^[a-f0-9]{64}$/.test(token))throw new Error("Invalid invitation");
 const digest=createHash("sha256").update(token).digest("hex");
 const admin=data.get("surface")==="admin";
 await db.$transaction(async tx=>{
  if(admin){
   const record=await tx.verificationToken.findUnique({where:{token:digest}});
   if(!record||record.expires<new Date()||!record.identifier.startsWith("admin-invite:"))throw new Error("Invitation expired.");
   const target=await tx.adminUser.findUnique({where:{id:record.identifier.slice("admin-invite:".length)},include:{user:true}});
   if(!target||target.status!=="INVITED"||target.user.email.toLowerCase()!==session.user.email!.toLowerCase())throw new Error("Sign in with the invited email.");
   await tx.verificationToken.delete({where:{token:digest}});
   await tx.adminUser.update({where:{id:target.id},data:{status:"ACTIVE"}});
  }else{
   const invitation=await tx.businessInvitation.findUnique({where:{token:digest}});
   if(!invitation||invitation.status!=="PENDING"||invitation.expiresAt<new Date()||invitation.email.toLowerCase()!==session.user.email!.toLowerCase())throw new Error("Invitation expired or belongs to another email.");
   await tx.businessUser.upsert({where:{businessId_userId:{businessId:invitation.businessId,userId:session.user.id}},create:{businessId:invitation.businessId,userId:session.user.id,role:invitation.role},update:{}});
   await tx.businessInvitation.update({where:{id:invitation.id},data:{status:"ACCEPTED"}});
  }
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 redirect(admin?"/admin/login":"/business/dashboard");
}
