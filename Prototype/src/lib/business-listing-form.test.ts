import { parseBaseFields, parseRoomTypeRows, parseAddOnRows, parseAccommodationFields, parseTourFields, parseRestaurantFields, parseTransportFields } from "./business-listing-form";
function form(values: Record<string,string | string[]>) {const data=new FormData();for(const [key,value] of Object.entries(values))for(const item of Array.isArray(value)?value:[value])data.append(key,item);return data;}
test("base form preserves cover/gallery and clears removed location fields",()=>{
 const parsed=parseBaseFields(form({title:"Test",basePriceMinor:"10000",coverImageUrl:"cover.jpg",images:["one.jpg","two.jpg"]}));
 expect(parsed).toEqual(expect.objectContaining({coverImageUrl:"cover.jpg",images:["one.jpg","two.jpg"],address:null,destinationId:null,latitude:null}));
});
test("map coordinates must be finite and in range",()=>{
 for(const latitude of ["NaN","Infinity","91"])expect(()=>parseBaseFields(form({title:"Test",basePriceMinor:"1",latitude}))).toThrow("latitude");
});
test("room photos and removed optional values round-trip explicitly",()=>{
 const [room]=parseRoomTypeRows(form({roomTypeCount:"1",roomTypeName_0:"Double",roomTypeImages_0:["a.jpg","b.jpg"]}));
 expect(room).toEqual(expect.objectContaining({images:["a.jpg","b.jpg"],description:null,refundPolicyText:null,discountNotice:null,isRefundable:false}));
});
test("clearing an add-on description clears storage",()=>{
 expect(parseAddOnRows(form({addOnCount:"1",addOnName_0:"Breakfast"}))[0].description).toBeNull();
});
test("accommodation times and cancellation text can be removed",()=>{
 expect(parseAccommodationFields(form({propertyType:"Lodge"}))).toEqual(expect.objectContaining({checkInTime:null,checkOutTime:null,cancellationPolicy:null}));
});
test("tour guide can be unassigned and itinerary preserves individual lines",()=>{
 expect(parseTourFields(form({itinerary:"Day one\nDay two"}))).toEqual(expect.objectContaining({guideId:null,difficulty:null,itinerary:["Day one","Day two"]}));
});
test("restaurant menu/capacity can be removed without retaining old values",()=>{
 expect(parseRestaurantFields(form({}))).toEqual(expect.objectContaining({menuUrl:null,seatingCapacity:null,acceptsReservationRequests:false}));
});
test("transport duration and pricing text can be removed",()=>{
 expect(parseTransportFields(form({vehicleType:"Van"}))).toEqual(expect.objectContaining({estimatedDurationMinutes:null,pricingModel:null}));
});
