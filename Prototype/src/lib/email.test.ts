/** @jest-environment node */
import { emailConfigured, sendAccountEmail } from "./email";
import { db } from "./db";
jest.mock("./db",()=>({db:{auditLog:{create:jest.fn()}}}));
describe("Demo email delivery",()=>{
 const env=process.env;
 beforeEach(()=>{jest.clearAllMocks();process.env={...env,SAFARINEXA_DEMO_MODE:"true",RESEND_API_KEY:"",EMAIL_FROM:""};});
 afterEach(()=>{process.env=env;jest.restoreAllMocks();});
 it("puts usable messages in the demo inbox without network access",async()=>{
  const fetchMock=jest.spyOn(global,"fetch");
  expect(emailConfigured()).toBe(true);
  await sendAccountEmail("test@example.test","Invitation","Open http://localhost:3000/admin/auth/accept?token=example","test-key");
  expect(db.auditLog.create).toHaveBeenCalledWith({data:expect.objectContaining({action:"demo_email",actorEmail:"test@example.test",metadata:expect.objectContaining({subject:"Invitation",text:expect.stringContaining("token=example")})})});
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("does not simulate live delivery without credentials",async()=>{
  process.env.SAFARINEXA_DEMO_MODE="false";
  expect(emailConfigured()).toBe(false);
  await expect(sendAccountEmail("test@example.test","Invitation","body","key")).rejects.toThrow("not configured");
  expect(db.auditLog.create).not.toHaveBeenCalled();
 });
});
