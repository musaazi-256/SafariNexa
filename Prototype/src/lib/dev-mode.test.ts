import { DEMO_AUTH_SECRET, getAuthSecret, isDemoMode } from "./dev-mode";
describe("Demo mode",()=>{
 const env=process.env;
 afterEach(()=>{process.env=env;});
 it("works in deployed production builds without integration keys",()=>{process.env={...env,NODE_ENV:"production"};delete process.env.SAFARINEXA_DEMO_MODE;expect(isDemoMode()).toBe(true);});
 it("can be explicitly disabled for live operation",()=>{process.env={...env,SAFARINEXA_DEMO_MODE:"false"};expect(isDemoMode()).toBe(false);});
});

describe("getAuthSecret", () => {
  const original = process.env;
  afterEach(() => { process.env = original; });
  it("uses AUTH_SECRET when set", () => {
    process.env = { ...original, AUTH_SECRET: "real-secret" };
    expect(getAuthSecret()).toBe("real-secret");
  });
  it("falls back to the public demo secret only in demo mode", () => {
    process.env = { ...original, AUTH_SECRET: "" };
    delete process.env.SAFARINEXA_DEMO_MODE;
    expect(getAuthSecret()).toBe(DEMO_AUTH_SECRET);
  });
  it("has no fallback in live mode", () => {
    process.env = { ...original, AUTH_SECRET: "", SAFARINEXA_DEMO_MODE: "false" };
    expect(getAuthSecret()).toBeUndefined();
  });
});
