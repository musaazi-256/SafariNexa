import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
async function main(){
 if(process.env.SAFARINEXA_DEMO_MODE==="false")throw new Error("Demo page checks only.");
 const origin="http://localhost:3001";
 const cookies=new Map<string,string>();
 function remember(response:Response){for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0];const i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}}
 function cookieHeader(){return [...cookies].map(([key,value])=>`${key}=${value}`).join('; ');}
 async function login(surface:string){cookies.clear();const csrf=await fetch(`${origin}/api/auth/csrf`);remember(csrf);const {csrfToken}=await csrf.json();const response=await fetch(`${origin}/api/auth/callback/demo`,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Cookie:cookieHeader()},body:new URLSearchParams({csrfToken,surface,callbackUrl:origin}),redirect:"manual"});remember(response);if(response.status>=400)throw new Error(`Demo sign-in failed (${response.status})`);}
 const {db}=await import('../src/lib/db');
 try{
 const business=await db.businessProfile.findUniqueOrThrow({where:{slug:"nile-crater-lodges"}});
 const booking=await db.booking.findFirstOrThrow({where:{businessId:business.id,status:"REFUND_REQUESTED"}});
 async function page(path:string,marker:string){const response=await fetch(origin+path,{headers:{Cookie:cookieHeader()},redirect:"manual"});const body=await response.text();if(response.status!==200||!body.includes(marker)||/:E\{/.test(body)||body.includes('PrismaClientKnownRequestError'))throw new Error(`Page check failed: ${path} (${response.status})`);console.log(`PASS ${path}`);}
 await login('business');cookies.set('active_business',business.id);
 for(const path of ['/business/payments','/business/payments?status=unpaid','/business/payments?status=refunds','/business/customers','/business/bookings'])await page(path,path.includes('customers')?'Customers':path==='/business/bookings'?'Bookings':'Payments');
 await page(`/business/bookings/${booking.id}`,'Payments &amp; refunds');
 await login('admin');await page(`/admin/bookings/${booking.id}`,'Payments &amp; refunds');await page('/admin/payments','Payments');
 }finally{await db.$disconnect();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
