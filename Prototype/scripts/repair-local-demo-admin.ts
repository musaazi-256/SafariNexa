import {loadEnvConfig} from "@next/env";
loadEnvConfig(process.cwd());
import {db} from "../src/lib/db";
async function main(){
 const url=new URL(process.env.SAFARINEXA_PRISMA_DATABASE_URL!);
 if(url.hostname!=="localhost"||url.pathname!=="/safarinexa"||!process.argv.includes("--confirmed"))throw new Error("Requires explicit human approval and the named local demo database.");
 await db.$transaction(async tx=>{
  const role=await tx.role.findUniqueOrThrow({where:{name:"Super Admin"}});
  const admin=await tx.adminUser.findFirstOrThrow({where:{user:{email:"admin@safarinexa.test"},status:"ACTIVE"},include:{role:true}});
  await tx.adminUser.update({where:{id:admin.id},data:{roleId:role.id}});
  await tx.auditLog.create({data:{surface:"ADMIN",action:"demo_admin_role_repaired",outcome:"SUCCESS",metadata:{account:"admin@safarinexa.test",previousRole:admin.role.name,newRole:role.name,scope:"localhost safarinexa demo only",authority:"Explicit human approval in the current chat"}}});
 });
 console.log("Repaired admin@safarinexa.test using the existing Super Admin role in the localhost demo only. Password and other accounts unchanged.");
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>db.$disconnect());
