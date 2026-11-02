import { Prisma } from "@prisma/client";
import { parseBaseFields,parseAccommodationFields,parseRoomTypeRows,parseAddOnRows,parseTourFields,parseRestaurantFields,parseTransportFields } from "@/lib/business-listing-form";
import { listingSnapshot,reviewInclude } from "@/lib/listing-review";
type Catalogue = Prisma.ListingGetPayload<{include:typeof reviewInclude}>;
export function serializeListingForm(form:FormData): Prisma.InputJsonObject {
 const value: Record<string,string[]>={};
 for(const key of new Set(Array.from(form.keys()))) {if(key.startsWith("$ACTION_"))continue;const entries=form.getAll(key);if(entries.some(entry=>typeof entry!=="string"))throw new Error("Upload images before saving.");value[key]=entries.map(String);}
 return value;
}
export function restoreListingForm(value:unknown) {
 const form=new FormData();if(!value || typeof value!=="object" || Array.isArray(value))throw new Error("Invalid draft revision.");
 for(const [key,entries] of Object.entries(value)) {if(!Array.isArray(entries)||entries.some(entry=>typeof entry!=="string"))throw new Error("Invalid draft fields.");for(const entry of entries)form.append(key,entry);}
 return form;
}
export async function revisionPreview(tx:Prisma.TransactionClient,listing:Catalogue,form:FormData) {
 const base=parseBaseFields(form);
 const proposed={...listing,...base,destination:base.destinationId ? await tx.destination.findUnique({where:{id:base.destinationId}}):null};
 if(listing.type==="ACCOMMODATION") {
  const rooms=parseRoomTypeRows(form),addOns=parseAddOnRows(form),existing=listing.accommodation;
  if(!existing)throw new Error("Accommodation details missing.");
  if(rooms.some(row=>row.id&&!existing.roomTypes.some(room=>room.id===row.id))||addOns.some(row=>row.id&&!existing.addOns.some(addOn=>addOn.id===row.id)))throw new Error("Invalid room or add-on selection.");
  return listingSnapshot({...proposed,accommodation:{...existing,...parseAccommodationFields(form),roomTypes:rooms.map(row=>({...existing.roomTypes.find(room=>room.id===row.id),...row})),addOns:addOns.map(row=>({...existing.addOns.find(addOn=>addOn.id===row.id),...row}))}});
 }
 if(listing.type==="TOUR") {const tour=parseTourFields(form);if(tour.guideId&&!await tx.guide.findFirst({where:{id:tour.guideId,businessId:listing.businessId}}))throw new Error("Invalid guide selected.");return listingSnapshot({...proposed,tour:{...listing.tour,...tour}});}
 if(listing.type==="RESTAURANT") {const restaurant=parseRestaurantFields(form);return listingSnapshot({...proposed,restaurant:{...listing.restaurant,...restaurant,openingHours:restaurant.openingHours===Prisma.DbNull?null:restaurant.openingHours}});}
 return listingSnapshot({...proposed,transport:{...listing.transport,...parseTransportFields(form)}});
}
export async function applyListingRevision(tx:Prisma.TransactionClient,listing:Catalogue,form:FormData) {
 await revisionPreview(tx,listing,form);
 await tx.listing.update({where:{id:listing.id},data:parseBaseFields(form)});
 if(listing.type==="ACCOMMODATION") {
  const rooms=parseRoomTypeRows(form),addOns=parseAddOnRows(form);
  const roomIds=rooms.flatMap(row=>row.id?[row.id]:[]),addOnIds=addOns.flatMap(row=>row.id?[row.id]:[]);
  if(await tx.roomType.count({where:{accommodationId:listing.id,id:{notIn:roomIds},bookings:{some:{}}}})||await tx.addOn.count({where:{accommodationId:listing.id,id:{notIn:addOnIds},bookingAddOns:{some:{}}}}))throw new Error("Rooms or add-ons used by bookings must be retained in the revision.");
  await tx.accommodationListing.update({where:{listingId:listing.id},data:parseAccommodationFields(form)});
  await tx.roomType.deleteMany({where:{accommodationId:listing.id,id:{notIn:roomIds}}});await tx.addOn.deleteMany({where:{accommodationId:listing.id,id:{notIn:addOnIds}}});
  for(const row of rooms){const {id,...data}=row;if(id)await tx.roomType.update({where:{id},data});else await tx.roomType.create({data:{...data,accommodationId:listing.id}});}
  for(const row of addOns){const {id,...data}=row;if(id)await tx.addOn.update({where:{id},data});else await tx.addOn.create({data:{...data,accommodationId:listing.id}});}
 } else if(listing.type==="TOUR")await tx.tourListing.update({where:{listingId:listing.id},data:parseTourFields(form)});
 else if(listing.type==="RESTAURANT")await tx.restaurantProfile.update({where:{listingId:listing.id},data:parseRestaurantFields(form)});
 else await tx.transportOption.update({where:{listingId:listing.id},data:parseTransportFields(form)});
}
