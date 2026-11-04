import { validateAndReserveBookings } from "./booking-service";
import { db } from "@/lib/db";
import type { CartItem } from "./cart";
jest.mock("@/lib/db",()=>({db:{$transaction:jest.fn()}}));
const tx={
 listing:{findUnique:jest.fn()}, availability:{findUnique:jest.fn(),upsert:jest.fn()},
 booking:{count:jest.fn(),aggregate:jest.fn(),create:jest.fn(),findMany:jest.fn()},
 order:{create:jest.fn()},businessUser:{findMany:jest.fn().mockResolvedValue([])},notification:{createMany:jest.fn()}
};
const details={fullName:"Audit Traveller",email:"audit@example.test",phone:"+256700000000"};
const base={id:"listing-1",businessId:"business-1",title:"Audit listing",status:"PUBLISHED",business:{verificationStatus:"APPROVED"},basePriceMinor:100000};
const item={id:"cart-1",listingId:"listing-1",title:"Audit listing",type:"tour",participants:2,startDate:"2099-12-05",addOnIds:[],totalMinor:200000,fulfilment:{pickup:"Entebbe airport",dropoff:"Kampala hotel"}} satisfies CartItem;
describe("Reservation service regressions",()=>{
 afterAll(()=>{delete process.env.SAFARINEXA_DEMO_MODE;});
 beforeEach(()=>{
  process.env.SAFARINEXA_DEMO_MODE="false";
  jest.clearAllMocks();
  (db.$transaction as jest.Mock).mockImplementation(fn=>fn(tx));
  tx.availability.findUnique.mockResolvedValue(null);
  tx.availability.upsert.mockImplementation(({create})=>Promise.resolve({...create,priceOverrideMinor:null}));
  tx.booking.count.mockResolvedValue(0);
  tx.booking.findMany.mockResolvedValue([]);
  tx.booking.aggregate.mockResolvedValue({_sum:{participantsCount:0}});
  tx.booking.create.mockImplementation(({data})=>Promise.resolve({id:"booking-1",...data}));
  tx.order.create.mockResolvedValue({id:"order-1"});
  tx.listing.findUnique.mockResolvedValue({...base,type:"TOUR",tour:{groupSizeMin:1,groupSizeMax:6}});
 });
 it("reserves a tour with a null room FK and stable resource key",async()=>{
  const result=await validateAndReserveBookings("customer-1",[item],details,true);
  expect(result.orderId).toBe("order-1");
  expect(tx.availability.upsert).toHaveBeenCalledWith(expect.objectContaining({where:{id:"tour:listing-1:2099-12-05"},create:expect.objectContaining({roomTypeId:null,remaining:4})}));
 });
 it("sends request-mode bookings to the business before payment",async()=>{
  tx.listing.findUnique.mockResolvedValue({...base,type:"TOUR",bookingMode:"REQUEST",tour:{groupSizeMin:1,groupSizeMax:6}});
  const result=await validateAndReserveBookings("customer-1",[item],details);
  expect(result.bookings[0].status).toBe("AWAITING_BUSINESS_CONFIRMATION");expect(result.bookings[0].responseDueAt).toBeInstanceOf(Date);expect(tx.notification.createMany).toHaveBeenCalled();
 });
 it("holds request listings for business acceptance in demo mode",async()=>{
  process.env.SAFARINEXA_DEMO_MODE="true";
  tx.listing.findUnique.mockResolvedValue({...base,type:"TOUR",bookingMode:"REQUEST",tour:{groupSizeMin:1,groupSizeMax:6}});
  const result=await validateAndReserveBookings("customer-1",[item],details,true);
  expect(result.bookings[0]).toEqual(expect.objectContaining({bookingMode:"REQUEST",status:"AWAITING_BUSINESS_CONFIRMATION",totalMinor:200000}));
  expect(tx.order.create).toHaveBeenCalledWith({data:expect.objectContaining({status:"AWAITING_BUSINESS_CONFIRMATION"})});
 });
 it("holds mixed demo requests until the payable requests are accepted",async()=>{
  process.env.SAFARINEXA_DEMO_MODE="true";
  tx.listing.findUnique.mockResolvedValueOnce({...base,type:"TOUR",bookingMode:"REQUEST",tour:{groupSizeMin:1,groupSizeMax:6}}).mockResolvedValueOnce({...base,id:"restaurant-1",type:"RESTAURANT",restaurant:{acceptsReservationRequests:true,seatingCapacity:10,openingHours:{summary:"Daily · 08:00 - 22:00"}}});
  await validateAndReserveBookings("customer-1",[item,{...item,listingId:"restaurant-1",type:"restaurant",time:"12:00"}],details,true);
  expect(tx.order.create).toHaveBeenCalledWith({data:expect.objectContaining({status:"AWAITING_BUSINESS_CONFIRMATION",totalMinor:200000})});
 });
 it("requires pickup and dropoff before reserving transport",async()=>{
  tx.listing.findUnique.mockResolvedValue({...base,type:"TRANSPORT",transport:{capacity:6,pricingModel:"Fixed fare per trip"}});
  await expect(validateAndReserveBookings("customer-1",[{...item,type:"transport",time:"12:00",fulfilment:{}}],details)).rejects.toThrow("pickup");
 });
 it("does not charge menu estimates for restaurant table reservations",async()=>{
  tx.listing.findUnique.mockResolvedValue({...base,type:"RESTAURANT",restaurant:{acceptsReservationRequests:true,seatingCapacity:10,openingHours:{summary:"Daily · 08:00 - 22:00"}}});
  const result=await validateAndReserveBookings("customer-1",[{...item,type:"restaurant",time:"12:00"}],details);
  expect(result.bookings[0]).toEqual(expect.objectContaining({bookingMode:"RESERVATION",totalMinor:0,status:"AWAITING_BUSINESS_CONFIRMATION"}));
 });
 it("counts repeated cart departures together",async()=>{
  await validateAndReserveBookings("customer-1",[item,item],details,true);
  expect(tx.availability.upsert.mock.calls[1][0].create.remaining).toBe(2);
 });
 it("rejects requests exceeding existing tour inventory",async()=>{
  tx.booking.aggregate.mockResolvedValue({_sum:{participantsCount:5}});
  await expect(validateAndReserveBookings("customer-1",[item],details)).rejects.toThrow("capacity");
 });
 it("rejects invalid participant counts",async()=>{await expect(validateAndReserveBookings("customer-1",[{...item,participants:-2}],details)).rejects.toThrow("participants");});
 it("enforces minimum tour group size",async()=>{
  tx.listing.findUnique.mockResolvedValue({...base,type:"TOUR",tour:{groupSizeMin:3,groupSizeMax:6}});
  await expect(validateAndReserveBookings("customer-1",[item],details)).rejects.toThrow("Minimum group size");
 });
 it("rejects reversed accommodation dates",async()=>{
  tx.listing.findUnique.mockResolvedValue({...base,type:"ACCOMMODATION",accommodation:{roomTypes:[{id:"room-1",maxOccupancy:2,totalRooms:3,priceMinor:100000}],addOns:[]}});
  await expect(validateAndReserveBookings("customer-1",[{...item,type:"accommodation",roomTypeId:"room-1",startDate:"2099-12-06",endDate:"2099-12-05"}],details)).rejects.toThrow("Check-out");
 });
 it("includes already-booked rooms when initializing inventory",async()=>{
  tx.listing.findUnique.mockResolvedValue({...base,type:"ACCOMMODATION",accommodation:{roomTypes:[{id:"room-1",maxOccupancy:2,totalRooms:3,priceMinor:100000}],addOns:[]}});
  tx.booking.count.mockResolvedValue(2);
  await validateAndReserveBookings("customer-1",[{...item,type:"accommodation",roomTypeId:"room-1",endDate:"2099-12-06"}],details);
  expect(tx.availability.upsert.mock.calls[0][0].create.remaining).toBe(0);
 });
 it("charges a fixed transport fare only once",async()=>{
  tx.listing.findUnique.mockResolvedValue({...base,type:"TRANSPORT",transport:{capacity:6,pricingModel:"Fixed fare per trip"}});
  const result=await validateAndReserveBookings("customer-1",[{...item,type:"transport",time:"12:00"}],details);
  expect(result.bookings[0].totalMinor).toBe(100000);
 });
 it("blocks restaurants that do not accept reservations",async()=>{
  tx.listing.findUnique.mockResolvedValue({...base,type:"RESTAURANT",restaurant:{acceptsReservationRequests:false,seatingCapacity:10}});
  await expect(validateAndReserveBookings("customer-1",[{...item,type:"restaurant",time:"12:00"}],details)).rejects.toThrow("not accepting");
 });
 it("rejects malformed traveller details before reserving",async()=>{
  await expect(validateAndReserveBookings("customer-1",[item],{...details,email:"bad"})).rejects.toThrow("traveller");
  expect(tx.availability.upsert).not.toHaveBeenCalled();
 });
 it("snapshots confirmed traveller defaults onto the booking participant",async()=>{
  await validateAndReserveBookings("customer-1",[item],{...details,nationality:"Ugandan",emergencyContact:"TEST CONTACT — not a real person"});
  expect(tx.booking.create.mock.calls[0][0].data.participants.create).toEqual(expect.objectContaining({nationality:"Ugandan",emergencyContact:"TEST CONTACT — not a real person"}));
 });
 it("demo mode respects request-to-book instead of bypassing the business",async()=>{
  process.env.SAFARINEXA_DEMO_MODE="true";
  tx.listing.findUnique.mockResolvedValue({...base,type:"TOUR",bookingMode:"REQUEST",tour:{groupSizeMin:1,groupSizeMax:6}});
  const result=await validateAndReserveBookings("customer-1",[item],details);
  expect(result.bookings[0]).toEqual(expect.objectContaining({bookingMode:"REQUEST",status:"AWAITING_BUSINESS_CONFIRMATION"}));
 });
 it("instant listings continue directly to payment in demo mode",async()=>{
  process.env.SAFARINEXA_DEMO_MODE="true";
  tx.listing.findUnique.mockResolvedValue({...base,type:"TOUR",bookingMode:"INSTANT",tour:{groupSizeMin:1,groupSizeMax:6}});
  const result=await validateAndReserveBookings("customer-1",[item],details);
  expect(result.bookings[0]).toEqual(expect.objectContaining({bookingMode:"INSTANT",status:"PENDING_PAYMENT"}));
 });

});
