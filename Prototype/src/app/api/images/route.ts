import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { LISTING_IMAGE_DIRECTORY } from "@/lib/listing-images";
export const runtime="nodejs";
export async function POST(req:Request){
 const session=await auth();
 if(!session?.user)return new Response("Unauthorized",{status:401});
 const member=await db.businessUser.findFirst({where:{userId:session.user.id,role:{in:["OWNER","MANAGER"]}}});
 if(!member)return new Response("Only business owners and managers can upload listing images.",{status:403});
 if(req.headers.get("origin")&&req.headers.get("origin")!==new URL(process.env.AUTH_URL||process.env.NEXTAUTH_URL||req.url).origin)return new Response("Forbidden origin",{status:403});
 if(process.env.NODE_ENV==="production"&&!process.env.PUBLIC_IMAGE_DIRECTORY)return new Response("Persistent image storage is not configured.",{status:503});
 if(Number(req.headers.get("content-length")||0)>6*1024*1024)return new Response("Image is too large.",{status:413});
 const form=await req.formData();const file=form.get("file");
 if(!(file instanceof File)||file.size<1||file.size>5*1024*1024)return new Response("Choose an image up to 5 MB.",{status:400});
 const data=Buffer.from(await file.arrayBuffer());
 const ext=data[0]===255&&data[1]===216&&data[2]===255?"jpg":data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?"png":data.subarray(0,4).toString()==="RIFF"&&data.subarray(8,12).toString()==="WEBP"?"webp":null;
 if(!ext)return new Response("Only JPEG, PNG and WebP images are accepted.",{status:400});
 await fs.mkdir(LISTING_IMAGE_DIRECTORY,{recursive:true,mode:0o700});
 const name=`${randomUUID()}.${ext}`;await fs.writeFile(path.join(LISTING_IMAGE_DIRECTORY,name),data,{flag:"wx",mode:0o600});
 await db.listingImageUpload.create({data:{filename:name,uploadedBy:session.user.id}});
 return Response.json({url:`/api/images/${name}`});
}
