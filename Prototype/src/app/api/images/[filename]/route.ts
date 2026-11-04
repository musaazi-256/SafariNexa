import fs from "fs/promises";
import path from "path";
import { LISTING_IMAGE_DIRECTORY } from "@/lib/listing-images";
import { auth } from "@/auth";
import { db } from "@/lib/db";
export const runtime="nodejs";
export async function GET(_req:Request,{params}:{params:{filename:string}}){
 if(!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(params.filename))return new Response("Not found",{status:404});
 const url=`/api/images/${params.filename}`;
 const references={OR:[{coverImageUrl:url},{images:{has:url}},{accommodation:{roomTypes:{some:{images:{has:url}}}}}]};
 const businessImage = await db.businessProfile.findFirst({where:{verificationStatus:"APPROVED",OR:[{logoUrl:url},{coverImageUrl:url}]},select:{id:true}});
 const published=await db.listing.findFirst({where:{status:"PUBLISHED",...references},select:{id:true}});
 if(!published&&!businessImage){
  const session=await auth();
  if(!session?.user)return new Response("Not found",{status:404});
  const admin=session.user.isAdmin?await db.adminUser.findFirst({where:{userId:session.user.id,status:"ACTIVE"}}):null;
  const uploaded=await db.listingImageUpload.findUnique({where:{filename:params.filename}});
  const ownReference=await db.listing.findFirst({where:{...references,business:{users:{some:{userId:session.user.id}}}},select:{id:true}});
  const ownBusinessImage=await db.businessProfile.findFirst({where:{OR:[{logoUrl:url},{coverImageUrl:url}],users:{some:{userId:session.user.id}}},select:{id:true}});
  if(!admin&&uploaded?.uploadedBy!==session.user.id&&!ownReference&&!ownBusinessImage)return new Response("Not found",{status:404});
 }
 try{const file=await fs.readFile(path.join(LISTING_IMAGE_DIRECTORY,params.filename));const ext=path.extname(params.filename);
 return new Response(file,{headers:{"Content-Type":ext===".jpg"?"image/jpeg":ext===".png"?"image/png":"image/webp","Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch{return new Response("Not found",{status:404});}
}
