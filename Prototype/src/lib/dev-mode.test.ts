import { isDemoMode } from "./dev-mode";
describe("Demo mode",()=>{
 const env=process.env;
 afterEach(()=>{process.env=env;});
 it("works in deployed production builds without integration keys",()=>{process.env={...env,NODE_ENV:"production"};delete process.env.SAFARINEXA_DEMO_MODE;expect(isDemoMode()).toBe(true);});
 it("can be explicitly disabled for live operation",()=>{process.env={...env,SAFARINEXA_DEMO_MODE:"false"};expect(isDemoMode()).toBe(false);});
});
