"use server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import type { FulfilmentDetails } from "@/lib/booking-operations";
export async function assignTransfer(form:FormData) {
 const {businessId,session}=await requireBusinessSession();
 const id=String(form.get("bookingId")||"");
 const driverName=String(form.get("driverName")||"").trim(),driverPhone=String(form.get("driverPhone")||"").trim(),vehicleRegistration=String(form.get("vehicleRegistration")||"").trim();
 if(!driverName||driverName.length>120||!/^\+?[\d ()-]{7,30}$/.test(driverPhone)||!vehicleRegistration||vehicleRegistration.length>40)throw new Error("Enter the driver’s name, valid contact number and vehicle registration.");
 await db.$transaction(async tx=>{
  const booking=await tx.booking.findUnique({where:{id},include:{listing:true}});
  if(!booking||booking.businessId!==businessId||booking.listing.type!=="TRANSPORT"||booking.status!=="CONFIRMED"||!await tx.businessUser.findFirst({where:{businessId:booking.businessId,userId:session.user.id,role:{in:["OWNER","MANAGER"]}}}))throw new Error("Only authorised managers can assign a confirmed transfer.");
  await tx.booking.update({where:{id},data:{fulfilment:{...(booking.fulfilment as FulfilmentDetails|null),driverName,driverPhone,vehicleRegistration}}});
  await tx.notification.create({data:{userId:booking.customerId,type:"BOOKING_UPDATE",title:"Transfer driver assigned",body:`Your transfer ${booking.bookingRef} has updated driver and vehicle details. Open the booking to view them.`,relatedBookingId:id}});
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 revalidatePath(`/business/bookings/${id}`);revalidatePath(`/bookings/${id}`);revalidatePath("/business/dashboard");
}
