import {assignTransfer} from "./fulfilment";
import {db} from "@/lib/db";
jest.mock("next/cache",()=>({revalidatePath:jest.fn()}));
jest.mock("@/lib/business",()=>({requireBusinessSession:jest.fn().mockResolvedValue({businessId:"business",session:{user:{id:"manager"}}})}));
jest.mock("@/lib/db",()=>({db:{$transaction:jest.fn(),booking:{findUnique:jest.fn(),update:jest.fn()},businessUser:{findFirst:jest.fn()},notification:{create:jest.fn()}}}));
const mock=db as unknown as {$transaction:jest.Mock;booking:Record<string,jest.Mock>;businessUser:Record<string,jest.Mock>;notification:Record<string,jest.Mock>};
const booking={id:"booking",businessId:"business",customerId:"customer",bookingRef:"BK-E2E",status:"CONFIRMED",listing:{type:"TRANSPORT"},fulfilment:{pickup:"Airport",dropoff:"Hotel",notes:"One suitcase"}};
function form(){const data=new FormData();for(const [key,value]of Object.entries({bookingId:"booking",driverName:"Demo Driver",driverPhone:"+256700000000",vehicleRegistration:"DEMO-TEST"}))data.set(key,value);return data;}
beforeEach(()=>{jest.clearAllMocks();mock.$transaction.mockImplementation(fn=>fn(mock));mock.booking.findUnique.mockResolvedValue(booking);mock.businessUser.findFirst.mockResolvedValue({userId:"manager"});});
test("assignment preserves pickup instructions and notifies the booked customer",async()=>{await assignTransfer(form());expect(mock.booking.update).toHaveBeenCalledWith({where:{id:"booking"},data:{fulfilment:expect.objectContaining({pickup:"Airport",dropoff:"Hotel",notes:"One suitcase",driverName:"Demo Driver",vehicleRegistration:"DEMO-TEST"})}});expect(mock.notification.create).toHaveBeenCalledWith({data:expect.objectContaining({userId:"customer",relatedBookingId:"booking"})});});
test("another business cannot assign a transfer",async()=>{mock.booking.findUnique.mockResolvedValue({...booking,businessId:"other"});await expect(assignTransfer(form())).rejects.toThrow("authorised");expect(mock.booking.update).not.toHaveBeenCalled();});
test("unconfirmed transfers cannot be assigned",async()=>{mock.booking.findUnique.mockResolvedValue({...booking,status:"PENDING_PAYMENT"});await expect(assignTransfer(form())).rejects.toThrow("confirmed");});
test("assignment requires a management role",async()=>{mock.businessUser.findFirst.mockResolvedValue(null);await expect(assignTransfer(form())).rejects.toThrow("authorised");});
test("invalid driver details are rejected before writing",async()=>{const data=form();data.set("driverPhone","bad");await expect(assignTransfer(data)).rejects.toThrow("valid");expect(mock.booking.update).not.toHaveBeenCalled();});
