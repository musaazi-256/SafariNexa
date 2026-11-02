import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireBusinessSession } from "@/lib/business";
import { db } from "@/lib/db";
import { dateKeyUTC } from "@/lib/booking";
import { AvailabilityCalendarEditor } from "@/components/business/availability-calendar-editor";

export default async function AvailabilityPage({params, searchParams}:{params:{id:string};searchParams:{room?:string}}) {
  const {businessId}=await requireBusinessSession();
  const listing=await db.listing.findUnique({where:{id:params.id},include:{accommodation:{include:{roomTypes:true}},tour:true}});
  if(!listing||listing.businessId!==businessId)notFound();
  const rooms=listing.accommodation?.roomTypes ?? [];
  const room=rooms.find(r=>r.id===searchParams.room) ?? rooms[0];
  if(listing.type!=="TOUR"&&!room)notFound();
  const rows=await db.availability.findMany({where:{listingId:listing.id,roomTypeId:room?.id ?? null}});
  const byDate=Object.fromEntries(rows.map(row=>[dateKeyUTC(row.date),{capacity:row.capacity,remaining:row.remaining,priceOverrideMinor:row.priceOverrideMinor}]));
  async function update(data:FormData){
    "use server";
    const {session,businessId}=await requireBusinessSession();
    const member=await db.businessUser.findFirst({where:{userId:session.user.id,businessId,role:{in:["OWNER","MANAGER"]}}});
    if(!member||listing!.businessId!==businessId)throw new Error("Unauthorized");
    const date=new Date(String(data.get("date"))+"T00:00:00.000Z");
    const capacity=Number(data.get("capacity"));
    const override=String(data.get("priceOverrideMinor")??"").trim();
    const price=override ? Number(override) : null;
    if(isNaN(date.getTime())||date<new Date(new Date().setUTCHours(0,0,0,0))||!Number.isInteger(capacity)||capacity<0||capacity>(room?.totalRooms??listing!.tour?.groupSizeMax??0)|| (price!==null&&(!Number.isSafeInteger(price)||price<0)))throw new Error("Enter a valid future date, capacity and price.");
    await db.$transaction(async tx=>{
      const blocked=["CANCELLED_BY_CUSTOMER","CANCELLED_BY_BUSINESS","CANCELLED_BY_ADMIN","REFUNDED","PAYMENT_FAILED"] as const;
      const tomorrow=new Date(date);tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
      const bookings=await tx.booking.findMany({where:{listingId:params.id,roomTypeId:room?.id??null,status:{notIn:[...blocked]},startDate:room?{lte:date}:{gte:date,lt:tomorrow},...(room?{endDate:{gt:date}}:{})}});
      const occupied=room?bookings.length:bookings.reduce((sum,b)=>sum+b.participantsCount,0);
      if(capacity<occupied)throw new Error("Capacity cannot be lower than existing reservations. Cancel bookings through the booking workflow first.");
      const values={capacity,remaining:capacity-occupied,priceOverrideMinor:price};
      if(room)await tx.availability.upsert({where:{listingId_roomTypeId_date:{listingId:params.id,roomTypeId:room.id,date}},create:{listingId:params.id,roomTypeId:room.id,date,...values},update:values});
      else await tx.availability.upsert({where:{id:`tour:${params.id}:${dateKeyUTC(date)}`},create:{id:`tour:${params.id}:${dateKeyUTC(date)}`,listingId:params.id,roomTypeId:null,date,...values},update:values});
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    revalidatePath(`/business/listings/${params.id}/availability`);
    revalidatePath(`/accommodation/${params.id}`);revalidatePath(`/tours/${params.id}`);
  }
  return <div className="mx-auto max-w-2xl space-y-5"><Link href={`/business/listings/${listing.id}/edit`} className="underline">Back to listing</Link><h1 className="break-words text-2xl font-bold">Availability — {listing.title}</h1><p>Capacity includes existing bookings. Set zero to close an unbooked date. Prices are whole UGX and are confirmed at checkout.</p>
  <div className="flex flex-wrap gap-3">{rooms.map(r=><Link className="rounded-full border px-4 py-2" aria-current={r.id===room?.id?"page":undefined} key={r.id} href={`?room=${r.id}`}>{r.name}</Link>)}</div>
  <AvailabilityCalendarEditor listingId={listing.id} basePriceMinor={room?.priceMinor??listing.basePriceMinor} availabilityByDate={byDate} action={update}/></div>;
}
